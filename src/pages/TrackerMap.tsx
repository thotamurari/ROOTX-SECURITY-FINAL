import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Globe, Shield, ShieldOff, X, ExternalLink } from 'lucide-react'
import { useTrackerMap } from '@/hooks/useTrackerMap'
import { useRiskScore } from '@/hooks/useRiskScore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { TrackerConnection } from '@/types/api'

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

    return (
        <motion.div
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface/50 transition-colors cursor-pointer"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onSelect(conn)}
        >
            <div className={`w-10 h-10 rounded-lg ${risk.bgClass} flex items-center justify-center flex-shrink-0`}>
                <RiskIcon className="w-5 h-5" style={{ color: risk.color }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-ui text-text-primary truncate">{conn.appName}</p>
                <p className="text-[11px] font-body text-text-muted truncate">
                    {conn.destinationIp} → {conn.country}
                </p>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onBlock(conn.id, !conn.isBlocked)
                }}
                className={`p-2 rounded-lg transition-colors ${conn.isBlocked
                        ? 'bg-neon-red/10 text-neon-red hover:bg-neon-red/20'
                        : 'bg-surface text-text-muted hover:text-text-primary'
                    }`}
                title={conn.isBlocked ? 'Unblock' : 'Block'}
            >
                {conn.isBlocked ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            </button>
        </motion.div>
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

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                className="relative glass-card p-6 max-w-lg w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-display font-bold text-text-primary mb-4">{conn.appName}</h3>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                        { label: 'Destination IP', value: conn.destinationIp },
                        { label: 'Country', value: `${conn.country} (${conn.countryCode})` },
                        { label: 'Data Type', value: conn.dataType },
                        { label: 'Risk Score', value: `${conn.riskScore}/100` },
                        { label: 'Coordinates', value: `${conn.latitude.toFixed(2)}, ${conn.longitude.toFixed(2)}` },
                        { label: 'Connected At', value: new Date(conn.connectedAt).toLocaleString() },
                    ].map((item) => (
                        <div key={item.label} className="p-3 rounded-xl bg-surface border border-border">
                            <p className="text-[10px] text-text-muted font-body uppercase">{item.label}</p>
                            <p className="text-sm font-body text-text-primary mt-0.5">{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => onBlock(conn.id, !conn.isBlocked)}
                        className={conn.isBlocked ? 'btn-ghost flex-1' : 'btn-danger flex-1'}
                    >
                        {conn.isBlocked ? 'Unblock Connection' : 'Block Connection'}
                    </button>
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

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-3">
                    <Map className="w-7 h-7 text-cyan" />
                    Tracker Map
                </h1>
                <p className="text-sm text-text-secondary font-body mt-1">
                    Monitor and control outgoing data connections
                </p>
            </motion.div>

            {/* Map area */}
            <div className="glass-card p-4 relative overflow-hidden">
                <div className="relative h-[300px] lg:h-[400px] rounded-xl bg-surface/50 border border-border overflow-hidden">
                    <div className="absolute inset-0 bg-grid opacity-50" />
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
                        {/* Simplified world shapes */}
                        <ellipse cx="200" cy="160" rx="80" ry="55" fill="none" stroke="#1E1E30" strokeWidth="0.8" />
                        <ellipse cx="420" cy="150" rx="100" ry="75" fill="none" stroke="#1E1E30" strokeWidth="0.8" />
                        <ellipse cx="650" cy="180" rx="80" ry="60" fill="none" stroke="#1E1E30" strokeWidth="0.8" />
                        <ellipse cx="420" cy="280" rx="50" ry="35" fill="none" stroke="#1E1E30" strokeWidth="0.8" />
                        <ellipse cx="600" cy="320" rx="60" ry="40" fill="none" stroke="#1E1E30" strokeWidth="0.8" />

                        {/* Connection arcs */}
                        {connections.map((conn, i) => {
                            const x = ((conn.longitude + 180) / 360) * 800
                            const y = ((90 - conn.latitude) / 180) * 400
                            const startX = 400
                            const startY = 200
                            const midY = Math.min(y, startY) - 50

                            return (
                                <g key={conn.id}>
                                    {/* Arc */}
                                    <motion.path
                                        d={`M ${startX} ${startY} Q ${(startX + x) / 2} ${midY} ${x} ${y}`}
                                        fill="none"
                                        stroke={conn.isFlagged ? '#FF3366' : conn.isBlocked ? '#44445A' : '#00F5FF'}
                                        strokeWidth="1"
                                        strokeDasharray="4 2"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 0.4 }}
                                        transition={{ delay: i * 0.1, duration: 1 }}
                                    />
                                    {/* Dot */}
                                    <motion.circle
                                        cx={x}
                                        cy={y}
                                        r="4"
                                        fill={conn.isFlagged ? '#FF3366' : conn.isBlocked ? '#44445A' : '#00F5FF'}
                                        initial={{ r: 0 }}
                                        animate={{ r: [3, 5, 3] }}
                                        transition={{ delay: i * 0.1 + 0.5, duration: 2, repeat: Infinity }}
                                    />
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="8"
                                        fill={conn.isFlagged ? '#FF336615' : '#00F5FF15'}
                                    />
                                </g>
                            )
                        })}

                        {/* Origin dot */}
                        <circle cx="400" cy="200" r="6" fill="#00FF88" />
                        <circle cx="400" cy="200" r="12" fill="#00FF8815" />
                    </svg>

                    {/* Legend */}
                    <div className="absolute bottom-3 left-3 flex gap-4">
                        <span className="flex items-center gap-1 text-[10px] font-body text-text-muted">
                            <span className="w-2 h-2 rounded-full bg-neon-green" />You
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-body text-text-muted">
                            <span className="w-2 h-2 rounded-full bg-cyan" />Normal
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-body text-text-muted">
                            <span className="w-2 h-2 rounded-full bg-neon-red" />Flagged
                        </span>
                    </div>
                </div>
            </div>

            {/* Connections panel */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-ui font-semibold text-text-secondary flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan" />
                        Active Connections ({connections.length})
                    </h3>
                </div>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {connections.map((conn) => (
                        <ConnectionItem
                            key={conn.id}
                            conn={conn}
                            onSelect={setSelected}
                            onBlock={(id, blocked) => toggleBlock({ connectionId: id, blocked })}
                        />
                    ))}
                </div>
            </div>

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
