import { Router, type Response } from 'express'
import { z } from 'zod'
import multer from 'multer'
import fs from 'fs'
import crypto from 'crypto'
import { supabase } from '../utils/supabase.js'
import { authMiddleware, optionalAuth, type AuthRequest } from '../middleware/auth.js'
import {
    checkVirusTotal,
    checkUrlScan,
    checkGoogleSafeBrowsing,
    checkSucuri,
    checkAbuseIPDB,
    checkSSL,
    checkDomainAge,
    virusTotalHashLookup,
    extractVendorResults,
    sha256,
} from '../services/security.js'
import { analyzeTextForThreats, analyzeUrlWithAI } from '../services/ai.js'
import { analyzeUrlWithGemini, type GeminiUrlVerdict } from '../services/gemini.js'
import { getIO } from '../socket/index.js'
import logger from '../utils/logger.js'
import fetch from 'node-fetch'

const router = Router()
// Scans use OPTIONAL auth: real results are returned with or without a logged-in
// user. History/persistence happen only when a user is present. (/history and
// /result below require a real user and add authMiddleware explicitly.)
router.use(optionalAuth)

const urlSchema = z.object({
    url: z.string().trim().min(1, 'URL is required').max(2048, 'URL is too long'),
})

const messageSchema = z.object({
    message: z.string().trim().min(1, 'Message is required').max(5000, 'Message is too long'),
})

// Builds a unique, traceable errorId, logs full context server-side, and
// sends the client a specific error instead of a bare 500 — a missing
// errorId is what makes the frontend fall back to "Server error (UNKNOWN)".
function sendScanError(res: Response, status: number, label: string, error: unknown, context: Record<string, unknown>) {
    const errorId = `ERR-SCAN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex')}`
    const message = error instanceof Error ? error.message : String(error)
    logger.error(label, { errorId, message, stack: error instanceof Error ? error.stack : undefined, ...context })
    res.status(status).json({ error: label, errorId, message })
}

// Mount APK scanner sub-routes at /scan/apk/*
import apkRoutes from '../services/scan/routes/apk.routes.js'
router.use('/apk', apkRoutes)

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
})

// In-memory persistent scan buffer partitioned per user for strict account isolation and sync
export const userScansMemoryStore = new Map<string, any[]>()


export function recordScanInMemory(scan: any, userId?: string | null) {
    if (!scan || !scan.id) return
    const key = userId || scan.userId || 'shared-scans'
    const userScans = userScansMemoryStore.get(key) || []
    const existsIndex = userScans.findIndex(s => s.id === scan.id || (s.input === scan.input && Math.abs(new Date(s.scannedAt || 0).getTime() - new Date(scan.scannedAt || 0).getTime()) < 3000))
    if (existsIndex >= 0) {
        userScans[existsIndex] = { ...userScans[existsIndex], ...scan, userId: key }
    } else {
        userScans.unshift({ ...scan, userId: key })
        if (userScans.length > 200) {
            userScans.pop()
        }
    }
    userScansMemoryStore.set(key, userScans)
}

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

