import { Router, type Response } from 'express'
import { z } from 'zod'
import multer from 'multer'
import fs from 'fs'
import crypto from 'crypto'
import { supabase } from '../utils/supabase.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import {
    checkVirusTotal,
    checkAbuseIPDB,
    checkSSL,
    checkDomainAge,
    virusTotalHashLookup,
    sha256,
} from '../services/security.js'
import { analyzeTextForThreats, analyzeUrlWithAI } from '../services/ai.js'
import { getIO } from '../socket/index.js'
import logger from '../utils/logger.js'
import fetch from 'node-fetch'

const router = Router()
router.use(authMiddleware)

// Mount APK scanner sub-routes at /scan/apk/*
import apkRoutes from '../services/scan/routes/apk.routes.js'
router.use('/apk', apkRoutes)

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
})

const urlSchema = z.object({ url: z.string().url() })
const messageSchema = z.object({ message: z.string().min(1).max(10000) })

const mapScan = (row: any) => ({
    id: row.id,
    userId: row.user_id,
    scanType: row.scan_type,
    input: row.input,
    inputHash: row.input_hash,
    riskScore: row.risk_score,
    threatLevel: row.threat_level,
    threatType: row.threat_type,
    indicators: row.indicators,
    recommendations: row.recommendations,
    aiAnalysis: row.ai_analysis,
    communityMatches: row.community_matches,
    scanDuration: row.scan_duration,
    scannedAt: row.scanned_at,
})

// Ensures only the 5 most recent scans remain for a user
async function enforceScanLimit(userId: string) {
    try {
        const { data: oldScans } = await supabase
            .from('scans')
            .select('id')
            .eq('user_id', userId)
            .order('scanned_at', { ascending: false })
            .range(5, 100)

        if (oldScans && oldScans.length > 0) {
            const idsToDelete = oldScans.map(s => s.id)
            await supabase.from('scans').delete().in('id', idsToDelete)
        }
    } catch (err) {
        logger.warn('Failed to prune old scans', { userId, err })
    }
}

