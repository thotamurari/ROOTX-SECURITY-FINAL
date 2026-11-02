import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Scan, ShieldX, ShieldCheck, Activity } from 'lucide-react'
import { Card } from '@/components/shared/Card'

interface StatItem {
    label: string
    value: number
    icon: typeof Scan
    /** Tailwind classes derived from the semantic token set */
    iconClass: string
    valueClass: string
}

interface Props {
    scansToday: number
    threatsBlocked: number
    safeOpens: number
    activeMonitors: number
}

function AnimatedCounter({ value, className = '' }: { value: number; className?: string }) {
    const [display, setDisplay] = useState(0)

    useEffect(() => {
        if (value === 0) { setDisplay(0); return }
        const duration = 1500
        const step = value / (duration / 16)
        let current = 0
        const timer = setInterval(() => {
            current = Math.min(current + step, value)
            setDisplay(Math.floor(current))
            if (current >= value) clearInterval(timer)
        }, 16)
        return () => clearInterval(timer)
    }, [value])

    return (
        <span className={`text-[26px] lg:text-[30px] font-bold leading-none tracking-tight tabular-nums ${className}`}>
            {display}
        </span>
    )
}

export function LiveStatsBar({ scansToday, threatsBlocked, safeOpens, activeMonitors }: Props) {
    const stats: StatItem[] = [
        { label: 'Scans Today', value: scansToday, icon: Scan, iconClass: 'bg-accent-soft text-accent', valueClass: 'text-text-primary' },
        { label: 'Threats Blocked', value: threatsBlocked, icon: ShieldX, iconClass: 'bg-danger-soft text-danger', valueClass: 'text-danger' },
        { label: 'Safe Opens', value: safeOpens, icon: ShieldCheck, iconClass: 'bg-success-soft text-success', valueClass: 'text-text-primary' },
        { label: 'Active Monitors', value: activeMonitors, icon: Activity, iconClass: 'bg-warning-soft text-warning', valueClass: 'text-text-primary' },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.25, ease: 'easeOut' }}
                >
                    <Card padding="sm" className="h-full">
                        <div className="flex items-center gap-3">
                            <span
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.iconClass}`}
                                aria-hidden="true"
                            >
                                <stat.icon className="w-5 h-5" />
                            </span>
                            <div className="min-w-0">
                                <AnimatedCounter value={stat.value} className={stat.valueClass} />
                                <p className="text-[11.5px] text-text-secondary mt-1 truncate">{stat.label}</p>
                            </div>
                        </div>

                        {/* LIVE pulse for Active Monitors */}
                        {stat.label === 'Active Monitors' && (
                            <div className="flex items-center gap-1.5 mt-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
                                <span className="text-[10px] font-semibold text-success uppercase tracking-[0.14em]">Live</span>
                            </div>
                        )}

                        {/* Threat pressure indicator */}
                        {stat.label === 'Threats Blocked' && stat.value > 0 && (
                            <div className="mt-3 h-1 rounded-full bg-danger-soft overflow-hidden" aria-hidden="true">
                                <motion.div
                                    className="h-full bg-danger rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: '60%' }}
                                    transition={{ delay: 0.8, duration: 0.8 }}
                                />
                            </div>
                        )}
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
