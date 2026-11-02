import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Globe, Shield, ShieldOff, X } from 'lucide-react'
import { useTrackerMap } from '@/hooks/useTrackerMap'
import { useRiskScore } from '@/hooks/useRiskScore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import type { TrackerConnection } from '@/types/api'

/**
 * useRiskScore still owns the score thresholds; this map only re-expresses
 * the tone it returns using design-system tokens so risk colors theme
 * correctly in light and dark mode.
 */
const TONE_BY_LABEL: Record<string, { color: string; soft: string; text: string }> = {
    SECURE: { color: 'var(--success)', soft: 'bg-success-soft', text: 'text-success' },
    ALERT: { color: 'var(--warning)', soft: 'bg-warning-soft', text: 'text-warning' },
    THREAT: { color: 'var(--warning)', soft: 'bg-warning-soft', text: 'text-warning' },
    CRITICAL: { color: 'var(--danger)', soft: 'bg-danger-soft', text: 'text-danger' },
}

/** Marker / arc color for a connection — never color-only, always paired with
 *  a text label in the list and the aria description of the map. */
function connectionStroke(conn: TrackerConnection): string {
    if (conn.isFlagged) return 'var(--danger)'
    if (conn.isBlocked) return 'var(--text-tertiary)'
    return 'var(--accent)'
}