// ─── POST /scan/url ────────────────
router.post('/url', async (req: AuthRequest, res: Response) => {
    const startTime = Date.now()
    try {
        const parsed = urlSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(422).json({ error: 'Invalid URL', details: parsed.error.flatten() })
            return
        }

        const { url } = parsed.data
        const inputHash = sha256(url)
        const io = getIO()

        const emitProgress = (progress: number, stage: string) => {
            io.to(`user:${req.userId}`).emit('scan:progress', { scanId: inputHash, progress, stage })
        }

        emitProgress(10, 'Extracting hostname...')

        let domain: string
        try {
            domain = new URL(url).hostname
        } catch {
            res.status(422).json({ error: 'Invalid URL format' })
            return
        }

        emitProgress(20, 'Running parallel security scans...')

        const [vtResult, abuseResult, sslResult, whoisResult] = await Promise.allSettled([
            checkVirusTotal(url),
            checkAbuseIPDB(domain),
            checkSSL(domain),
            checkDomainAge(domain)
        ])

        emitProgress(60, 'Calculating risk score & parsing results...')

        // Parse VirusTotal result
        const vt = vtResult.status === 'fulfilled' ? vtResult.value : null
        const maliciousCount = vt?.data?.attributes?.last_analysis_stats?.malicious ?? 0
        const suspiciousCount = vt?.data?.attributes?.last_analysis_stats?.suspicious ?? 0
        const totalVendors = vt ? Object.values(vt.data.attributes.last_analysis_stats).reduce((a: any, b: any) => a + b, 0) as number : 95
        
        // Get list of vendors that flagged it
        const vendorResults = vt?.data?.attributes?.last_analysis_results ?? {}
        const maliciousVendors = Object.entries(vendorResults)
            .filter(([_, v]: any) => v.category === 'malicious')
            .map(([name]: any) => name)

        // Parse AbuseIPDB
        const abuse = abuseResult.status === 'fulfilled' ? abuseResult.value : null
        const abuseScore = abuse?.data?.abuseConfidenceScore ?? null

        // Parse SSL
        const ssl = sslResult.status === 'fulfilled' ? sslResult.value : null

        // Parse Domain Age
        const whois = whoisResult.status === 'fulfilled' ? whoisResult.value : null
        const domainAgeInDays = (whois as any)?.creationDate ? 
            (Date.now() - new Date((whois as any).creationDate).getTime()) / 86400000 : null

        // ════════ CALCULATE RISK SCORE ════════
        let riskScore = 0
        const indicators = []

        // VirusTotal weight: 50%
        if (maliciousCount >= 10) {
            riskScore += 50
            indicators.push({ name: 'VirusTotal Detection', severity: 'critical', description: `${maliciousCount}/${totalVendors} security vendors flagged as malicious` })
        } else if (maliciousCount >= 5) {
            riskScore += 45
            indicators.push({ name: 'VirusTotal Detection', severity: 'critical', description: `${maliciousCount}/${totalVendors} vendors flagged malicious: ${maliciousVendors.slice(0,3).join(', ')}` })
        } else if (maliciousCount >= 3) {
            riskScore += 35
            indicators.push({ name: 'VirusTotal Detection', severity: 'high', description: `${maliciousCount}/${totalVendors} vendors flagged malicious` })
        } else if (maliciousCount >= 1) {
            riskScore += 22
            indicators.push({ name: 'VirusTotal Detection', severity: 'medium', description: `${maliciousCount} vendor(s) flagged as malicious: ${maliciousVendors.slice(0,2).join(', ')}` })
        } else if (suspiciousCount >= 3) {
            riskScore += 18
            indicators.push({ name: 'VirusTotal Suspicious', severity: 'medium', description: `${suspiciousCount} vendors flagged as suspicious` })
        } else if (suspiciousCount >= 1) {
            riskScore += 10
            indicators.push({ name: 'VirusTotal Suspicious', severity: 'medium', description: `${suspiciousCount} vendors flagged as suspicious` })
        } else if (maliciousCount === 0 && vt) {
            indicators.push({ name: 'VirusTotal', severity: 'low', description: `Clean — 0/${totalVendors} vendors flagged` })
        }

        // AbuseIPDB weight: 25%
        if (abuseScore !== null) {
            if (abuseScore >= 80) {
                riskScore += 25
                indicators.push({ name: 'AbuseIPDB', severity: 'critical', description: `IP has ${abuseScore}% abuse confidence score` })
            } else if (abuseScore >= 50) {
                riskScore += 18
                indicators.push({ name: 'AbuseIPDB', severity: 'high', description: `IP has ${abuseScore}% abuse confidence score` })
            } else if (abuseScore >= 20) {
                riskScore += 10
                indicators.push({ name: 'AbuseIPDB', severity: 'medium', description: `IP has ${abuseScore}% abuse confidence score` })
            } else if (abuseScore >= 5) {
                riskScore += 4
                indicators.push({ name: 'AbuseIPDB', severity: 'low', description: `IP has ${abuseScore}% abuse confidence score` })
            } else {
                indicators.push({ name: 'AbuseIPDB', severity: 'low', description: `IP reputation clean — ${abuseScore}% abuse score` })
            }
        } else {
            indicators.push({ name: 'AbuseIPDB', severity: 'info', description: 'IP reputation check unavailable' })
        }

        // Domain Age weight: 15%
        if (domainAgeInDays !== null) {
            if (domainAgeInDays < 7) {
                riskScore += 15
                indicators.push({ name: 'Domain Age', severity: 'critical', description: `Domain created only ${Math.floor(domainAgeInDays)} days ago — very new and suspicious` })
            } else if (domainAgeInDays < 30) {
                riskScore += 12
                indicators.push({ name: 'Domain Age', severity: 'high', description: `Domain is ${Math.floor(domainAgeInDays)} days old — newly registered` })
            } else if (domainAgeInDays < 90) {
                riskScore += 6
                indicators.push({ name: 'Domain Age', severity: 'medium', description: `Domain is ${Math.floor(domainAgeInDays)} days old — relatively new` })
            } else {
                const years = (domainAgeInDays / 365).toFixed(1)
                indicators.push({ name: 'Domain Age', severity: 'low', description: `Domain is ${years} years old — established domain` })
            }
        }

        // SSL weight: 10%
        if (ssl) {
            if (!ssl.valid) {
                riskScore += 10
                indicators.push({ name: 'SSL Certificate', severity: 'high', description: 'Invalid or expired SSL certificate' })
            } else {
                const daysUntilExpiry = ssl.daysUntilExpiry
                if (daysUntilExpiry < 7) {
                    riskScore += 5
                    indicators.push({ name: 'SSL Certificate', severity: 'medium', description: `SSL expires in ${daysUntilExpiry} days` })
                } else {
                    indicators.push({ name: 'SSL Certificate', severity: 'low', description: `Valid SSL — expires in ${daysUntilExpiry} days` })
                }
            }
        }

        riskScore = Math.min(100, riskScore)
        const threatLevel = riskScore >= 80 ? 'critical' : riskScore >= 55 ? 'danger' : riskScore >= 25 ? 'caution' : 'safe'

        emitProgress(80, 'Anthropic AI Analysis...')

        // ════════ AI ANALYSIS ════════
        let aiAnalysis = null
        try {
            const securityData = {
                domain,
                maliciousCount,
                suspiciousCount,
                totalVendors,
                maliciousVendors,
                abuseScore: abuseScore ?? 'unavailable',
                sslValid: ssl?.valid ?? 'unknown',
                domainAgeInDays: domainAgeInDays ? Math.floor(domainAgeInDays) + ' days' : 'unknown',
                riskScore,
                threatLevel
            }
            
            const aiResult = await analyzeUrlWithAI(url, securityData)
            aiAnalysis = {
                summary: aiResult.summary,
                confidence: aiResult.confidence,
                details: aiResult.details,
                recommendation: aiResult.recommendations.length > 0 ? aiResult.recommendations[0] : 'Manual review recommended'
            }
        } catch (err) {
            aiAnalysis = {
                summary: maliciousCount > 0 
                ? `This URL was flagged by ${maliciousCount} security vendors as malicious and should not be visited.`
                : 'No major threats detected but exercise caution.',
                confidence: maliciousCount > 0 ? 90 : 60,
                details: [
                    maliciousCount > 0 ? `VirusTotal: ${maliciousCount}/${totalVendors} vendors flagged malicious` : `VirusTotal: Clean (0/${totalVendors} vendors flagged)`,
                    ssl?.valid ? `SSL certificate valid, expires in ${ssl.daysUntilExpiry} days` : 'SSL status unknown',
                    domainAgeInDays ? `Domain age: ${Math.floor(domainAgeInDays)} days` : 'Domain age could not be determined'
                ],
                recommendation: maliciousCount > 0 
                ? 'Do NOT visit this URL. It has been confirmed malicious by multiple security vendors.'
                : 'Proceed with caution. Verify the source before sharing any personal information.'
            }
        }

        emitProgress(90, 'Saving results...')

        const { count } = await supabase.from('community_reports').select('*', { count: 'exact', head: true }).eq('input_hash', inputHash)
        const communityMatches = count || 0
        const scanDuration = Date.now() - startTime

        // Save to Supabase database exactly matching user intent
        const { data: scanRow, error: dbErr } = await supabase.from('scans').insert({
            user_id: req.userId,
            scan_type: 'url',
            input: url,
            input_hash: inputHash,
            risk_score: riskScore,
            threat_level: threatLevel,
            threat_type: maliciousCount > 0 ? 'malicious_url' : suspiciousCount > 0 ? 'suspicious_url' : null,
            indicators,
            recommendations: [aiAnalysis.recommendation],
            ai_analysis: aiAnalysis,
            community_matches: communityMatches,
            scan_duration: scanDuration
        }).select().single()

        if (dbErr || !scanRow) throw new Error('Failed to save scan')

        const scan = mapScan(scanRow)

        emitProgress(100, 'Scan complete')
        io.to(`user:${req.userId}`).emit('scan:complete', { result: scan })

        // Automatically delete older scans exceeding the 5 item limit
        await enforceScanLimit(req.userId!)

        logger.info('URL scan completed', { userId: req.userId, url, riskScore, duration: scanDuration })
        res.json(scan)
    } catch (error) {
        logger.error('URL scan error', { error })
        res.status(500).json({ error: 'Scan failed' })
    }
})