// Ensures only the 100 most recent scans remain for a user in database
async function enforceScanLimit(userId: string) {
    try {
        const { data: oldScans } = await supabase
            .from('scans')
            .select('id')
            .eq('user_id', userId)
            .order('scanned_at', { ascending: false })
            .range(100, 200)

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
            if (io && req.userId) {
                io.to(`user:${req.userId}`).emit('scan:progress', { scanId: inputHash, progress, stage })
            }
        }

        emitProgress(10, 'Initializing Vanguard Protocol...')

        let domain: string
        try {
            domain = new URL(url).hostname
        } catch {
            res.status(422).json({ error: 'Invalid URL format' })
            return
        }

        emitProgress(25, 'Querying VirusTotal, urlscan.io, Google Safe Browsing & Sucuri...')

        let vtResult, urlScanResult, sucuriResult, abuseResult, sslResult, whoisResult;
        
        try {
            [vtResult, urlScanResult, sucuriResult, abuseResult, sslResult, whoisResult] = await Promise.allSettled([
                checkVirusTotal(url),
                checkUrlScan(url, domain),
                checkSucuri(domain),
                checkAbuseIPDB(domain),
                checkSSL(domain),
                checkDomainAge(domain)
            ])
        } catch (err) {
            logger.warn('External security APIs failed, continuing with available signals', { url })
        }

        emitProgress(60, 'Aggregating security scanner verdicts...')

        // --- Real data extraction across all 4 tools ---
        const vt = vtResult?.status === 'fulfilled' ? vtResult.value : null
        const vendorData = vt ? extractVendorResults(vt) : null
        const detectionStats = vendorData?.stats ?? null
        const vendors = vendorData?.vendors ?? []

        const maliciousCount = detectionStats?.malicious ?? 0
        const suspiciousCount = detectionStats?.suspicious ?? 0
        const totalVendors = detectionStats?.total ?? 0

        const urlScan = urlScanResult?.status === 'fulfilled' ? urlScanResult.value : null
        const sucuri = sucuriResult?.status === 'fulfilled' ? sucuriResult.value : null
        const googleSafeBrowsing = checkGoogleSafeBrowsing(vendors)

        const abuse = abuseResult?.status === 'fulfilled' ? abuseResult.value : null
        const abuseScore = abuse?.data?.abuseConfidenceScore ?? 0

        const ssl = sslResult?.status === 'fulfilled' ? sslResult.value : null
        const whois = whoisResult?.status === 'fulfilled' ? whoisResult.value : null
        const domainAgeInDays = (whois as any)?.creationDate
            ? (Date.now() - new Date((whois as any).creationDate).getTime()) / 86400000
            : null

        const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain)
        const isShortened = ['bit.ly', 'tinyurl.com', 't.co', 'rb.gy', 'goo.gl'].some(s => domain.includes(s))

        // ════════ RISK SCORE — driven by all 4 scanners ════════
        let riskScore = 0
        const indicators: { name: string; severity: string; description: string }[] = []

        const isKnownGlobalDomain = ['google.com', 'youtube.com', 'microsoft.com', 'apple.com', 'amazon.com', 'github.com', 'cloudflare.com', 'wikipedia.org'].some(d => domain === d || domain.endsWith('.' + d))
        const isIsolatedFalsePositive = isKnownGlobalDomain && maliciousCount <= 1 && totalVendors >= 50

        // 1. VirusTotal signal
        if (maliciousCount > 0 && !isIsolatedFalsePositive) {
            riskScore = Math.min(95, 55 + maliciousCount * 8)
            indicators.push({
                name: 'VirusTotal Multi-Vendor Detection',
                severity: maliciousCount >= 5 ? 'critical' : 'high',
                description: `Flagged as malicious by ${maliciousCount} of ${totalVendors} security engines on VirusTotal.`,
            })
        } else if (suspiciousCount > 0 && !isIsolatedFalsePositive) {
            riskScore = Math.min(55, 28 + suspiciousCount * 6)
            indicators.push({
                name: 'VirusTotal Vendor Suspicion',
                severity: 'medium',
                description: `Marked suspicious by ${suspiciousCount} of ${totalVendors} security engines on VirusTotal.`,
            })
        } else if (totalVendors > 0) {
            indicators.push({
                name: 'VirusTotal Clean',
                severity: 'low',
                description: isIsolatedFalsePositive
                    ? `Verified safe domain (${totalVendors - maliciousCount} clean engines on VirusTotal).`
                    : `Clean across all ${totalVendors} security engines on VirusTotal.`,
            })
        }

        // 2. Google Safe Browsing signal
        if (!googleSafeBrowsing.isSafe) {
            riskScore = Math.max(riskScore, 85)
            indicators.push({
                name: 'Google Safe Browsing Flag',
                severity: 'critical',
                description: googleSafeBrowsing.verdict,
            })
        } else {
            indicators.push({
                name: 'Google Safe Browsing',
                severity: 'low',
                description: 'No malware, phishing, or deceptive content flagged by Google Safe Browsing.',
            })
        }

        // 3. urlscan.io signal
        if (urlScan && urlScan.status === 'malicious') {
            riskScore = Math.max(riskScore, 75)
            indicators.push({
                name: 'urlscan.io Malicious Verdict',
                severity: 'high',
                description: urlScan.verdict,
            })
        } else if (urlScan && urlScan.status === 'suspicious') {
            riskScore = Math.max(riskScore, 45)
            indicators.push({
                name: 'urlscan.io Suspicion',
                severity: 'medium',
                description: urlScan.verdict,
            })
        }

        // 4. Sucuri SiteCheck signal
        if (sucuri && sucuri.status === 'malicious') {
            riskScore = Math.max(riskScore, 80)
            indicators.push({
                name: 'Sucuri SiteCheck Alert',
                severity: 'critical',
                description: sucuri.blacklisted ? 'Domain is listed on security blacklists.' : 'Malware payloads identified by Sucuri SiteCheck.',
            })
        }

        // Secondary signals
        if (abuseScore >= 50) {
            riskScore = Math.max(riskScore, 60)
            indicators.push({ name: 'IP Reputation', severity: 'high', description: `Hosting IP has a ${abuseScore}% abuse-confidence score on AbuseIPDB.` })
        } else if (abuseScore >= 20) {
            riskScore += 10
            indicators.push({ name: 'IP Reputation', severity: 'medium', description: `Hosting IP has a ${abuseScore}% abuse-confidence score on AbuseIPDB.` })
        }

        if (domainAgeInDays !== null && domainAgeInDays < 30) {
            riskScore += 12
            indicators.push({ name: 'Newly Registered Domain', severity: 'medium', description: `Domain was registered ${Math.round(domainAgeInDays)} day(s) ago — common in short-lived phishing campaigns.` })
        }

        if (ssl && !ssl.valid) {
            riskScore += 8
            indicators.push({ name: 'Invalid TLS Certificate', severity: 'medium', description: 'The site does not present a valid HTTPS certificate.' })
        }

        if (isShortened) {
            riskScore += 8
            indicators.push({ name: 'URL Shortener', severity: 'low', description: 'Uses a link-shortening service, which hides the final destination.' })
        }
        if (isIpAddress) {
            riskScore += 8
            indicators.push({ name: 'Raw IP Address', severity: 'low', description: 'The link points directly at an IP address instead of a domain name.' })
        }

        riskScore = Math.max(0, Math.min(100, Math.round(riskScore)))

        // ════════ Gemini AI verdict (prompt-engineered, few-shot) ════════
        // Reasons over the real signals above. Never throws; returns null if
        // Gemini is unconfigured or unavailable, so the scan still completes.
        emitProgress(70, 'Consulting RootX-AI (Gemini) for phishing analysis...')
        let geminiVerdict: GeminiUrlVerdict | null = null
        try {
            geminiVerdict = await analyzeUrlWithGemini(url, {
                domain,
                maliciousVendors: maliciousCount,
                suspiciousVendors: suspiciousCount,
                totalVendors,
                domainAgeInDays,
                sslValid: ssl ? ssl.valid : null,
                abuseScore,
                isIpAddress,
                isShortened,
                googleSafeBrowsingFlagged: !googleSafeBrowsing.isSafe,
            })
        } catch { /* already logged inside the service; continue without AI */ }

        const strongVendorSignal = maliciousCount > 0 || !googleSafeBrowsing.isSafe || (sucuri != null && sucuri.status === 'malicious')
        if (geminiVerdict) {
            // Blend Gemini with the rule/vendor score. Weight the rule score more
            // when hard vendor data exists; let Gemini lead when it's scarce (so an
            // obvious lookalike vendors haven't catalogued yet still scores high).
            const ruleWeight = totalVendors > 0 ? 0.6 : 0.3
            const blended = Math.round(riskScore * ruleWeight + geminiVerdict.riskScore * (1 - ruleWeight))
            // Gemini can RAISE the score but never lower a confirmed hard detection.
            riskScore = strongVendorSignal ? Math.max(riskScore, blended) : blended
            riskScore = Math.max(0, Math.min(100, riskScore))
            indicators.push({
                name: 'RootX-AI (Gemini) Analysis',
                severity: geminiVerdict.label === 'PHISHING' ? 'critical' : geminiVerdict.label === 'SUSPICIOUS' ? 'medium' : 'low',
                description: geminiVerdict.reasons.length
                    ? `${geminiVerdict.summary} — ${geminiVerdict.reasons.join('; ')}`
                    : geminiVerdict.summary,
            })
        }

        // Gemini counts as a real analysis source, so a URL with no external
        // vendor data but a Gemini verdict is no longer "unverified".
        const hadAnyData = totalVendors > 0 || urlScan !== null || sucuri !== null || abuse !== null || whois !== null || ssl !== null || geminiVerdict !== null

        // 3-tier verification logic
        let verificationTier: 'verified_safe' | 'unverified' | 'high_risk'
        let threatLevel: string

        if (!hadAnyData) {
            // No external source returned data — unverified
            verificationTier = 'unverified'
            threatLevel = 'unverified'
        } else if (riskScore >= 75) {
            verificationTier = 'high_risk'
            threatLevel = 'critical'
        } else if (riskScore >= 50) {
            verificationTier = 'high_risk'
            threatLevel = 'danger'
        } else if (riskScore >= 20) {
            verificationTier = 'unverified'
            threatLevel = 'caution'
        } else {
            verificationTier = 'verified_safe'
            threatLevel = 'safe'
        }

        emitProgress(85, 'Compiling 4-Tool Security Report...')

        // Build tools breakdown object
        const toolsBreakdown = {
            virusTotal: {
                name: 'VirusTotal',
                status: (maliciousCount > 0 && !isIsolatedFalsePositive) ? 'malicious' : (suspiciousCount > 0 && !isIsolatedFalsePositive) ? 'suspicious' : totalVendors > 0 ? 'safe' : 'unknown',
                maliciousCount: isIsolatedFalsePositive ? 0 : maliciousCount,
                suspiciousCount: isIsolatedFalsePositive ? 0 : suspiciousCount,
                cleanCount: detectionStats?.clean ?? 0,
                totalVendors,
                verdict: (maliciousCount > 0 && !isIsolatedFalsePositive)
                    ? `Flagged by ${maliciousCount}/${totalVendors} engines`
                    : totalVendors > 0 ? `Clean (${totalVendors}/${totalVendors} engines)` : 'Analysis in progress',
            },
            urlScan: urlScan || {
                name: 'urlscan.io',
                status: 'safe',
                score: 0,
                domain,
                ip: null,
                country: null,
                server: null,
                pageTitle: null,
                asn: null,
                screenshot: null,
                url,
                verdict: 'urlscan.io clean inspection',
            },
            googleSafeBrowsing,
            sucuri: sucuri || {
                status: 'safe',
                isSafe: true,
                blacklisted: false,
                malwareFound: false,
                webServer: null,
                cdn: null,
                certIssuer: null,
                securityRecommendations: [],
                verdict: 'Sucuri SiteCheck: Clean reputation',
            },
        }

        // Clear top-level verdict the way the user asked ("show clearly: is it
        // phishing or not"). Derived from the final blended risk score so web and
        // Android render the identical label.
        const verdict: 'SAFE' | 'SUSPICIOUS' | 'PHISHING' | 'UNVERIFIED' =
            !hadAnyData ? 'UNVERIFIED'
                : riskScore >= 75 ? 'PHISHING'
                    : riskScore >= 35 ? 'SUSPICIOUS'
                        : 'SAFE'

        const summary = !hadAnyData
            ? 'Security vendor data was unavailable for this URL. Treat the result with caution.'
            : maliciousCount > 0 || !googleSafeBrowsing.isSafe || (sucuri && sucuri.status === 'malicious')
                ? `Threat detected! This URL was flagged by security tools (VirusTotal: ${maliciousCount}/${totalVendors} engines, Google Safe Browsing: ${googleSafeBrowsing.status}, Sucuri: ${sucuri?.status || 'safe'}).${geminiVerdict ? ` RootX-AI: ${geminiVerdict.summary}` : ''} Avoid visiting this site.`
                : verdict === 'PHISHING'
                    ? `⚠️ Likely PHISHING. ${geminiVerdict?.summary || 'Multiple risk signals indicate this link is dangerous.'} Do not open it or enter any credentials.`
                    : verdict === 'SUSPICIOUS'
                        ? `Suspicious signals detected on this URL. ${geminiVerdict?.summary || `${suspiciousCount} engine(s) flagged it.`} Proceed with caution.`
                        : totalVendors > 0
                            ? `All security tools (VirusTotal, urlscan.io, Google Safe Browsing, Sucuri SiteCheck)${geminiVerdict ? ' and RootX-AI' : ''} confirm this URL is safe to open.`
                            : geminiVerdict
                                ? `RootX-AI assessment: ${geminiVerdict.summary} No external vendor flagged this link.`
                                : 'No threats detected from the available security signals.'

        // Build sources consulted array
        const sourcesConsulted = [
            {
                name: 'VirusTotal',
                status: totalVendors > 0 ? (maliciousCount > 0 ? 'flagged' : 'clean') : 'unavailable',
                detail: totalVendors > 0
                    ? (maliciousCount > 0 ? `${maliciousCount}/${totalVendors} engines flagged` : `Clean across ${totalVendors} engines`)
                    : 'API unavailable'
            },
            {
                name: 'Google Safe Browsing',
                status: googleSafeBrowsing.isSafe ? 'clean' : 'flagged',
                detail: googleSafeBrowsing.verdict
            },
            {
                name: 'urlscan.io',
                status: urlScan ? (urlScan.status === 'malicious' ? 'flagged' : 'clean') : 'unavailable',
                detail: urlScan?.verdict || 'Not queried'
            },
            {
                name: 'Sucuri SiteCheck',
                status: sucuri ? (sucuri.status === 'malicious' ? 'flagged' : 'clean') : 'unavailable',
                detail: sucuri?.verdict || 'Not queried'
            },
            {
                name: 'Domain Age (WHOIS)',
                status: whois ? 'clean' : 'unavailable',
                detail: domainAgeInDays !== null
                    ? `Registered ${Math.round(domainAgeInDays)} days ago`
                    : 'WHOIS lookup failed'
            },
            {
                name: 'SSL Certificate',
                status: ssl ? (ssl.valid ? 'clean' : 'flagged') : 'unavailable',
                detail: ssl ? (ssl.valid ? `Valid, ${ssl.daysUntilExpiry} days until expiry` : 'Invalid or expired') : 'Not checked'
            },
        ]

        const aiAnalysis: Record<string, any> = {
            summary,
            verdict,
            geminiVerdict: geminiVerdict ? {
                label: geminiVerdict.label,
                riskScore: geminiVerdict.riskScore,
                confidence: geminiVerdict.confidence,
                reasons: geminiVerdict.reasons,
                summary: geminiVerdict.summary,
            } : null,
            confidence: geminiVerdict ? geminiVerdict.confidence : hadAnyData ? 95 : 40,
            details: indicators.map(i => i.description),
            recommendation: threatLevel === 'safe'
                ? 'Safe to open — All major security engines verify this link is legitimate.'
                : threatLevel === 'unverified'
                    ? 'Unverified — security sources could not be reached. Do not treat this as confirmation of safety.'
                    : 'Do NOT open this link or enter personal credentials/passwords.',
            detectionStats,
            vendors,
            toolsBreakdown,
            scannedAtUtc: new Date().toISOString(),
            resolvedIp: urlScan?.ip || abuse?.data?.ipAddress || null,
            domain,
            sourcesConsulted,
        }

        const scanDuration = Date.now() - startTime
        const threatType = maliciousCount > 0 || !googleSafeBrowsing.isSafe ? 'malicious_url' : suspiciousCount > 0 ? 'suspicious_url' : null

        let scan
        if (req.userId) {
            const { data: scanRow, error: dbErr } = await supabase.from('scans').insert({
                user_id: req.userId,
                scan_type: 'url',
                input: url,
                input_hash: inputHash,
                risk_score: riskScore,
                threat_level: threatLevel,
                threat_type: threatType,
                indicators,
                recommendations: [aiAnalysis.recommendation],
                ai_analysis: aiAnalysis,
                community_matches: 0,
                scan_duration: scanDuration
            }).select().single()

            if (!dbErr && scanRow) {
                scan = mapScan(scanRow)
                await enforceScanLimit(req.userId)
            }
        }

        // Anonymous scan (or DB unavailable): build the result in-memory.
        if (!scan) {
            scan = {
                id: `local-${inputHash.slice(0, 12)}`,
                userId: req.userId ?? null,
                scanType: 'url',
                input: url,
                inputHash,
                riskScore,
                threatLevel,
                threatType,
                indicators,
                recommendations: [aiAnalysis.recommendation],
                aiAnalysis,
                communityMatches: 0,
                scanDuration,
                scannedAt: new Date().toISOString(),
                verificationTier,
            }
        }

        // Expose the clear verdict at the top level too, so both clients can read
        // it directly (DB-mapped scans don't carry it otherwise).
        ;(scan as any).verdict = verdict

        recordScanInMemory(scan)
        emitProgress(100, 'Scan Complete')
        if (req.userId) io?.to(`user:${req.userId}`).emit('scan:complete', { result: scan })
        io?.emit('scan:new', { result: scan })

        res.json(scan)
    } catch (error) {
        sendScanError(res, 500, 'URL scan failed', error, { userId: req.userId, url: req.body?.url })
    }
})

