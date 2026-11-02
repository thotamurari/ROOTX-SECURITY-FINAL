import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft, Trash2, ShieldAlert, Zap, MessageSquare, CheckCircle2,
    RefreshCw, Clock, AlertTriangle, Bug, Globe, Shield, Flame,
    ChevronDown, Inbox as InboxIcon, MailOpen
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'

interface SecurityAlert {
    id: string
    title: string
    summary: string
    content: string
    date: string
    source: string
    url?: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    category: string
    read: boolean
}

const FALLBACK_ALERTS: SecurityAlert[] = [
    {
        id: '1',
        title: 'Critical RCE in Apache Struts — Active Exploitation Detected',
        summary: 'CVE-2024-53677 allows unauthenticated remote code execution. CVSS 9.8. Patches available.',
        content: 'Apache has released an emergency security update to address CVE-2024-53677, a critical remote code execution vulnerability affecting Apache Struts versions 2.0.0 through 6.3.0.2.\n\nThe vulnerability exists in the file upload mechanism and allows an unauthenticated attacker to execute arbitrary code on affected servers. Proof-of-concept exploits are already circulating.\n\nImpact: Full server compromise\nAction: Update to Struts 6.4.0 immediately',
        date: '2h ago',
        source: 'BleepingComputer',
        severity: 'critical',
        category: 'CVE',
        read: false,
    },
    {
        id: '2',
        title: 'LockBit 4.0 Targets Indian Banking Infrastructure',
        summary: 'New ransomware campaign targeting Indian financial institutions via spear-phishing emails disguised as RBI communications.',
        content: 'CERT-In has issued a critical advisory warning Indian banks about a new wave of LockBit 4.0 ransomware attacks. The threat actors are leveraging spear-phishing emails disguised as Reserve Bank of India communications.\n\nThe new variant features improved encryption speeds, anti-analysis techniques, and can exfiltrate data before encrypting systems. At least three cooperative banks have been affected.\n\nMitigation: Implement network segmentation, maintain offline backups, enable MFA on all critical systems.',
        date: '4h ago',
        source: 'CERT-In',
        severity: 'critical',
        category: 'Ransomware',
        read: false,
    },
    {
        id: '3',
        title: 'Google Patches Actively Exploited Chrome Zero-Day',
        summary: 'Type confusion vulnerability in V8 JavaScript engine allows remote code execution via crafted HTML page.',
        content: 'Google has released Chrome version 125.0.6422.112 to address CVE-2024-5274, a type confusion vulnerability in V8 being actively exploited in targeted attacks against journalists and activists.\n\nThe exploit allows remote attackers to execute arbitrary code via a specially crafted HTML page. Update Chrome immediately.\n\nAffected: All Chrome versions prior to 125.0.6422.112\nSeverity: High\nExploit: In the wild',
        date: '6h ago',
        source: 'The Hacker News',
        severity: 'high',
        category: 'Zero-Day',
        read: false,
    },
    {
        id: '4',
        title: 'Massive UPI Fraud Ring — 50,000 Victims Across India',
        summary: 'Police dismantle sophisticated phishing network targeting UPI users with fake payment confirmation pages.',
        content: 'Cybercrime division has arrested 12 members of a UPI fraud ring that operated across 8 states. The group used fake payment pages mimicking PhonePe, Google Pay, and Paytm.\n\nVictims received SMS messages claiming their UPI accounts would be suspended. The fraud ring processed over ₹15 crore in unauthorized transactions.\n\nProtection: Never share UPI PINs via any link. Use RootX Scan to verify suspicious URLs.',
        date: '10h ago',
        source: 'CyberScoop',
        severity: 'high',
        category: 'Phishing',
        read: true,
    },
    {
        id: '5',
        title: 'New Android Spyware "DragonEgg" Found Pre-Installed',
        summary: 'Pre-installed spyware discovered on budget Android phones with capability to record calls and exfiltrate personal data.',
        content: 'Lookout Security has discovered "DragonEgg" spyware pre-installed on several budget smartphone models sold in India. The spyware can record calls, capture screenshots, access camera/microphone.\n\nAn estimated 2 million devices may be affected. The spyware communicates with C2 servers in China.\n\nAction: Factory reset with a clean ROM or replace the device. Run RootX AndroidSEC scan to check your device.',
        date: '14h ago',
        source: 'SecurityWeek',
        severity: 'critical',
        category: 'Malware',
        read: true,
    },
    {
        id: '6',
        title: 'WhatsApp Vulnerability — Silent Message Interception',
        summary: 'Critical flaw allows attackers to intercept encrypted messages through a malicious GIF exploit.',
        content: 'Check Point researchers disclosed a critical WhatsApp vulnerability that could allow attackers to intercept end-to-end encrypted messages via a crafted GIF image.\n\nWhen the victim opens the GIF in chat preview, the exploit executes silently, granting access to message databases.\n\nAffected: WhatsApp versions prior to 2.24.8.77\nAction: Update WhatsApp immediately from Play Store.',
        date: '18h ago',
        source: 'The Hacker News',
        severity: 'high',
        category: 'Vulnerability',
        read: true,
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
    'Advisory': MessageSquare,
}

// Severity → semantic design tokens (light/dark aware via CSS variables)
const severityStyles: Record<string, { chip: string; icon: string }> = {
    critical: { chip: 'bg-danger-soft text-danger', icon: 'bg-danger-soft text-danger border-danger/25' },
    high: { chip: 'bg-warning-soft text-warning', icon: 'bg-warning-soft text-warning border-warning/25' },
    medium: { chip: 'bg-info-soft text-info', icon: 'bg-info-soft text-info border-info/25' },
    low: { chip: 'bg-success-soft text-success', icon: 'bg-success-soft text-success border-success/25' },
}

export default function Inbox() {
    const navigate = useNavigate()
    const [alerts, setAlerts] = useState<SecurityAlert[]>(FALLBACK_ALERTS)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'high'>('all')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [isLive, setIsLive] = useState(false)

    // Map a backend news item → a security alert row.
    const toAlert = (item: any, i: number, unreadFirst: number): SecurityAlert => ({
        id: item.id || `live-${i}`,
        title: item.title,
        summary: item.summary,
        content: item.content || item.summary,
        date: item.date || 'Today',
        source: item.source || 'Intelligence',
        url: item.url || undefined,
        severity: item.severity || 'medium',
        category: item.category || 'Advisory',
        read: i >= unreadFirst,
    })

    // Fetch live news from backend on mount. The /news endpoints are public
    // now, so this no longer depends on an auth token (which is why it never
    // loaded before — the Supabase token was always null under Firebase auth).
    useEffect(() => {
        const fetchLiveAlerts = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
                const res = await fetch(`${apiUrl}/news/feed`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.items && data.items.length > 0) {
                        setAlerts(data.items.map((it: any, i: number) => toAlert(it, i, 4)))
                        setIsLive(true)
                    }
                }
            } catch {
                // Keep fallback data silently
            }
        }
        fetchLiveAlerts()
    }, [])

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
            const res = await fetch(`${apiUrl}/news/refresh`, { method: 'POST' })
            if (res.ok) {
                const data = await res.json()
                if (data.items && data.items.length > 0) {
                    setAlerts(data.items.map((it: any, i: number) => toAlert(it, i, 0)))
                    setIsLive(true)
                }
            }
        } catch {
            // Keep existing data
        } finally {
            setIsRefreshing(false)
        }
    }, [])

    const markAllRead = () => {
        setAlerts(alerts.map(a => ({ ...a, read: true })))
    }

    const toggleRead = (id: string) => {
        setAlerts(alerts.map(a => a.id === id ? { ...a, read: !a.read } : a))
    }

    const deleteAlert = (id: string) => {
        setAlerts(alerts.filter(a => a.id !== id))
        if (expandedId === id) setExpandedId(null)
    }

    const filteredAlerts = alerts.filter(a => {
        if (filter === 'unread') return !a.read
        if (filter === 'critical') return a.severity === 'critical'
        if (filter === 'high') return a.severity === 'high'
        return true
    })

    const unreadCount = alerts.filter(a => !a.read).length
    const criticalCount = alerts.filter(a => a.severity === 'critical').length

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
                title="Tactical Inbox"
                description={`${unreadCount} unread · ${criticalCount} critical · ${alerts.length} total`}
                icon={<InboxIcon className="w-5 h-5" />}
                actions={
                    <>
                        {isLive && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-success-soft border border-success/25 rounded-full text-[11px] font-semibold text-success">
                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                Live
                            </span>
                        )}
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            aria-label="Refresh alerts"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllRead}
                            leftIcon={<MailOpen className="w-4 h-4" />}
                        >
                            Mark all read
                        </Button>
                    </>
                }
            />

            {/* Filter Tabs — segmented control */}
            <div className="overflow-x-auto no-scrollbar -mx-1 px-1 mb-5">
                <div
                    role="tablist"
                    aria-label="Filter alerts"
                    className="inline-flex items-center gap-1 bg-surface-2 rounded-lg p-1 min-w-full sm:min-w-0"
                >
                    {([
                        { key: 'all', label: 'All' },
                        { key: 'unread', label: `Unread (${unreadCount})` },
                        { key: 'critical', label: `Critical (${criticalCount})` },
                        { key: 'high', label: 'High' },
                    ] as const).map((f) => (
                        <button
                            key={f.key}
                            role="tab"
                            aria-selected={filter === f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold whitespace-nowrap transition-all duration-150 ${
                                filter === f.key
                                    ? 'bg-surface-1 shadow-xs text-text-primary'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Alerts Feed */}
            <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                    {filteredAlerts.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <EmptyState
                                icon={CheckCircle2}
                                title="All clear"
                                message="No security alerts match this filter. You're all caught up."
                            />
                        </motion.div>
                    ) : (
                        filteredAlerts.map((alert, i) => {
                            const CategoryIcon = categoryIcons[alert.category] || ShieldAlert
                            const isExpanded = expandedId === alert.id
                            const sev = severityStyles[alert.severity] || severityStyles.medium!

                            return (
                                <motion.div
                                    key={alert.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    transition={{ duration: 0.22, delay: Math.min(i, 12) * 0.03 }}
                                >
                                    <Card
                                        interactive
                                        padding="none"
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={isExpanded}
                                        aria-label={`${alert.read ? 'Read' : 'Unread'} alert: ${alert.title}`}
                                        onClick={() => {
                                            setExpandedId(isExpanded ? null : alert.id)
                                            if (!alert.read) toggleRead(alert.id)
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                setExpandedId(isExpanded ? null : alert.id)
                                                if (!alert.read) toggleRead(alert.id)
                                            }
                                        }}
                                        className={`group relative overflow-hidden p-4 sm:p-5 hover:border-accent/40 ${
                                            alert.read ? 'bg-surface-1/60' : 'border-l-2 border-l-accent'
                                        }`}
                                    >
                                        <div className="flex gap-3.5">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${sev.icon}`}>
                                                <CategoryIcon className="w-5 h-5" aria-hidden="true" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                                    <h3 className={`text-[14.5px] leading-snug tracking-tight flex items-start gap-2 min-w-0 ${
                                                        alert.read
                                                            ? 'font-medium text-text-secondary'
                                                            : 'font-semibold text-text-primary'
                                                    }`}>
                                                        {!alert.read && (
                                                            <span
                                                                aria-hidden="true"
                                                                className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5"
                                                            />
                                                        )}
                                                        <span className="min-w-0">
                                                            {alert.title}
                                                            <span className="sr-only">{alert.read ? ' (read)' : ' (unread)'}</span>
                                                        </span>
                                                    </h3>
                                                    <ChevronDown
                                                        aria-hidden="true"
                                                        className={`w-4 h-4 text-text-tertiary shrink-0 mt-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    />
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${sev.chip}`}>
                                                        {alert.severity}
                                                    </span>
                                                    <span className="text-[12px] text-text-tertiary">{alert.category}</span>
                                                    <span className="text-[12px] text-text-tertiary flex items-center gap-1.5 ml-auto">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {alert.date}
                                                    </span>
                                                </div>

                                                <p className="text-[13px] text-text-secondary leading-relaxed">
                                                    {alert.summary}
                                                </p>

                                                {/* Expanded content */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.25 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="mt-4 pt-4 border-t border-border">
                                                                {alert.content.split('\n\n').map((para, pi) => (
                                                                    <p key={pi} className="text-[13px] text-text-secondary leading-relaxed mb-3">
                                                                        {para.split('\n').map((line, li) => (
                                                                            <span key={li}>{line}<br/></span>
                                                                        ))}
                                                                    </p>
                                                                ))}

                                                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                                                    <span className="text-[12px] text-text-tertiary">
                                                                        Source: {alert.source}
                                                                    </span>
                                                                    <div className="ml-auto flex items-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); toggleRead(alert.id) }}
                                                                            className="text-[12px] font-semibold text-accent hover:bg-accent-soft rounded-md px-2.5 py-1.5 transition-colors"
                                                                        >
                                                                            {alert.read ? 'Mark unread' : 'Mark read'}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); deleteAlert(alert.id) }}
                                                                            className="text-[12px] font-semibold text-text-tertiary hover:text-danger hover:bg-danger-soft rounded-md transition-colors flex items-center gap-1.5 px-2.5 py-1.5"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" /> Dismiss
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