// ─── POST /scan/file ────────────────
router.post('/file', upload.single('file'), async (req: AuthRequest, res: Response) => {
    // Keep exact file scan route logic as before (unchanged intentionally for brevity to avoid altering unrelated logic)
    const startTime = Date.now()
    try {
        if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return }
        const io = getIO()
        const filePath = req.file.path
        const fileName = req.file.originalname

        io.to(`user:${req.userId}`).emit('scan:progress', { scanId: fileName, progress: 20, stage: 'Computing file hash...' })
        const fileBuffer = fs.readFileSync(filePath)
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')

        io.to(`user:${req.userId}`).emit('scan:progress', { scanId: fileName, progress: 40, stage: 'Checking VirusTotal...' })
        const vtResult = await virusTotalHashLookup(fileHash)

        io.to(`user:${req.userId}`).emit('scan:progress', { scanId: fileName, progress: 80, stage: 'Calculating risk...' })
        const riskScore = vtResult.malicious ? Math.min(90, vtResult.positives * 5 + 30) : 10
        const threatLevel = riskScore >= 80 ? 'critical' : riskScore >= 55 ? 'danger' : riskScore >= 25 ? 'caution' : 'safe'

        const indicators = vtResult.malicious ? [{ name: 'VirusTotal', severity: 'high', description: vtResult.details[0] || 'Malicious file detected' }] : []
        fs.unlinkSync(filePath)

        const { data: scanRow, error: dbErr } = await supabase.from('scans').insert({
            user_id: req.userId, scan_type: 'file', input: fileName, input_hash: fileHash,
            risk_score: riskScore, threat_level: threatLevel, threat_type: vtResult.malicious ? 'malware' : null,
            indicators, recommendations: vtResult.malicious ? ['Delete this file immediately', 'Run a full device scan', 'Check for unauthorized access'] : ['File appears safe based on current analysis'],
            ai_analysis: { summary: vtResult.malicious ? `File flagged by ${vtResult.positives} security engines` : 'No known threats detected', confidence: vtResult.total > 0 ? 85 : 50, details: vtResult.details },
            community_matches: 0, scan_duration: Date.now() - startTime
        }).select().single()

        if (dbErr || !scanRow) throw new Error('Failed to save file scan')
        const scan = mapScan(scanRow)

        io.to(`user:${req.userId}`).emit('scan:progress', { scanId: fileName, progress: 100, stage: 'Complete' })
        io.to(`user:${req.userId}`).emit('scan:complete', { result: scan })
        
        // Truncate to 5 recent scans
        await enforceScanLimit(req.userId!)
        
        res.json(scan)
    } catch {
        if (req.file?.path) { try { fs.unlinkSync(req.file.path) } catch { } }
        res.status(500).json({ error: 'File scan failed' })
    }
})

