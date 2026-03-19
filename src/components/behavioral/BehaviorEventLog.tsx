import { motion } from 'framer-motion'
import type { BehaviorEvent } from '@/types/api'
import { EmptyState } from '@/components/shared/EmptyState'
import { FileText, AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react'

interface Props {
    events: BehaviorEvent[]
}

const severityConfig = {
    low: { icon: Info, color: 'text-neon-green', bg: 'bg-neon-green/10' },
    medium: { icon: AlertCircle, color: 'text-cyan', bg: 'bg-cyan/10' },
    high: { icon: AlertTriangle, color: 'text-neon-orange', bg: 'bg-neon-orange/10' },
    critical: { icon: XCircle, color: 'text-neon-red', bg: 'bg-neon-red/10' },
}

export function BehaviorEventLog({ events }: Props) {
    if (!events.length) {
        return <EmptyState icon={FileText} title="No events" message="Behavior events will appear here." />
    }

    return (
        <div className="glass-card p-4">
            <h3 className="text-sm font-ui font-semibold text-text-secondary mb-3">7-Day Event Log</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {events.map((event, i) => {
                    const config = severityConfig[event.riskLevel]
                    const Icon = config.icon
                    return (
                        <motion.div
                            key={event.id}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface/50 transition-colors"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-body text-text-primary">{event.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-text-muted font-body">{event.type}</span>
                                    <span className="text-[10px] text-text-muted font-body">
                                        {new Date(event.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