function ConnectionItem({
    conn,
    onSelect,
    onBlock,
}: {
    conn: TrackerConnection
    onSelect: (c: TrackerConnection) => void
    onBlock: (id: string, blocked: boolean) => void
}) {
    const risk = useRiskScore(conn.riskScore)
    const RiskIcon = risk.icon
    const tone = TONE_BY_LABEL[risk.label] ?? TONE_BY_LABEL.SECURE!

    return (
        <motion.li
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(conn)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(conn)
                    }
                }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors duration-150 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
                <span
                    className={`w-10 h-10 rounded-xl ${tone.soft} flex items-center justify-center shrink-0`}
                    aria-hidden="true"
                >
                    <RiskIcon className="w-5 h-5" style={{ color: tone.color }} />
                </span>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <p className="text-[13.5px] font-medium text-text-primary truncate">{conn.appName}</p>
                        <span
                            className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded ${tone.soft} ${tone.text}`}
                        >
                            {risk.label}
                        </span>
                    </div>
                    <p className="text-[11.5px] text-text-tertiary truncate mt-0.5">
                        {conn.destinationIp} → {conn.country}
                    </p>
                </div>

                <Button
                    variant={conn.isBlocked ? 'danger' : 'ghost'}
                    size="icon"
                    className="shrink-0"
                    aria-label={conn.isBlocked ? `Unblock ${conn.appName}` : `Block ${conn.appName}`}
                    title={conn.isBlocked ? 'Unblock' : 'Block'}
                    onClick={(e) => {
                        e.stopPropagation()
                        onBlock(conn.id, !conn.isBlocked)
                    }}
                >
                    {conn.isBlocked ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                </Button>
            </div>
        </motion.li>
    )
}

function ConnectionDetailModal({
    conn,
    onClose,
    onBlock,
}: {
    conn: TrackerConnection
    onClose: () => void
    onBlock: (id: string, blocked: boolean) => void
}) {
    const risk = useRiskScore(conn.riskScore)
    const tone = TONE_BY_LABEL[risk.label] ?? TONE_BY_LABEL.SECURE!

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Connection details for ${conn.appName}`}
        >
            <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
            <motion.div
                className="relative bg-surface-1 border border-border rounded-2xl shadow-lg p-5 sm:p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
                initial={{ scale: 0.96, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close connection details"
                    className="absolute top-3 right-3"
                >
                    <X className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-3 mb-5 pr-12 min-w-0">
                    <h3 className="text-[17px] font-semibold text-text-primary tracking-tight truncate">
                        {conn.appName}
                    </h3>
                    <span
                        className={`shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.08em] px-2 py-1 rounded-md ${tone.soft} ${tone.text}`}
                    >
                        {risk.label}
                    </span>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {[
                        { label: 'Destination IP', value: conn.destinationIp },
                        { label: 'Country', value: `${conn.country} (${conn.countryCode})` },
                        { label: 'Data Type', value: conn.dataType },
                        { label: 'Risk Score', value: `${conn.riskScore}/100` },
                        { label: 'Coordinates', value: `${conn.latitude.toFixed(2)}, ${conn.longitude.toFixed(2)}` },
                        { label: 'Connected At', value: new Date(conn.connectedAt).toLocaleString() },
                    ].map((item) => (
                        <div key={item.label} className="p-3 rounded-xl bg-surface-2 border border-border min-w-0">
                            <dt className="text-[10px] text-text-tertiary uppercase tracking-wide">{item.label}</dt>
                            <dd className="text-[13px] text-text-primary mt-1 break-words">{item.value}</dd>
                        </div>
                    ))}
                </dl>

                <div className="flex gap-3">
                    <Button
                        variant={conn.isBlocked ? 'secondary' : 'danger'}
                        size="lg"
                        fullWidth
                        onClick={() => onBlock(conn.id, !conn.isBlocked)}
                        leftIcon={conn.isBlocked ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    >
                        {conn.isBlocked ? 'Unblock Connection' : 'Block Connection'}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default function TrackerMap() {
    const { connections, isLoading, toggleBlock } = useTrackerMap()
    const [selected, setSelected] = useState<TrackerConnection | null>(null)

    if (isLoading) {
        return <LoadingSpinner size="lg" text="Loading connections..." />
    }

    const flaggedCount = connections.filter((c) => c.isFlagged).length
    const blockedCount = connections.filter((c) => c.isBlocked).length

    return (
        <div className="space-y-5 sm:space-y-6 pb-24 lg:pb-8">
            <PageHeader
                title="Tracker Map"
                description="Monitor and control outgoing data connections"
                icon={<Map className="w-5 h-5" />}
            />

            {/* Map area */}
            <Card padding="sm" className="overflow-hidden">
                <div className="relative w-full aspect-[2/1] max-h-[420px] rounded-xl bg-surface-2 border border-border overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-60" aria-hidden="true" />

                    {/* viewBox-driven so the map scales to the container on every
                        breakpoint rather than forcing horizontal scrolling. */}
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 800 400"
                        preserveAspectRatio="xMidYMid meet"
                        role="img"
                        aria-label={`World map of ${connections.length} outgoing connections. ${flaggedCount} flagged, ${blockedCount} blocked. A text list of every connection follows below.`}
                    >
                        {/* Simplified world shapes */}
                        <ellipse cx="200" cy="160" rx="80" ry="55" fill="none" stroke="var(--border-default)" strokeWidth="0.8" />
                        <ellipse cx="420" cy="150" rx="100" ry="75" fill="none" stroke="var(--border-default)" strokeWidth="0.8" />
                        <ellipse cx="650" cy="180" rx="80" ry="60" fill="none" stroke="var(--border-default)" strokeWidth="0.8" />
                        <ellipse cx="420" cy="280" rx="50" ry="35" fill="none" stroke="var(--border-default)" strokeWidth="0.8" />
                        <ellipse cx="600" cy="320" rx="60" ry="40" fill="none" stroke="var(--border-default)" strokeWidth="0.8" />

                        {/* Connection arcs */}
                        {connections.map((conn, i) => {
                            const x = ((conn.longitude + 180) / 360) * 800
                            const y = ((90 - conn.latitude) / 180) * 400
                            const startX = 400
                            const startY = 200
                            const midY = Math.min(y, startY) - 50
                            const stroke = connectionStroke(conn)

                            return (
                                <g key={conn.id}>
                                    {/* Arc */}
                                    <motion.path
                                        d={`M ${startX} ${startY} Q ${(startX + x) / 2} ${midY} ${x} ${y}`}
                                        fill="none"
                                        stroke={stroke}
                                        strokeWidth="1"
                                        strokeDasharray="4 2"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 0.45 }}
                                        transition={{ delay: i * 0.06, duration: 0.8 }}
                                    />
                                    {/* Halo */}
                                    <circle cx={x} cy={y} r="8" fill={stroke} opacity={0.12} />
                                    {/* Dot */}
                                    <motion.circle
                                        cx={x}
                                        cy={y}
                                        r="4"
                                        fill={stroke}
                                        initial={{ r: 0 }}
                                        animate={{ r: [3, 5, 3] }}
                                        transition={{ delay: i * 0.06 + 0.4, duration: 2, repeat: Infinity }}
                                    />
                                </g>
                            )
                        })}

                        {/* Origin dot */}
                        <circle cx="400" cy="200" r="12" fill="var(--success)" opacity={0.15} />
                        <circle cx="400" cy="200" r="6" fill="var(--success)" />
                    </svg>

                    {/* Legend */}
                    <ul className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-surface-1/85 backdrop-blur-sm border border-border px-2.5 py-1.5">
                        <li className="flex items-center gap-1.5 text-[10.5px] text-text-secondary">
                            <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />You
                        </li>
                        <li className="flex items-center gap-1.5 text-[10.5px] text-text-secondary">
                            <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true" />Normal
                        </li>
                        <li className="flex items-center gap-1.5 text-[10.5px] text-text-secondary">
                            <span className="w-2 h-2 rounded-full bg-danger" aria-hidden="true" />Flagged
                        </li>
                        <li className="flex items-center gap-1.5 text-[10.5px] text-text-secondary">
                            <span className="w-2 h-2 rounded-full bg-text-tertiary" aria-hidden="true" />Blocked
                        </li>
                    </ul>
                </div>
            </Card>

            {/* Connections panel */}
            <Card padding="sm">
                <CardHeader className="mb-2">
                    <div className="min-w-0">
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                            Active Connections
                        </CardTitle>
                        <CardDescription>
                            {connections.length} total · {flaggedCount} flagged · {blockedCount} blocked
                        </CardDescription>
                    </div>
                </CardHeader>

                {connections.length === 0 ? (
                    <EmptyState
                        icon={Globe}
                        title="No active connections"
                        message="Outgoing data connections will appear here as apps reach the network."
                    />
                ) : (
                    <ul className="space-y-1 max-h-[420px] overflow-y-auto -mx-1 px-1">
                        {connections.map((conn) => (
                            <ConnectionItem
                                key={conn.id}
                                conn={conn}
                                onSelect={setSelected}
                                onBlock={(id, blocked) => toggleBlock({ connectionId: id, blocked })}
                            />
                        ))}
                    </ul>
                )}
            </Card>

            <AnimatePresence>
                {selected && (
                    <ConnectionDetailModal
                        conn={selected}
                        onClose={() => setSelected(null)}
                        onBlock={(id, blocked) => {
                            toggleBlock({ connectionId: id, blocked })
                            setSelected(null)
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
