import axios from 'axios'
import crypto from 'crypto'
import dns from 'dns'
import whois from 'whois-json'
import { config } from '../config/index.js'
import logger from '../utils/logger.js'

// --- Hash ---
export function sha256(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex')
}

// 1. VirusTotal
export const checkVirusTotal = async (url: string) => {
    const submitResponse = await axios.post(
        'https://www.virustotal.com/api/v3/urls',
        new URLSearchParams({ url }),
        { headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY || config.virusTotalApiKey } }
    )
    
    const analysisId = submitResponse.data.data.id
    
    let attempts = 0
    while (attempts < 10) {
        await new Promise(r => setTimeout(r, 2000))
        const result = await axios.get(
            `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
            { headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY || config.virusTotalApiKey } }
        )
        
        if (result.data.data.attributes.status === 'completed') {
            const urlId = Buffer.from(url).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
            const report = await axios.get(
                `https://www.virustotal.com/api/v3/urls/${urlId}`,
                { headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY || config.virusTotalApiKey } }
            )
            return report.data
        }
        attempts++
    }
    throw new Error('VirusTotal analysis timeout')
}

// 2. AbuseIPDB
export const checkAbuseIPDB = async (domain: string) => {
    try {
        const { address } = await dns.promises.lookup(domain)
        const res = await axios.get('https://api.abuseipdb.com/api/v2/check', {
            params: { ipAddress: address, maxAgeInDays: 90 },
            headers: {
                Key: process.env.ABUSEIPDB_API_KEY || config.abuseIpdbApiKey,
                Accept: 'application/json',
            }
        })
        return res.data
    } catch (e) {
        logger.warn('AbuseIPDB check Failed', { error: (e as Error).message })
        return null
    }
}

// 3. Domain Age
export const checkDomainAge = async (domain: string): Promise<Record<string, any> | null> => {
    try {
        const result = await whois(domain)
        return result as Record<string, any>
    } catch {
        return null
    }
}

// 4. SSL
export const checkSSL = async (hostname: string) => {
    try {
        const tls = await import('tls')
        return new Promise<{valid: boolean, daysUntilExpiry: number}>((resolve) => {
            const socket = tls.connect(443, hostname, { servername: hostname }, () => {
                const cert = socket.getPeerCertificate()
                socket.destroy()
                if (!cert || !cert.valid_to) return resolve({ valid: false, daysUntilExpiry: 0 })
                const expiry = new Date(cert.valid_to)
                const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / 86400000)
                resolve({ valid: daysUntilExpiry > 0, daysUntilExpiry })
            })
            socket.on('error', () => resolve({ valid: false, daysUntilExpiry: 0 }))
            socket.setTimeout(5000, () => { socket.destroy(); resolve({ valid: false, daysUntilExpiry: 0 }) })
        })
    } catch {
        return { valid: false, daysUntilExpiry: 0 }
    }
}

export async function virusTotalHashLookup(hash: string) {
    try {
        const res = await axios.get(
            `https://www.virustotal.com/api/v3/files/${hash}`,
            {
                headers: { 'x-apikey': config.virusTotalApiKey },
                timeout: 15000,
            }
        )

        const stats = res.data?.data?.attributes?.last_analysis_stats || {}
        const positives = (stats.malicious || 0) + (stats.suspicious || 0)
        const total = (stats.harmless || 0) + positives + (stats.undetected || 0)

        return {
            positives,
            total,
            malicious: positives > 2,
            details: positives > 0
                ? [`VirusTotal: ${positives}/${total} engines flagged this file`]
                : ['VirusTotal: File hash clean'],
        }
    } catch {
        return { positives: 0, total: 0, malicious: false, details: ['VirusTotal: Hash not found'] }
    }
}

export function getThreatLevel(score: number): 'safe' | 'caution' | 'danger' | 'critical' {
    if (score >= 86) return 'critical'
    if (score >= 61) return 'danger'
    if (score >= 31) return 'caution'
    return 'safe'
}
