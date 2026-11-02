import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldX, ShieldAlert, ShieldCheck, ShieldQuestion, Search, Globe, Server } from 'lucide-react'
import type { VendorResult, VendorCategory, DetectionStats } from '@/types/api'

interface Props {
    vendors: VendorResult[]
    stats: DetectionStats
    domain?: string
    resolvedIp?: string | null
    scannedAtUtc?: string
}

type FilterId = 'all' | VendorCategory

const CATEGORY_META: Record<VendorCategory, { label: string; dot: string; text: string; chip: string; icon: typeof ShieldX }> = {
    malicious:  { label: 'Malicious',  dot: 'bg-danger',  text: 'text-danger',  chip: 'bg-danger-soft text-danger',   icon: ShieldX },
    suspicious: { label: 'Suspicious', dot: 'bg-warning', text: 'text-warning', chip: 'bg-warning-soft text-warning',  icon: ShieldAlert },
    clean:      { label: 'Clean',      dot: 'bg-success', text: 'text-success', chip: 'bg-success-soft text-success',  icon: ShieldCheck },
    undetected: { label: 'Undetected', dot: 'bg-text-tertiary', text: 'text-text-tertiary', chip: 'bg-surface-2 text-text-tertiary', icon: ShieldQuestion },
}

const SUMMARY_CARDS: { id: VendorCategory; label: string }[] = [
    { id: 'malicious', label: 'Malicious' },
    { id: 'suspicious', label: 'Suspicious' },
    { id: 'clean', label: 'Clean' },
    { id: 'undetected', label: 'Undetected' },
]

/**
 * VirusTotal-inspired multi-engine detection report. Renders the REAL
 * per-engine verdicts returned by VirusTotal (passed down from the backend),
 * not a fabricated summary. Information architecture is inspired by
 * VirusTotal's clarity; the visual design is original to RootX.
 */
export function VendorReport({ vendors, stats, domain, resolvedIp, scannedAtUtc }: Props) {
    const [filter, setFilter] = useState<FilterId>('all')
    const [query, setQuery] = useState('')

    const flagged = stats.malicious + stats.suspicious
    const ratioPct = stats.total > 0 ? Math.round((flagged / stats.total) * 100) : 0
    const ringColor = stats.malicious > 0 ? 'var(--danger)' : stats.suspicious > 0 ? 'var(--warning)' : 'var(--success)'

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return vendors.filter(v => {
            if (filter !== 'all' && v.category !== filter) return false
            if (q && !v.engine.toLowerCase().includes(q)) return false
            return true
        })
    }, [vendors, filter, query])

    const FILTERS: { id: FilterId; label: string; count: number }[] = [
        { id: 'all', label: 'All', count: stats.total },
        { id: 'malicious', label: 'Malicious', count: stats.malicious },
        { id: 'suspicious', label: 'Suspicious', count: stats.suspicious },
        { id: 'clean', label: 'Clean', count: stats.clean },
        { id: 'undetected', label: 'Undetected', count: stats.undetected },
    ]

    return (
        <div className="space-y-4">
            {/* ── Detection summary ── */}
            <div className="bg-surface-1 border border-border rounded-2xl shadow-xs p-5">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Detection ratio ring */}
                    <div className="relative shrink-0" style={{ width: 104, height: 104 }} role="img"
                        aria-label={`${flagged} of ${stats.total} security vendors flagged this URL`}>
                        <svg aria-hidden="true" className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 104 104">
                            <circle cx="52" cy="52" r="46" fill="none" stroke="var(--border-default)" strokeWidth="7" />
                            <motion.circle
                                cx="52" cy="52" r="46" fill="none" stroke={ringColor} strokeWidth="7" strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 46}
                                initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - (stats.total > 0 ? flagged / stats.total : 0)) }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[26px] leading-none font-bold tabular-nums text-text-primary">{flagged}</span>
                            <span className="text-[10.5px] text-text-tertiary mt-0.5">/ {stats.total}</span>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                            <h4 className="text-[15px] font-bold text-text-primary">Detection summary</h4>
                        </div>
                        <p className="text-[12.5px] text-text-secondary text-center sm:text-left mb-3">
                            {flagged > 0
                                ? `${flagged} security ${flagged === 1 ? 'vendor' : 'vendors'} (${ratioPct}%) flagged this URL.`
                                : `No security vendors flagged this URL.`}
                        </p>
                        {(domain || resolvedIp) && (
                            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                                {domain && (
                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-mono text-text-secondary bg-surface-2 border border-border rounded-lg px-2.5 py-1">
                                        <Globe className="w-3.5 h-3.5 text-text-tertiary" /> {domain}
                                    </span>
                                )}
                                {resolvedIp && (
                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-mono text-text-secondary bg-surface-2 border border-border rounded-lg px-2.5 py-1">
                                        <Server className="w-3.5 h-3.5 text-text-tertiary" /> {resolvedIp}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                    {SUMMARY_CARDS.map(card => {
                        const meta = CATEGORY_META[card.id]
                        return (
                            <div key={card.id} className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-center">
                                <div className={`text-[20px] font-bold tabular-nums ${meta.text}`}>{stats[card.id]}</div>
                                <div className="text-[11px] text-text-tertiary mt-0.5">{card.label}</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Vendor list ── */}
            <div className="bg-surface-1 border border-border rounded-2xl shadow-xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <h4 className="text-[13.5px] font-semibold text-text-primary shrink-0">Security vendors</h4>
                    <div className="relative sm:ml-auto w-full sm:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" aria-hidden="true" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search vendors..."
                            aria-label="Search security vendors"
                            className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-3 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                        />
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex flex-wrap gap-1.5 mb-3" role="tablist" aria-label="Filter vendors by verdict">
                    {FILTERS.map(f => {
                        const active = filter === f.id
                        return (
                            <button
                                key={f.id}
                                role="tab"
                                aria-selected={active}
                                onClick={() => setFilter(f.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                                    active ? 'bg-accent text-white' : 'bg-surface-2 text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                {f.label}
                                <span className={`tabular-nums ${active ? 'text-white/80' : 'text-text-tertiary'}`}>{f.count}</span>
                            </button>
                        )
                    })}
                </div>

                {filtered.length === 0 ? (
                    <p className="text-[12.5px] text-text-tertiary py-6 text-center">No vendors match this filter.</p>
                ) : (
                    <ul className="divide-y divide-border">
                        {filtered.map((v, i) => {
                            const meta = CATEGORY_META[v.category]
                            const Icon = meta.icon
                            return (
                                <li key={`${v.engine}-${i}`} className="flex items-center gap-3 py-2.5">
                                    <Icon className={`w-4 h-4 shrink-0 ${meta.text}`} aria-hidden="true" />
                                    <span className="text-[13px] text-text-primary font-medium flex-1 min-w-0 truncate">{v.engine}</span>
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize shrink-0 ${meta.chip}`}>
                                        {v.category === 'clean' ? 'Clean' : v.result}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>

            {scannedAtUtc && (
                <p className="text-[11px] text-text-tertiary text-center">
                    Vendor data from VirusTotal · {new Date(scannedAtUtc).toLocaleString()}
                </p>
            )}
        </div>
    )
}
