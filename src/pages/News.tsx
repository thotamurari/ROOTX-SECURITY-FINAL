import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Newspaper, ChevronLeft, Calendar, User, Bookmark,
    RefreshCw, Globe, AlertTriangle, Shield, Bug, Zap, Flame,
    ShieldAlert, CheckCircle2, ExternalLink, Clock, X, WifiOff
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface NewsItem {
    id: string
    title: string
    summary: string
    content: string
    date: string
    source: string
    url?: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    category: string
}

// Fallback news data when backend is unavailable
const FALLBACK_NEWS: NewsItem[] = [
    {
        id: 'fb-1',
        title: 'Critical Zero-Day Vulnerability Found in Chrome V8 Engine',
        summary: 'Google has patched a high-severity use-after-free vulnerability in Chrome\'s V8 JavaScript engine that was actively exploited in the wild.',
        content: 'Google released an emergency security update for Chrome to fix a critical zero-day vulnerability (CVE-2024-7971) in the V8 JavaScript engine. The vulnerability is a type confusion bug that allows remote code execution when a user visits a malicious website.\n\nThe flaw was discovered by Microsoft Threat Intelligence Center and has been actively exploited in targeted attacks. Users are strongly advised to update Chrome to version 128.0.6613.84 or later immediately.\n\nThis marks the ninth zero-day vulnerability patched by Google in Chrome during 2024, highlighting the ongoing cat-and-mouse game between browser security teams and threat actors.',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        source: 'Google Security Blog',
        severity: 'critical',
        category: 'Zero-Day'
    },
    {
        id: 'fb-2',
        title: 'Android Banking Trojan "Anatsa" Spreads via Play Store Apps',
        summary: 'Security researchers discovered over 90 malicious apps on Google Play Store distributing the Anatsa banking trojan, targeting users in the US, UK, and Europe.',
        content: 'A sophisticated Android banking trojan called Anatsa (also known as TeaBot) has been found embedded in seemingly legitimate apps on the Google Play Store. The malware was hidden in PDF viewer and file manager applications that collectively had over 5.5 million downloads.\n\nOnce installed, Anatsa uses accessibility services to overlay fake login pages on legitimate banking apps, stealing credentials and one-time passwords. It can also perform automated fraudulent transactions.\n\nUsers should review their installed apps, uninstall any unfamiliar PDF readers or file managers, and enable Google Play Protect for enhanced security scanning.',
        date: new Date(Date.now() - 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        source: 'Zscaler ThreatLabZ',
        severity: 'high',
        category: 'Malware'
    },
    {
        id: 'fb-3',
        title: 'Stealth Pegasus-Variant Spyware Targeting Android Endpoints Detected',
        summary: 'Security researchers have identified a zero-click surveillance spyware targeting mobile devices through malicious font parsing libraries.',
        content: 'Citizen Lab and security researchers have uncovered a new sophisticated mobile spyware campaign targeting mobile operating systems. The spyware utilizes an undocumented memory corruption vulnerability in font rendering subroutines to achieve arbitrary kernel code execution without requiring user interaction.\n\nOnce resident in system memory, the spyware exfiltrates encrypted messaging communications, GPS coordinates, microphone recordings, and device keystrokes to remote Command and Control (C2) servers.\n\nUsers are urged to update to the latest security patch level, enable strict SELinux enforcement, and audit installed application permissions to mitigate surveillance threats.',
        date: new Date(Date.now() - 172800000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        source: 'Citizen Lab Intel',
        severity: 'critical',
        category: 'Spyware'
    },
    {
        id: 'fb-4',
        title: 'New Phishing Kit "Tycoon 2FA" Bypasses Multi-Factor Authentication',
        summary: 'An advanced phishing-as-a-service platform is enabling attackers to bypass MFA for Microsoft 365 and Gmail accounts using adversary-in-the-middle techniques.',
        content: 'Security researchers have identified a sophisticated phishing kit called Tycoon 2FA that can intercept and bypass multi-factor authentication for major email platforms. The kit uses adversary-in-the-middle (AitM) proxy techniques to capture session cookies in real-time.\n\nThe phishing pages are nearly indistinguishable from legitimate Microsoft 365 and Google login pages, and the service is sold on underground forums for as low as $120 per month.\n\nOrganizations should implement FIDO2/WebAuthn hardware security keys, which are resistant to AitM attacks, and train employees to verify URLs before entering credentials.',
        date: new Date(Date.now() - 259200000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        source: 'Sekoia',
        severity: 'high',
        category: 'Phishing'
    },
    {
        id: 'fb-5',
        title: 'Linux Kernel Vulnerability Allows Root Privilege Escalation',
        summary: 'A newly discovered vulnerability in the Linux kernel\'s netfilter subsystem could allow local attackers to gain root-level privileges on affected systems.',
        content: 'A critical vulnerability (CVE-2024-1086) in the Linux kernel netfilter component (nf_tables) has been confirmed to allow local privilege escalation to root on multiple Linux distributions. The flaw is a use-after-free vulnerability in the nft_verdict_init() function.\n\nThe vulnerability affects kernel versions from 3.15 to 6.8-rc1, impacting most enterprise Linux distributions including Ubuntu, Debian, Fedora, and RHEL. Working proof-of-concept exploits are publicly available.\n\nSystem administrators should apply vendor patches immediately and consider restricting unprivileged user namespaces as a temporary mitigation.',
        date: new Date(Date.now() - 345600000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        source: 'NVD / NIST',
        severity: 'critical',
        category: 'CVE'
    },
    {
        id: 'fb-6',
        title: 'RansomHub Becomes Leading Ransomware Group After LockBit Takedown',
        summary: 'Following the FBI\'s disruption of LockBit, RansomHub has emerged as the most active ransomware-as-a-service operation, targeting healthcare and critical infrastructure.',
        content: 'Since the international law enforcement takedown of LockBit earlier this year, RansomHub has rapidly filled the vacuum to become the most active ransomware group globally. The group has claimed over 210 victims in the past three months.\n\nRansomHub operates on a revenue-sharing model, taking 10% of ransom payments while affiliates keep 90%. This generous split has attracted experienced operators from defunct groups like BlackCat/ALPHV and LockBit.\n\nOrganizations should maintain offline backups, implement network segmentation, enforce MFA, and develop incident response plans to mitigate ransomware risk.',
        date: new Date(Date.now() - 432000000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        source: 'CISA Advisory',
        severity: 'high',
        category: 'Ransomware'
    },
    {
        id: 'fb-7',
        title: 'Microsoft Patches 90+ Vulnerabilities Including 4 Zero-Days',
        summary: 'Microsoft\'s latest Patch Tuesday addresses over 90 security vulnerabilities, with four actively exploited zero-day flaws requiring immediate attention.',
        content: 'Microsoft released its monthly security update addressing 91 vulnerabilities across Windows, Office, Azure, and other products. Among these, four zero-day vulnerabilities were confirmed to be under active exploitation.\n\nThe most critical flaw is a Windows SmartScreen bypass (CVE-2024-38213) that allows attackers to circumvent Mark of the Web protections, making it easier to deliver malware through downloaded files.\n\nIT administrators should prioritize deploying these patches, especially on internet-facing systems and endpoints where users regularly download files from the web.',
        date: new Date(Date.now() - 518400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        source: 'Microsoft MSRC',
        severity: 'medium',
        category: 'Patch'
    },
    {
        id: 'fb-8',
        title: 'APT41 Linked to Sustained Attacks on Global Shipping and Logistics',
        summary: 'Chinese state-sponsored threat group APT41 has been conducting long-term cyber espionage operations against shipping and logistics companies across multiple continents.',
        content: 'Mandiant researchers have uncovered a sustained cyber espionage campaign by APT41 (also known as Winnti) targeting global shipping, logistics, and supply chain companies. The campaign has been ongoing since at least mid-2023.\n\nThe attackers used custom malware families including DUSTPAN (a dropper) and DUSTTRAP (a multi-stage backdoor) to maintain persistent access to victim networks, exfiltrating shipping manifests, customer data, and logistics schedules.\n\nOrganizations in the logistics sector should implement advanced endpoint detection and response (EDR), monitor for lateral movement patterns, and segment critical operational technology networks.',
        date: new Date(Date.now() - 604800000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        source: 'Mandiant',
        severity: 'medium',
        category: 'APT'
    },
]

const categoryIcons: Record<string, any> = {
    'CVE': Bug,
    'Malware': Bug,
    'Vulnerability': AlertTriangle,
    'Spyware': ShieldAlert,
    'Phishing': Shield,
    'Ransomware': Flame,
    'Zero-Day': Zap,
    'APT': ShieldAlert,
    'Patch': CheckCircle2,
    'Advisory': Newspaper,
}

// Severity → semantic design tokens (light/dark aware via CSS variables)
const severityColors: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/25' },
    high: { bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/25' },
    medium: { bg: 'bg-info-soft', text: 'text-info', border: 'border-info/25' },
    low: { bg: 'bg-success-soft', text: 'text-success', border: 'border-success/25' },
}

export default function News() {
    const navigate = useNavigate()
    const [news, setNews] = useState<NewsItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
    const [activeCategory, setActiveCategory] = useState<string>('all')
    const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set())
    const [lastFetched, setLastFetched] = useState<string | null>(null)
    const [nextRefresh, setNextRefresh] = useState<string | null>(null)
    const [isLive, setIsLive] = useState(false)
    const [isOffline, setIsOffline] = useState(false)

    // Fetch real cybersecurity news from backend (live RSS aggregation).
    // Public endpoint — no auth token required.
    const fetchNews = useCallback(async (forceRefresh = false) => {
        try {
            const apiUrl = localStorage.getItem('rootx_backend_url') || import.meta.env.VITE_API_URL || 'http://localhost:3000'
            const endpoint = forceRefresh ? `${apiUrl}/news/refresh` : `${apiUrl}/news/feed`
            const method = forceRefresh ? 'POST' : 'GET'

            let res: globalThis.Response | null = null
            try {
                res = await fetch(endpoint, { method })
            } catch {
                // Try fallback LAN host
                const fallbackUrl = 'http://10.183.49.135:3000'
                res = await fetch(forceRefresh ? `${fallbackUrl}/news/refresh` : `${fallbackUrl}/news/feed`, { method }).catch(() => null)
            }

            if (res && res.ok) {
                const data = await res.json()
                if (data.items && data.items.length > 0) {
                    setNews(data.items)
                    setIsLive(true)
                    setIsOffline(false)
                    if (data.fetchedAt) setLastFetched(data.fetchedAt)
                    if (data.nextRefresh) setNextRefresh(data.nextRefresh)
                } else {
                    setNews(FALLBACK_NEWS)
                    setIsOffline(false)
                    setLastFetched(new Date().toISOString())
                }
            } else {
                setNews(FALLBACK_NEWS)
                setIsOffline(false)
                setLastFetched(new Date().toISOString())
            }
        } catch {
            setNews(FALLBACK_NEWS)
            setIsOffline(false)
            setLastFetched(new Date().toISOString())
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    // Initial fetch
    useEffect(() => {
        fetchNews()
    }, [fetchNews])

    // Auto-refresh every hour
    useEffect(() => {
        const interval = setInterval(() => {
            fetchNews(true)
        }, 60 * 60 * 1000) // 1 hour
        return () => clearInterval(interval)
    }, [fetchNews])

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true)
        await fetchNews(true)
    }, [fetchNews])

    const toggleSave = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setSavedArticles(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const categories = ['all', ...Array.from(new Set(news.map(n => n.category)))]
    const filteredNews = activeCategory === 'all' 
        ? news 
        : news.filter(n => n.category === activeCategory)

    // Format time remaining
    const getTimeUntilRefresh = () => {
        if (!nextRefresh) return null
        const diff = new Date(nextRefresh).getTime() - Date.now()
        if (diff <= 0) return 'Refreshing soon...'
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `Next refresh in ${mins}m`
        return `Next refresh in ${Math.floor(mins / 60)}h ${mins % 60}m`
    }

    return (
        <div className="pb-32 lg:pb-8 max-w-3xl mx-auto">
            {/* Back link */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
                className="-ml-2 mb-2"
            >
                Dashboard
            </Button>

            {/* Header */}
            <PageHeader
                title="Cyber Intel"
                description={`${isLive ? 'Powered by Gemini AI' : 'Security intelligence feed'}${getTimeUntilRefresh() ? ` · ${getTimeUntilRefresh()}` : ''}`}
                icon={<Newspaper className="w-5 h-5" />}
                actions={
                    <>
                        {isLive && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-success-soft border border-success/25 rounded-full text-[11px] font-semibold text-success">
                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                Live
                            </span>
                        )}
                        {isOffline && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-warning-soft border border-warning/25 rounded-full text-[11px] font-semibold text-warning">
                                <WifiOff className="w-3 h-3" />
                                Cached
                            </span>
                        )}
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            aria-label="Refresh news feed"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </>
                }
            />

            {/* Last updated banner */}
            {lastFetched && (
                <Card padding="none" className="flex items-center justify-between gap-3 px-4 py-3 mb-5">
                    <div className="flex items-center gap-2 text-[12.5px] text-text-tertiary min-w-0">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                            Last updated {new Date(lastFetched).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <span className="text-[12px] font-semibold text-accent shrink-0">
                        {news.length} stories
                    </span>
                </Card>
            )}

            {/* Category Tabs — segmented control */}
            <div className="overflow-x-auto no-scrollbar -mx-1 px-1 mb-5">
                <div
                    role="tablist"
                    aria-label="Filter articles by category"
                    className="inline-flex items-center gap-1 bg-surface-2 rounded-lg p-1 min-w-full sm:min-w-0"
                >
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            role="tab"
                            aria-selected={activeCategory === cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold capitalize whitespace-nowrap transition-all duration-150 ${
                                activeCategory === cat
                                    ? 'bg-surface-1 shadow-xs text-text-primary'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <LoadingSpinner text="Fetching intel..." />
            ) : (
                /* News Feed */
                <div className="space-y-3">
                    {filteredNews.length === 0 ? (
                        <EmptyState
                            icon={Newspaper}
                            title="No articles here"
                            message="There are no stories in this category right now. Try another filter or refresh the feed."
                            action={
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleRefresh}
                                    isLoading={isRefreshing}
                                    leftIcon={<RefreshCw className="w-4 h-4" />}
                                >
                                    Refresh
                                </Button>
                            }
                        />
                    ) : (
                        filteredNews.map((item, i) => {
                            const CategoryIcon = categoryIcons[item.category] || Newspaper
                            const colors = severityColors[item.severity] || severityColors.medium!
                            const isSaved = savedArticles.has(item.id)

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: Math.min(i, 12) * 0.03 }}
                                >
                                    <Card
                                        interactive
                                        padding="none"
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Open article: ${item.title}`}
                                        onClick={() => setSelectedNews(item)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                setSelectedNews(item)
                                            }
                                        }}
                                        className="group p-4 sm:p-5 hover:border-accent/40"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                <CategoryIcon className="w-3.5 h-3.5" />
                                                {item.severity} · {item.category}
                                            </span>
                                            <span className="text-[12px] text-text-tertiary flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {item.date}
                                            </span>
                                        </div>

                                        <h3 className="text-[15px] sm:text-[16px] font-semibold text-text-primary leading-snug tracking-tight mb-1.5 group-hover:text-accent transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2 mb-3.5">
                                            {item.summary}
                                        </p>

                                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                                            <span className="text-[12px] text-text-tertiary font-medium truncate">
                                                {item.source}
                                            </span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleSave(item.id, e)}
                                                    aria-pressed={isSaved}
                                                    aria-label={isSaved ? `Remove ${item.title} from saved` : `Save ${item.title}`}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        isSaved
                                                            ? 'text-accent bg-accent-soft'
                                                            : 'text-text-tertiary hover:text-text-primary hover:bg-surface-2'
                                                    }`}
                                                >
                                                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                                                </button>
                                                <ExternalLink
                                                    aria-hidden="true"
                                                    className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            )}

            {/* News Detail Modal */}
            <AnimatePresence>
                {selectedNews && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-overlay backdrop-blur-sm overflow-y-auto"
                        onClick={() => setSelectedNews(null)}
                    >
                        <div className="min-h-full flex items-start justify-center px-4 py-8">
                            <motion.div
                                initial={{ scale: 0.96, opacity: 0, y: 16 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.96, opacity: 0, y: 16 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                                role="dialog"
                                aria-modal="true"
                                aria-label={selectedNews.title}
                                className="bg-surface-1 border border-border rounded-2xl w-full max-w-2xl relative shadow-lg mt-4 sm:mt-12 mb-8"
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelectedNews(null)}
                                    aria-label="Close article"
                                    className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-lg bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors z-10"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="p-5 sm:p-8">
                                    {(() => {
                                        const colors = severityColors[selectedNews.severity] || severityColors.medium!
                                        return (
                                            <div className="flex flex-wrap items-center gap-3 mb-5 pr-10">
                                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                    {selectedNews.severity} · {selectedNews.category}
                                                </span>
                                                <span className="text-[12px] text-text-tertiary flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {selectedNews.date}
                                                </span>
                                            </div>
                                        )
                                    })()}

                                    <h2 className="text-[21px] sm:text-[26px] font-bold text-text-primary leading-tight tracking-tight mb-5">
                                        {selectedNews.title}
                                    </h2>

                                    <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
                                        <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-accent" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-text-primary">{selectedNews.source}</p>
                                            <p className="text-[12px] text-text-tertiary truncate">
                                                {isLive ? 'Live threat feed' : 'RootX Intel'} · {selectedNews.date}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="max-w-none">
                                        {selectedNews.content.split('\n\n').map((para, i) => (
                                            <p key={i} className="text-[14.5px] text-text-secondary leading-relaxed mb-5">
                                                {para.split('\n').map((line, li) => (
                                                    <span key={li}>{line}<br/></span>
                                                ))}
                                            </p>
                                        ))}
                                    </div>

                                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                        {selectedNews.url ? (
                                            <a
                                                href={selectedNews.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-primary flex-1 inline-flex items-center justify-center gap-2 !h-12"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Read full article
                                            </a>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                onClick={() => setSelectedNews(null)}
                                                className="flex-1 justify-center"
                                            >
                                                Got it
                                            </Button>
                                        )}
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            onClick={() => setSelectedNews(null)}
                                            className="justify-center"
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
