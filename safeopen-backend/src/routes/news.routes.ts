import express, { type Response, type Request } from 'express'
import Parser from 'rss-parser'
import logger from '../utils/logger.js'

const router = express.Router()

interface NewsItem {
    id: string
    title: string
    summary: string
    content: string
    date: string
    source: string
    url: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    category: string
    publishedAt: number
}

interface CachedNews {
    items: NewsItem[]
    fetchedAt: number
}

const INITIAL_NEWS: NewsItem[] = [
    {
        id: 'cve-2024-chrome-v8',
        title: 'Critical Zero-Day Vulnerability Found in Chrome V8 Engine',
        summary: 'Google released an emergency security update for Chrome to fix a critical zero-day vulnerability (CVE-2024-7971) in the V8 JavaScript engine actively exploited in the wild.',
        content: 'Google released an emergency security update for Chrome to fix a critical zero-day vulnerability (CVE-2024-7971) in the V8 JavaScript engine. The vulnerability is a type confusion bug that allows remote code execution when a user visits a malicious website.\n\nThe flaw was discovered by Microsoft Threat Intelligence Center and has been actively exploited in targeted attacks. Users are strongly advised to update Chrome immediately.\n\nThis marks a high-priority advisory patched by Google in Chrome, highlighting ongoing exploitation campaigns against mobile and desktop browsers.',
        date: 'Just now',
        source: 'Google Security Blog',
        url: 'https://chromereleases.googleblog.com/',
        severity: 'critical',
        category: 'Zero-Day',
        publishedAt: Date.now() - 1000 * 60 * 15,
    },
    {
        id: 'anatsa-banking-trojan',
        title: 'Android Banking Trojan "Anatsa" Spreads via Disguised PDF Utilities',
        summary: 'Security researchers discovered malicious apps on Google Play Store distributing the Anatsa banking trojan, targeting mobile banking applications.',
        content: 'A sophisticated Android banking trojan called Anatsa (also known as TeaBot) has been found embedded in disguised utility apps. The malware targets users by overlaying credential stealers over legitimate banking applications.\n\nOnce installed, Anatsa uses accessibility services to capture one-time passwords (OTPs) and banking login details.\n\nUsers should audit their installed apps using RootX Security and uninstall any suspicious third-party PDF readers or cleaner utilities.',
        date: '2h ago',
        source: 'ThreatLabZ',
        url: 'https://thehackernews.com/',
        severity: 'high',
        category: 'Malware',
        publishedAt: Date.now() - 1000 * 60 * 60 * 2,
    },
    {
        id: 'tycoon-2fa-phishing',
        title: 'New Phishing Kit "Tycoon 2FA" Targets Mobile Users via SMS and Email',
        summary: 'An advanced phishing-as-a-service platform is enabling threat actors to bypass MFA for Microsoft and Google accounts using AitM proxy techniques.',
        content: 'Security researchers have identified a sophisticated phishing platform called Tycoon 2FA that can intercept and bypass multi-factor authentication for email and banking accounts.\n\nThe phishing links are distributed via SMS text messages (smishing) and WhatsApp scams.\n\nAlways verify sender domains and use RootX Scan Engine before opening unexpected links received in messages.',
        date: '5h ago',
        source: 'BleepingComputer',
        url: 'https://www.bleepingcomputer.com/',
        severity: 'high',
        category: 'Phishing',
        publishedAt: Date.now() - 1000 * 60 * 60 * 5,
    },
    {
        id: 'linux-netfilter-privilege',
        title: 'Linux Kernel Netfilter Vulnerability Disclosed (CVE-2024-1086)',
        summary: 'A critical vulnerability in the Linux kernel netfilter subsystem allows local privilege escalation to root on affected distributions.',
        content: 'A critical vulnerability (CVE-2024-1086) in the Linux kernel netfilter component (nf_tables) allows local privilege escalation to root. The flaw is a use-after-free bug affecting multiple enterprise and mobile kernel branches.',
        date: '1 day ago',
        source: 'NVD / NIST',
        url: 'https://nvd.nist.gov/',
        severity: 'critical',
        category: 'CVE',
        publishedAt: Date.now() - 1000 * 60 * 60 * 24,
    },
    {
        id: 'upi-suspension-scam-india',
        title: 'Cyber Advisory: Fake Bank APKs and UPI Suspension Message Waves',
        summary: 'National cyber agencies warn against APK files sent via WhatsApp masquerading as official bank or telecom reward apps.',
        content: 'Fraudsters are sending malicious APK downloads through WhatsApp and Telegram claiming to offer cashback or resolve suspended UPI accounts. When installed, these APKs steal SMS verification codes and siphon funds.\n\nRootX users are advised never to install APK files shared via chat apps.',
        date: '1 day ago',
        source: 'CERT-In Alert',
        url: 'https://www.cert-in.org.in/',
        severity: 'critical',
        category: 'Advisory',
        publishedAt: Date.now() - 1000 * 60 * 60 * 28,
    },
]

let newsCache: CachedNews = {
    items: INITIAL_NEWS,
    fetchedAt: Date.now(),
}

const CACHE_DURATION = 20 * 60 * 1000 // 20 minutes

const FEEDS: { url: string; source: string }[] = [
    { url: 'https://feeds.feedburner.com/TheHackersNews', source: 'The Hacker News' },
    { url: 'https://www.bleepingcomputer.com/feed/', source: 'BleepingComputer' },
    { url: 'https://krebsonsecurity.com/feed/', source: 'Krebs on Security' },
    { url: 'https://www.securityweek.com/feed/', source: 'SecurityWeek' },
]