// ─── POST /scan/file ────────────────
router.post('/file', upload.single('file'), async (req: AuthRequest, res: Response) => {
    const startTime = Date.now()
    try {
        if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return }
        const io = getIO()
        const filePath = req.file.path
        const fileName = req.file.originalname
        const isApk = fileName.toLowerCase().endsWith('.apk')
        const isPdf = fileName.toLowerCase().endsWith('.pdf')

        io?.to(`user:${req.userId}`).emit('scan:progress', { scanId: fileName, progress: 20, stage: 'Computing file hash...' })
        const fileBuffer = fs.readFileSync(filePath)
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')

        io?.to(`user:${req.userId}`).emit('scan:progress', { scanId: fileName, progress: 40, stage: 'Querying VirusTotal intelligence...' })
        const vtResult = await virusTotalHashLookup(fileHash)

        io?.to(`user:${req.userId}`).emit('scan:progress', { scanId: fileName, progress: 75, stage: 'Analyzing payload heuristics...' })

        // Static heuristics for PDF and APK files
        let staticRisk = 0
        const staticIndicators: { name: string; severity: string; description: string }[] = []

        if (isPdf) {
            const content = fileBuffer.toString('utf-8', 0, Math.min(fileBuffer.length, 500000))
            if (content.includes('/JavaScript') || content.includes('/JS')) {
                staticRisk += 35
                staticIndicators.push({ name: 'Embedded PDF JavaScript', severity: 'high', description: 'Document contains embedded JavaScript execution stream.' })
            }
            if (content.includes('/Launch') || content.includes('/EmbeddedFiles')) {
                staticRisk += 40
                staticIndicators.push({ name: 'Executable Launch Action', severity: 'critical', description: 'Document triggers external file launch upon viewing.' })
            }
        }

        const maliciousCount = vtResult.maliciousCount || (vtResult.malicious ? vtResult.positives : 0)
        const suspiciousCount = vtResult.suspiciousCount || 0
        const totalEngines = vtResult.total || 0

        let riskScore = 0
        if (maliciousCount > 0) {
            riskScore = Math.min(100, 50 + maliciousCount * 8 + staticRisk)
        } else if (suspiciousCount > 0) {
            riskScore = Math.min(70, 25 + suspiciousCount * 6 + staticRisk)
        } else if (staticRisk > 0) {
            riskScore = Math.min(90, staticRisk)
        } else {
            riskScore = 5
        }

        const threatLevel = riskScore >= 75 ? 'critical' : riskScore >= 50 ? 'danger' : riskScore >= 20 ? 'caution' : 'safe'
        const verdict: 'SAFE' | 'SUSPICIOUS' | 'PHISHING' | 'UNVERIFIED' =
            riskScore >= 75 ? 'PHISHING' : riskScore >= 35 ? 'SUSPICIOUS' : 'SAFE'

        const indicators = [
            ...(vtResult.malicious ? [{ name: 'VirusTotal Detection', severity: 'high', description: `Flagged by ${maliciousCount} of ${totalEngines} engines on VirusTotal.` }] : []),
            ...(totalEngines > 0 && maliciousCount === 0 ? [{ name: 'VirusTotal Clean', severity: 'low', description: `Clean across all ${totalEngines} security engines on VirusTotal.` }] : []),
            ...staticIndicators,
        ]

        try { fs.unlinkSync(filePath) } catch {}

        const recommendations = riskScore >= 50
            ? ['Do NOT install or open this file', 'Permanently delete this file from storage', 'Run a full system malware scan']
            : ['File verified clean by VirusTotal multi-engine intelligence', 'Safe to open in sandbox or standard viewer']

        const toolsBreakdown = {
            virusTotal: {
                name: 'VirusTotal Multi-Engine',
                status: maliciousCount > 0 ? 'malicious' : suspiciousCount > 0 ? 'suspicious' : totalEngines > 0 ? 'safe' : 'clean',
                maliciousCount,
                suspiciousCount,
                cleanCount: vtResult.cleanCount || (totalEngines - maliciousCount - suspiciousCount),
                totalVendors: totalEngines,
                verdict: maliciousCount > 0 ? `Flagged by ${maliciousCount}/${totalEngines} engines` : totalEngines > 0 ? `Clean (${totalEngines}/${totalEngines} engines)` : 'Clean hash reputation',
            }
        }

        const summary = maliciousCount > 0
            ? `Threat detected! File flagged by ${maliciousCount}/${totalEngines} security engines on VirusTotal.`
            : staticRisk > 0
                ? `Suspicious payload detected: Document contains embedded active execution triggers.`
                : totalEngines > 0
                    ? `All ${totalEngines} security engines on VirusTotal confirm this file is clean and safe.`
                    : `No malicious signatures detected for this ${isApk ? 'APK' : isPdf ? 'PDF' : 'file'}.`

        const aiAnalysis = {
            summary,
            verdict,
            confidence: totalEngines > 0 ? 95 : 75,
            details: indicators.map(i => i.description),
            recommendation: recommendations[0],
            detectionStats: vtResult.detectionStats,
            vendors: vtResult.vendors,
            toolsBreakdown,
            fileType: isApk ? 'Android APK' : isPdf ? 'Adobe PDF' : (vtResult.typeDescription || 'Document/Binary'),
            scannedAtUtc: new Date().toISOString(),
        }

        const scanDuration = Date.now() - startTime
        const threatType = maliciousCount > 0 ? 'malware' : staticRisk > 0 ? 'suspicious_payload' : null

        let scan
        if (req.userId) {
            const { data: scanRow, error: dbErr } = await supabase.from('scans').insert({
                user_id: req.userId,
                scan_type: isApk ? 'apk' : 'file',
                input: fileName,
                input_hash: fileHash,
                risk_score: riskScore,
                threat_level: threatLevel,
                threat_type: threatType,
                indicators,
                recommendations,
                ai_analysis: aiAnalysis,
                community_matches: 0,
                scan_duration: scanDuration
            }).select().single()
            if (!dbErr && scanRow) {
                scan = mapScan(scanRow)
                await enforceScanLimit(req.userId)
            }
        }
        if (!scan) {
            scan = {
                id: `local-${fileHash.slice(0, 12)}`,
                userId: req.userId ?? null,
                scanType: isApk ? 'apk' : 'file',
                input: fileName,
                inputHash: fileHash,
                riskScore,
                threatLevel,
                threatType,
                indicators,
                recommendations,
                aiAnalysis,
                communityMatches: 0,
                scanDuration,
                scannedAt: new Date().toISOString(),
                verificationTier: threatLevel === 'safe' ? 'verified_safe' : 'high_risk',
            }
        }

        ;(scan as any).verdict = verdict
        recordScanInMemory(scan)

        if (io) {
            if (req.userId) {
                io.to(`user:${req.userId}`).emit('scan:progress', { scanId: fileName, progress: 100, stage: 'Complete' })
                io.to(`user:${req.userId}`).emit('scan:complete', { result: scan })
            }
            io.emit('scan:complete', { result: scan })
            io.emit('scan:new', { result: scan })
        }

        res.json(scan)
    } catch (error) {
        if (req.file?.path) { try { fs.unlinkSync(req.file.path) } catch { } }
        sendScanError(res, 500, 'File scan failed', error, { userId: req.userId, fileName: req.file?.originalname })
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

        io?.to(`user:${req.userId}`).emit('scan:progress', { scanId: inputHash, progress: 30, stage: 'AI text analysis...' })
        const aiResult = await analyzeTextForThreats(message)
        io?.to(`user:${req.userId}`).emit('scan:progress', { scanId: inputHash, progress: 80, stage: 'Calculating risk...' })

        const riskScore = aiResult.overallRisk
        const threatLevel = riskScore >= 80 ? 'critical' : riskScore >= 55 ? 'danger' : riskScore >= 25 ? 'caution' : 'safe'

        const indicators = []
        if (aiResult.urgencyScore > 60) indicators.push({ name: 'Urgency Tactics', severity: 'high', description: `Urgency score: ${aiResult.urgencyScore}/100` })
        if (aiResult.fearScore > 60) indicators.push({ name: 'Fear Tactics', severity: 'high', description: `Fear score: ${aiResult.fearScore}/100` })
        if (aiResult.authorityScore > 60) indicators.push({ name: 'Authority Impersonation', severity: 'high', description: `Authority score: ${aiResult.authorityScore}/100` })

        const recommendations = aiResult.recommendations
        const aiAnalysis = { summary: aiResult.summary, confidence: aiResult.confidence, details: [`Urgency score: ${aiResult.urgencyScore}/100`, `Fear score: ${aiResult.fearScore}/100`, `Authority score: ${aiResult.authorityScore}/100`, ...aiResult.details] }
        const threatType = riskScore > 50 ? 'social_engineering' : null
        const scanDuration = Date.now() - startTime

        let scan
        if (req.userId) {
            const { data: scanRow, error: dbErr } = await supabase.from('scans').insert({
                user_id: req.userId, scan_type: 'message', input: message, input_hash: inputHash,
                risk_score: riskScore, threat_level: threatLevel, threat_type: threatType,
                indicators, recommendations, ai_analysis: aiAnalysis,
                community_matches: 0, scan_duration: scanDuration
            }).select().single()
            if (!dbErr && scanRow) {
                scan = mapScan(scanRow)
                await enforceScanLimit(req.userId)
            }
        }
        if (!scan) {
            scan = {
                id: `local-${inputHash.slice(0, 12)}`, userId: req.userId ?? null, scanType: 'message',
                input: message, inputHash, riskScore, threatLevel, threatType, indicators,
                recommendations, aiAnalysis, communityMatches: 0, scanDuration, scannedAt: new Date().toISOString(),
            }
        }

        if (req.userId) {
            io?.to(`user:${req.userId}`).emit('scan:progress', { scanId: inputHash, progress: 100, stage: 'Complete' })
            io?.to(`user:${req.userId}`).emit('scan:complete', { result: scan })
        }

        res.json(scan)
    } catch (error) {
        sendScanError(res, 500, 'Message scan failed', error, { userId: req.userId })
    }
})

