import { motion } from 'framer-motion'
import { ShieldCheck, AlertTriangle, ShieldAlert, Layers } from 'lucide-react'
import type { RiskSummary } from '../types/apk.types'

interface Props {
    summary: RiskSummary
}

const cards = [
    { key: 'total' as const, label: 'Total', icon: Layers, tone: 'bg-accent-soft text-accent', value: 'text-text-primary' },
    { key: 'safe' as const, label: 'Safe', icon: ShieldCheck, tone: 'bg-success-soft text-success', value: 'text-success' },
    { key: 'caution' as const, label: 'Caution', icon: AlertTriangle, tone: 'bg-warning-soft text-warning', value: 'text-warning' },
    { key: 'risky' as const, label: 'Risky', icon: ShieldAlert, tone: 'bg-danger-soft text-danger', value: 'text-danger' },
]

export function ApkSummaryBar({ summary }: Props) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map((card, i) => {
                const value = card.key === 'risky'
                    ? summary.risky + summary.critical
                    : summary[card.key]

                return (
                    <motion.div
                        key={card.key}
                        className="bg-surface-1 border border-border rounded-2xl shadow-xs p-4 flex items-center gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.3 }}
                    >
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.tone}`}>
                            <card.icon className="w-5 h-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <motion.span
                                className={`block text-[24px] leading-none font-bold tabular-nums ${card.value}`}
                                key={value}
                                initial={{ scale: 1.15, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            >
                                {value}
                            </motion.span>
                            <span className="block text-[11.5px] font-medium text-text-tertiary uppercase tracking-wider mt-1 truncate">
                                {card.label}
                            </span>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
