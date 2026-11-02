import { motion } from 'framer-motion'
import type { BehaviorEvent } from '@/types/api'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/shared/Card'
import { FileText, AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react'

interface Props {
    events: BehaviorEvent[]
}

// Severity → semantic token pairing. Every row carries both a color *and* a
// text label + icon so risk is never communicated by color alone.
const severityConfig = {
    low: { icon: Info, label: 'Low', className: 'bg-success-soft text-success' },
    medium: { icon: AlertCircle, label: 'Medium', className: 'bg-info-soft text-info' },
    high: { icon: AlertTriangle, label: 'High', className: 'bg-warning-soft text-warning' },
    critical: { icon: XCircle, label: 'Critical', className: 'bg-danger-soft text-danger' },
}

export function BehaviorEventLog({ events }: Props) {
    if (!events.length) {
        return <EmptyState icon={FileText} title="No events" message="Behavior events will appear here." />
    }

    return (
        <Card padding="sm" className="w-full">
            <CardHeader className="mb-3">
                <div className="min-w-0">
                    <CardTitle>7-Day Event Log</CardTitle>
                    <CardDescription>{events.length} recorded behavior events</CardDescription>
                </div>
            </CardHeader>

            <ul className="space-y-1 max-h-[400px] overflow-y-auto -mx-1 px-1">
                {events.map((event, i) => {
                    const config = severityConfig[event.riskLevel]
                    const Icon = config.icon
                    return (
                        <motion.li
                            key={event.id}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors duration-150"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.2 }}
                        >
                            <span
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.className}`}
                                aria-hidden="true"
                            >
                                <Icon className="w-4 h-4" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13.5px] text-text-primary break-words">{event.description}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span
                                        className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${config.className}`}
                                    >
                                        {config.label}
                                    </span>
                                    <span className="text-[11px] text-text-tertiary truncate">{event.type}</span>
                                    <span className="text-[11px] text-text-tertiary tabular-nums">
                                        {new Date(event.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </motion.li>
                    )
                })}
            </ul>
        </Card>
    )
}