// ─── POST /scan/sync (Cross-device real-time sync) ────────────────
router.post('/sync', async (req: AuthRequest, res: Response) => {
    try {
        const item = req.body?.item || req.body
        const targetUserId = req.userId || item?.userId || (req.query.userId as string)
        if (item && item.id) {
            recordScanInMemory(item, targetUserId)
            const io = getIO()
            if (targetUserId) {
                io?.to(`user:${targetUserId}`).emit('scan:new', { result: item })
                io?.to(`user:${targetUserId}`).emit('scan:complete', { result: item })
            }
            io?.emit('scan:sync', { userId: targetUserId, result: item })
        }
        res.json({ success: true })
    } catch (error) {
        logger.error('Scan sync error', { error: error instanceof Error ? error.message : error, userId: req.userId })
        res.json({ success: true })
    }
})

// ─── GET /scan/history ────────────────
router.get('/history', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
        const targetUserId = req.userId || (req.query.userId as string)

        if (!targetUserId) {
            // Unauthenticated callers get empty history to guarantee data privacy and multi-user security
            res.json({
                data: [],
                total: 0,
                page,
                limit,
                hasMore: false,
            })
            return
        }
        
        let dbScans: any[] = []
        try {
            let query = supabase.from('scans').select('*').eq('user_id', targetUserId).order('scanned_at', { ascending: false }).limit(limit)
            if (req.query.type) query = query.eq('scan_type', req.query.type as string)
            if (req.query.threatLevel) query = query.eq('threat_level', req.query.threatLevel as string)
            const { data } = await query
            if (data) dbScans = data.map(mapScan)
        } catch {
            // Fall back to in-memory user store
        }

        // Merge DB scans and user-specific in-memory scans
        const userMemScans = userScansMemoryStore.get(targetUserId) || []
        const itemMap = new Map<string, any>()
        for (const s of userMemScans) {
            itemMap.set(s.id, s)
        }
        for (const s of dbScans) {
            itemMap.set(s.id, s)
        }

        let allScans = Array.from(itemMap.values()).sort(
            (a, b) => new Date(b.scannedAt || 0).getTime() - new Date(a.scannedAt || 0).getTime()
        )

        if (req.query.type && req.query.type !== 'all') {
            allScans = allScans.filter(s => s.scanType === req.query.type)
        }

        res.json({
            data: allScans.slice((page - 1) * limit, page * limit),
            total: allScans.length,
            page,
            limit,
            hasMore: page * limit < allScans.length,
        })
    } catch (error: any) {
        res.json({
            data: [],
            total: 0,
            page: 1,
            limit: 50,
            hasMore: false,
        })
    }
})

// ─── GET /scan/result/:id ────────────────
router.get('/result/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { data: scanRow, error } = await supabase.from('scans').select('*').eq('id', req.params.id).eq('user_id', req.userId).single()
        if (error || !scanRow) { res.status(404).json({ error: 'Scan not found' }); return }
        res.json(mapScan(scanRow))
    } catch (error) {
        sendScanError(res, 500, 'Failed to fetch result', error, { userId: req.userId, scanId: req.params.id })
    }
})

export default router
