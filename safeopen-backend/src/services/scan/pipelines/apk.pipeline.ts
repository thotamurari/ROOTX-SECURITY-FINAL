import crypto from 'crypto'
import fetch from 'node-fetch'
import axios from 'axios'
import { DANGEROUS_PERMISSIONS, calculatePermissionRisk } from '../utils/permissionRisk.js'
import logger from '../../../utils/logger.js'

function generateId(): string {
    return crypto.randomBytes(12).toString('hex')
}

function calculateHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex')
}

interface MockApp {
    name: string
    packageName: string
    category: string
    version: string
    size: number
    backgroundActivity: string
    lastUsed: string
    installDate: string
    permissions: string[]
}

export async function scanSingleApk(app: MockApp) {
    const startTime = Date.now()

    // 1. Calculate APK hash
    const apkHash = calculateHash(app.packageName)

    // 2. VirusTotal hash lookup
    let vtResult: { malicious: number; suspicious: number; clean: number; total: number } | null = null
    try {
        const vtResponse = await axios.get(
            `https://www.virustotal.com/api/v3/files/${apkHash}`,
            { headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY }, timeout: 8000 }
        )
        const stats = vtResponse.data.data.attributes.last_analysis_stats
        vtResult = {
            malicious: stats.malicious || 0,
            suspicious: stats.suspicious || 0,
            clean: (stats.harmless || 0) + (stats.undetected || 0),
            total: Object.values(stats as Record<string, number>).reduce((a, b) => a + b, 0),
        }
    } catch {
        // VT hash not in database — expected for most apps
        vtResult = null
    }

    // 3. Permission risk analysis
    const dangerousPermissions = app.permissions.filter((p) =>
        (DANGEROUS_PERMISSIONS as readonly string[]).includes(p)
    )

    const permissionRiskScore = calculatePermissionRisk(
        app.permissions,
        dangerousPermissions,
        app.category
    )

    // 4. Calculate risk score (weighted)
    let riskScore = 0

    // VirusTotal weight: 50%
    if (vtResult) {
        if (vtResult.malicious >= 5) riskScore += 50
        else if (vtResult.malicious >= 2) riskScore += 38
        else if (vtResult.malicious >= 1) riskScore += 25
        else if (vtResult.suspicious >= 1) riskScore += 15
    }

    // Permission risk weight: 30%
    riskScore += Math.min(30, permissionRiskScore * 0.3)

    // Background activity weight: 20%
    const bgScoreMap: Record<string, number> = {
        none: 0, low: 5, medium: 10, high: 15, always: 20, active: 18,
    }
    riskScore += bgScoreMap[app.backgroundActivity] || 0

    riskScore = Math.min(100, Math.round(riskScore))

    // 5. AI Analysis via Claude API
    let aiAnalysis: {
        summary: string
        threats: string[]
        suspiciousPatterns: string[]
        recommendation: string
        confidence: number
    }

    try {
        if (!process.env.ANTHROPIC_API_KEY) throw new Error('No Anthropic key')

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 400,
                messages: [{
                    role: 'user',
                    content: `You are a mobile security expert.
Analyze this Android app and give a security assessment.

App: ${app.name}
Package: ${app.packageName}
Category: ${app.category}
Version: ${app.version}
Permissions (${app.permissions.length} total): ${app.permissions.join(', ')}
Dangerous permissions (${dangerousPermissions.length}): ${dangerousPermissions.join(', ')}
Background activity: ${app.backgroundActivity}
Last used: ${app.lastUsed}
VirusTotal: ${vtResult ? `${vtResult.malicious} malicious, ${vtResult.suspicious} suspicious out of ${vtResult.total}` : 'Not in database'}
Risk score: ${riskScore}/100

Respond ONLY in this exact JSON format, no other text:
{
  "summary": "2 sentence plain-English verdict",
  "threats": ["specific threat 1 if any", "specific threat 2 if any"],
  "suspiciousPatterns": ["pattern 1 if any"],
  "recommendation": "exact action user should take",
  "confidence": 85
}

If app is safe, threats and suspiciousPatterns should be empty arrays.`,
                }],
            }),
        })

        const data = (await response.json()) as any
        const text = data.content?.[0]?.text
        if (!text) throw new Error('Empty AI response')
        aiAnalysis = JSON.parse(text.replace(/```json|```/g, '').trim())
    } catch (err) {
        logger.warn('AI analysis fallback', { app: app.name, error: (err as Error).message })
        // Fallback analysis
        aiAnalysis = {
            summary:
                riskScore > 60
                    ? `${app.name} shows signs of risky behavior with ${dangerousPermissions.length} dangerous permissions.`
                    : `${app.name} appears to be functioning normally with acceptable permissions.`,
            threats:
                vtResult && vtResult.malicious > 0
                    ? [`Flagged by ${vtResult.malicious} security vendors on VirusTotal`]
                    : [],
            suspiciousPatterns:
                dangerousPermissions.length > 3
                    ? [`Excessive dangerous permissions: ${dangerousPermissions.slice(0, 3).join(', ')}`]
                    : [],
            recommendation:
                riskScore > 60
                    ? 'Review and restrict permissions. Consider uninstalling if not needed.'
                    : 'App is generally safe. Monitor for unusual behavior.',
            confidence: 70,
        }
    }

    const riskLevel = riskScore >= 86 ? 'critical'
        : riskScore >= 61 ? 'risky'
        : riskScore >= 31 ? 'caution'
        : 'safe'

    return {
        id: generateId(),
        appName: app.name,
        packageName: app.packageName,
        version: app.version,
        apkSize: app.size,
        riskScore,
        riskLevel,
        virusTotalResult: vtResult,
        permissions: app.permissions,
        dangerousPermissions,
        permissionRiskScore,
        backgroundActivity: app.backgroundActivity,
        lastUsed: app.lastUsed,
        installDate: app.installDate,
        aiAnalysis,
        scannedAt: new Date().toISOString(),
        scanDuration: Date.now() - startTime,
    }
}