const parser: Parser = new Parser({
    timeout: 4000,
    headers: { 'User-Agent': 'RootX-Security-NewsBot/1.0 (+https://rootx.security)' },
})

function stripHtml(s: string): string {
    return (s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function classifySeverity(text: string): NewsItem['severity'] {
    const t = text.toLowerCase()
    if (/(zero[- ]day|actively exploited|in the wild|remote code execution|\brce\b|wormable|cvss[:\s]*(9|10)|emergency (patch|update)|critical)/.test(t)) return 'critical'
    if (/(ransomware|data breach|breach|exploit|backdoor|\bapt\b|trojan|spyware|malware|high[- ]severity|cve-)/.test(t)) return 'high'
    if (/(phishing|scam|patch|update|advisory|misconfiguration)/.test(t)) return 'medium'
    return 'low'
}

function classifyCategory(text: string): string {
    const t = text.toLowerCase()
    if (/ransomware/.test(t)) return 'Ransomware'
    if (/zero[- ]day/.test(t)) return 'Zero-Day'
    if (/spyware|pegasus|surveillance|trojan|stealer|backdoor/.test(t)) return 'Spyware'
    if (/data breach|leaked|exposed database|breach/.test(t)) return 'Vulnerability'
    if (/phishing|smishing|scam/.test(t)) return 'Phishing'
    if (/\bapt\b|nation[- ]state|state[- ]sponsored/.test(t)) return 'APT'
    if (/ransomware|trojan|spyware|botnet|malware|worm|stealer/.test(t)) return 'Malware'
    if (/\bcve-\d/.test(t)) return 'CVE'
    if (/patch|update released|fixes|security update/.test(t)) return 'Patch'
    if (/vulnerabilit|flaw|bug/.test(t)) return 'Vulnerability'
    return 'Advisory'
}

function relativeTime(ts: number): string {
    const diff = Date.now() - ts
    const h = Math.floor(diff / 3600000)
    if (h < 1) return 'Just now'
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    return d === 1 ? '1 day ago' : `${d} days ago`
}

async function fetchFeed(feed: { url: string; source: string }): Promise<NewsItem[]> {
    try {
        const parsed = await parser.parseURL(feed.url)
        return (parsed.items || []).slice(0, 10).map((item, i) => {
            const title = stripHtml(item.title || 'Untitled')
            const summaryRaw = stripHtml(item.contentSnippet || item.summary || item.content || '')
            const summary = summaryRaw.length > 320 ? summaryRaw.slice(0, 317) + '…' : summaryRaw
            const content = stripHtml((item as any)['content:encoded'] || item.content || summaryRaw)
            const publishedAt = item.isoDate ? new Date(item.isoDate).getTime() : Date.now()
            const haystack = `${title} ${summaryRaw}`
            return {
                id: item.guid || item.link || `${feed.source}-${i}-${publishedAt}`,
                title,
                summary,
                content: content.length > 2000 ? content.slice(0, 2000) + '…' : content,
                date: relativeTime(publishedAt),
                source: feed.source,
                url: item.link || '',
                severity: classifySeverity(haystack),
                category: classifyCategory(haystack),
                publishedAt,
            }
        })
    } catch {
        return []
    }
}

let isRefreshingFeeds = false
async function refreshFeedsInBackground(): Promise<void> {
    if (isRefreshingFeeds) return
    isRefreshingFeeds = true
    try {
        const results = await Promise.allSettled(FEEDS.map(fetchFeed))
        const items: NewsItem[] = []
        for (const r of results) {
            if (r.status === 'fulfilled') items.push(...r.value)
        }

        if (items.length > 0) {
            const allItems = [...items, ...INITIAL_NEWS]
            const seen = new Set<string>()
            const deduped = allItems
                .sort((a, b) => b.publishedAt - a.publishedAt)
                .filter(it => {
                    const key = it.title.toLowerCase().trim()
                    if (seen.has(key)) return false
                    seen.add(key)
                    return true
                })
                .slice(0, 40)

            newsCache = {
                items: deduped,
                fetchedAt: Date.now(),
            }
            logger.info(`[News] Refreshed ${deduped.length} articles in cache`)
        }
    } catch (err: any) {
        logger.warn('[News] Background refresh failed:', err.message)
    } finally {
        isRefreshingFeeds = false
    }
}

// Kick off initial background refresh
void refreshFeedsInBackground()

function respond(res: Response, items: NewsItem[], fetchedAt: number, cached: boolean) {
    res.json({
        items,
        fetchedAt: new Date(fetchedAt).toISOString(),
        cached,
        nextRefresh: new Date(fetchedAt + CACHE_DURATION).toISOString(),
    })
}

// ── GET /news/feed — instant response from cache + background refresh ────
router.get('/feed', async (_req: Request, res: Response) => {
    try {
        const now = Date.now()
        // If cache is older than duration, trigger non-blocking refresh
        if (now - newsCache.fetchedAt > CACHE_DURATION) {
            void refreshFeedsInBackground()
        }
        respond(res, newsCache.items, newsCache.fetchedAt, true)
    } catch (err: any) {
        logger.error('News feed error', { error: err.message })
        respond(res, INITIAL_NEWS, Date.now(), false)
    }
})

// ── POST /news/refresh — force a fresh pull ──────────────────────────────
router.post('/refresh', async (_req: Request, res: Response) => {
    try {
        await refreshFeedsInBackground()
        respond(res, newsCache.items, newsCache.fetchedAt, false)
    } catch (err: any) {
        logger.error('News refresh error', { error: err.message })
        respond(res, newsCache.items, newsCache.fetchedAt, true)
    }
})

export default router