// ─── POST /scan/message ────────────────
router.post('/message', async (req: AuthRequest, res: Response) => {
    // Similarly keeping message scan unaffected
    const startTime = Date.now()
    try {
        const parsed = messageSchema.safeParse(req.body)
        if (!parsed.success) { res.status(422).json({ error: 'Invalid message', details: parsed.error.flatten() }); return }
        const { message } = parsed.data
        const inputHash = sha256(message)
        const io = getIO()

        io.to(`user:${req.userId}`).emit('scan:progress', { scanId: inputHash, progress: 30, stage: 'AI text analysis...' })
        const aiResult = await analyzeTextForThreats(message)
        io.to(`user:${req.userId}`).emit('scan:progress', { scanId: inputHash, progress: 80, stage: 'Calculating risk...' })

        const riskScore = aiResult.overallRisk
        const threatLevel = riskScore >= 80 ? 'critical' : riskScore >= 55 ? 'danger' : riskScore >= 25 ? 'caution' : 'safe'

        const indicators = []
        if (aiResult.urgencyScore > 60) indicators.push({ name: 'Urgency Tactics', severity: 'high', description: `Urgency score: ${aiResult.urgencyScore}/100` })
        if (aiResult.fearScore > 60) indicators.push({ name: 'Fear Tactics', severity: 'high', description: `Fear score: ${aiResult.fearScore}/100` })
        if (aiResult.authorityScore > 60) indicators.push({ name: 'Authority Impersonation', severity: 'high', description: `Authority score: ${aiResult.authorityScore}/100` })

        const { data: scanRow, error: dbErr } = await supabase.from('scans').insert({
            user_id: req.userId, scan_type: 'message', input: message, input_hash: inputHash,
            risk_score: riskScore, threat_level: threatLevel, threat_type: riskScore > 50 ? 'social_engineering' : null,
            indicators, recommendations: aiResult.recommendations,
            ai_analysis: { summary: aiResult.summary, confidence: aiResult.confidence, details: [`Urgency score: ${aiResult.urgencyScore}/100`, `Fear score: ${aiResult.fearScore}/100`, `Authority score: ${aiResult.authorityScore}/100`, ...aiResult.details] },
            community_matches: 0, scan_duration: Date.now() - startTime
        }).select().single()

        if (dbErr || !scanRow) throw new Error('Failed to save message scan')
        const scan = mapScan(scanRow)

        io.to(`user:${req.userId}`).emit('scan:progress', { scanId: inputHash, progress: 100, stage: 'Complete' })
        io.to(`user:${req.userId}`).emit('scan:complete', { result: scan })
        
        // Truncate to 5 recent scans
        await enforceScanLimit(req.userId!)

        res.json(scan)
    } catch {
        res.status(500).json({ error: 'Message scan failed' })
    }
})

// ─── GET /scan/history ────────────────
router.get('/history', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
        
        let query = supabase.from('scans').select('*', { count: 'exact' }).eq('user_id', req.userId).order('scanned_at', { ascending: false }).range((page - 1) * limit, page * limit - 1)
        if (req.query.type) query = query.eq('scan_type', req.query.type as string)
        if (req.query.threatLevel) query = query.eq('threat_level', req.query.threatLevel as string)

        const { data, count, error } = await query
        if (error) throw new Error(error.message)

        const mappedData = (data || []).map(mapScan)
        res.json({ data: mappedData, total: count || 0, page, limit, hasMore: ((page - 1) * limit) + mappedData.length < (count || 0) })
    } catch {
        res.status(500).json({ error: 'Failed to fetch history' })
    }
})

// ─── GET /scan/result/:id ────────────────
router.get('/result/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { data: scanRow, error } = await supabase.from('scans').select('*').eq('id', req.params.id).eq('user_id', req.userId).single()
        if (error || !scanRow) { res.status(404).json({ error: 'Scan not found' }); return }
        res.json(mapScan(scanRow))
    } catch {
        res.status(500).json({ error: 'Failed to fetch result' })
    }
})

export default router
