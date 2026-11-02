import https from 'https'
import { config } from '../config/index.js'
import logger from '../utils/logger.js'

/**
 * Gemini-powered phishing/URL analysis.
 *
 * "Training with Gemini" in practice: Gemini cannot be fine-tuned from this
 * app. What we CAN do — and what this file does — is *prompt engineering with
 * few-shot examples*: we give the model a strict rubric plus a handful of
 * labelled example URLs (known safe / suspicious / phishing) so its output is
 * consistent and well-calibrated. The real security signals we already gathered
 * (VirusTotal, WHOIS domain age, SSL, AbuseIPDB, shortener/IP heuristics) are
 * passed in as context so Gemini reasons over evidence, not just the raw string.
 *
 * The key is read from the server environment only (GEMINI_API_KEY) and is
 * never sent to the web or Android client.
 */

export interface GeminiUrlSignals {
    domain: string
    maliciousVendors?: number
    suspiciousVendors?: number
    totalVendors?: number
    domainAgeInDays?: number | null
    sslValid?: boolean | null
    abuseScore?: number | null
    isIpAddress?: boolean
    isShortened?: boolean
    googleSafeBrowsingFlagged?: boolean
}

export interface GeminiUrlVerdict {
    label: 'SAFE' | 'SUSPICIOUS' | 'PHISHING'
    riskScore: number // 0-100
    confidence: number // 0-100
    reasons: string[]
    summary: string
    source: 'gemini'
}

// Few-shot rubric. These labelled examples steer Gemini toward consistent,
// well-calibrated verdicts — this is the "training" that is actually possible.
const SYSTEM_PROMPT = `You are RootX-AI, an expert phishing-detection analyst inside a security app.
Given a URL and pre-computed security signals, classify the URL and explain why.

Return ONLY a JSON object (no markdown, no prose) with this exact shape:
{
  "label": "SAFE" | "SUSPICIOUS" | "PHISHING",
  "riskScore": <integer 0-100>,
  "confidence": <integer 0-100>,
  "summary": "<one concise sentence>",
  "reasons": ["<short specific reason>", ...]   // 1-5 items
}

Rules:
- PHISHING: strong evidence of credential theft / impersonation (lookalike/typosquatted brand domains, deceptive TLDs, vendor detections, "login/verify/secure/account" bait on untrusted hosts). riskScore 75-100.
- SUSPICIOUS: some red flags but not conclusive (very new domain, URL shortener hiding destination, raw IP host, invalid TLS, mild reputation hits). riskScore 35-74.
- SAFE: well-known legitimate domain with clean signals and no red flags. riskScore 0-34.
- NEVER infer safety purely from the absence of evidence. If nothing is known about an unusual domain, lean SUSPICIOUS, not SAFE.
- Be specific in reasons; reference the actual signals provided.

Examples:
URL: https://www.google.com | signals: vendors clean, old domain, valid SSL
=> {"label":"SAFE","riskScore":5,"confidence":97,"summary":"Well-established, reputable domain with clean reputation.","reasons":["Globally trusted domain","No security vendor flagged it","Valid TLS certificate"]}

URL: http://paypa1-secure-login.verify-account.ru | signals: new domain, no SSL
=> {"label":"PHISHING","riskScore":94,"confidence":92,"summary":"Lookalike PayPal domain on a suspicious TLD designed to steal credentials.","reasons":["Typosquatted brand name ('paypa1')","Deceptive 'secure-login/verify-account' bait","Suspicious .ru TLD on a brand-new domain","No valid HTTPS certificate"]}

URL: https://bit.ly/3xQ9zK | signals: shortener
=> {"label":"SUSPICIOUS","riskScore":52,"confidence":70,"summary":"URL shortener hides the true destination, which cannot be verified.","reasons":["Link-shortening service conceals the final URL","Destination not independently verified"]}

URL: http://192.0.2.44/account/login | signals: raw IP host, new
=> {"label":"SUSPICIOUS","riskScore":60,"confidence":74,"summary":"Login page served directly from a raw IP address is a common phishing pattern.","reasons":["Uses a raw IP address instead of a domain","'account/login' path requests credentials on an unverified host"]}`

