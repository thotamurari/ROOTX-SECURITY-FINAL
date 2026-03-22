import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Scan, ShieldX, ShieldCheck, Activity } from 'lucide-react'

interface StatItem {
    label: string
    value: number
    icon: typeof Scan
    color: string
    glowBg: string
}

interface Props {
    scansToday: number
    threatsBlocked: number
    safeOpens: number
    activeMonitors: number
}

function AnimatedCounter({ value, color }: { value: number; color: string }) {
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
        <span
            className="text-[28px] lg:text-[32px] font-orbitron font-black leading-none"
            style={{ color, textShadow: `0 0 20px ${color}88` }}
        >
            {display}
        </span>
    )
}

export function LiveStatsBar({ scansToday, threatsBlocked, safeOpens, activeMonitors }: Props) {
    const stats: StatItem[] = [
        { label: 'Scans Today', value: scansToday, icon: Scan, color: '#00F5FF', glowBg: 'rgba(0,245,255,0.08)' },
        { label: 'Threats Blocked', value: threatsBlocked, icon: ShieldX, color: '#FF3366', glowBg: 'rgba(255,51,102,0.08)' },
        { label: 'Safe Opens', value: safeOpens, icon: ShieldCheck, color: '#00FF88', glowBg: 'rgba(0,255,136,0.08)' },
        { label: 'Active Monitors', value: activeMonitors, icon: Activity, color: '#FF8C00', glowBg: 'rgba(255,140,0,0.08)' },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    className="glass-card p-4 sm:p-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                            style={{ background: stat.glowBg }}
                        >
                            <stat.icon
                                className="w-5 h-5"
                                style={{ color: stat.color, filter: `drop-shadow(0 0 6px ${stat.color})` }}
                            />
                        </div>
                        <div>
                            <AnimatedCounter value={stat.value} color={stat.color} />
                            <p className="text-[11px] text-[#8888AA] font-sans mt-0.5">{stat.label}</p>
                        </div>
                    </div>

                    {/* LIVE pulse for Active Monitors */}
                    {stat.label === 'Active Monitors' && (
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-[live-pulse_1.5s_ease-in-out_infinite]" />
                            <span className="text-[10px] font-mono font-semibold text-[#00FF88] uppercase tracking-wider">LIVE</span>
                        </div>
                    )}

                    {/* Subtle red glow if threats > 0 */}
                    {stat.label === 'Threats Blocked' && stat.value > 0 && (
                        <div className="mt-2">
                            <div className="h-1 rounded-full bg-[rgba(255,51,102,0.3)] overflow-hidden">
                                <motion.div
                                    className="h-full bg-[#FF3366] rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: '60%' }}
                                    transition={{ delay: 1, duration: 0.8 }}
                                />
                            </div>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    )
}