function buildUserPrompt(url: string, s: GeminiUrlSignals): string {
    const lines: string[] = [`URL: ${url}`, `Domain: ${s.domain}`, 'Signals:']
    if (s.totalVendors !== undefined && s.totalVendors > 0) {
        lines.push(`  - VirusTotal: ${s.maliciousVendors ?? 0} malicious / ${s.suspiciousVendors ?? 0} suspicious of ${s.totalVendors} engines`)
    } else {
        lines.push('  - VirusTotal: no vendor data available')
    }
    if (s.googleSafeBrowsingFlagged) lines.push('  - Google Safe Browsing: FLAGGED as unsafe')
    if (s.domainAgeInDays !== null && s.domainAgeInDays !== undefined) {
        lines.push(`  - Domain age: ${Math.round(s.domainAgeInDays)} day(s)`)
    } else {
        lines.push('  - Domain age: unknown (WHOIS unavailable)')
    }
    if (s.sslValid === true) lines.push('  - TLS certificate: valid')
    else if (s.sslValid === false) lines.push('  - TLS certificate: invalid / missing')
    if (s.abuseScore) lines.push(`  - Hosting IP abuse confidence: ${s.abuseScore}%`)
    if (s.isIpAddress) lines.push('  - Host is a raw IP address')
    if (s.isShortened) lines.push('  - Uses a URL shortener')
    lines.push('Classify now. Return ONLY the JSON object.')
    return lines.join('\n')
}

function extractJson(text: string): any | null {
    if (!text) return null
    // Strip ```json fences and grab the first {...} block.
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return null
    try {
        return JSON.parse(cleaned.slice(start, end + 1))
    } catch {
        return null
    }
}

const clamp = (n: unknown, lo: number, hi: number, fallback: number): number => {
    const v = typeof n === 'number' ? n : parseInt(String(n), 10)
    if (Number.isNaN(v)) return fallback
    return Math.max(lo, Math.min(hi, Math.round(v)))
}

/**
 * Analyze a URL with Gemini. Returns null (never throws) if Gemini is not
 * configured or the call fails/times out, so the scan pipeline degrades
 * gracefully to the rule-based + vendor verdict.
 */
export async function analyzeUrlWithGemini(
    url: string,
    signals: GeminiUrlSignals,
    timeoutMs = 9000,
): Promise<GeminiUrlVerdict | null> {
    const apiKey = config.geminiApiKey
    if (!apiKey) return null

    const body = JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: buildUserPrompt(url, signals) }] }],
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 512,
            responseMimeType: 'application/json',
        },
    })

    try {
        const text = await new Promise<string>((resolve, reject) => {
            const req = https.request(
                {
                    hostname: 'generativelanguage.googleapis.com',
                    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(body),
                    },
                    timeout: timeoutMs,
                },
                (response) => {
                    let data = ''
                    response.on('data', (c) => (data += c))
                    response.on('end', () => {
                        if ((response.statusCode || 500) >= 400) {
                            reject(new Error(`Gemini HTTP ${response.statusCode}: ${data.slice(0, 200)}`))
                        } else {
                            resolve(data)
                        }
                    })
                },
            )
            req.on('timeout', () => req.destroy(new Error('Gemini request timed out')))
            req.on('error', reject)
            req.write(body)
            req.end()
        })

        const parsed = JSON.parse(text)
        const modelText: string = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const verdict = extractJson(modelText)
        if (!verdict || !verdict.label) {
            logger.warn('Gemini URL analysis returned unparseable output', { url, modelText: modelText.slice(0, 200) })
            return null
        }

        const label = String(verdict.label).toUpperCase()
        const normalizedLabel: GeminiUrlVerdict['label'] =
            label === 'PHISHING' ? 'PHISHING' : label === 'SUSPICIOUS' ? 'SUSPICIOUS' : 'SAFE'

        return {
            label: normalizedLabel,
            riskScore: clamp(verdict.riskScore, 0, 100, normalizedLabel === 'PHISHING' ? 85 : normalizedLabel === 'SUSPICIOUS' ? 50 : 10),
            confidence: clamp(verdict.confidence, 0, 100, 70),
            reasons: Array.isArray(verdict.reasons) ? verdict.reasons.map((r: unknown) => String(r)).slice(0, 5) : [],
            summary: typeof verdict.summary === 'string' ? verdict.summary : 'Gemini analysis complete.',
            source: 'gemini',
        }
    } catch (error) {
        logger.warn('Gemini URL analysis failed', { url, error: (error as Error).message })
        return null
    }
}
