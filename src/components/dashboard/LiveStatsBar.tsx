import { motion } from 'framer-motion'
import { Scan, ShieldCheck, ShieldX, Activity } from 'lucide-react'

interface StatItem {
    label: string
    value: number
    icon: typeof Scan
    color: string
    glow: string
    border: string
    shadow: string
    animateIcon?: boolean
}

interface Props {
    scansToday: number
    threatsBlocked: number
    safeOpens: number
    activeMonitors: number
}

export function LiveStatsBar({ scansToday, threatsBlocked, safeOpens, activeMonitors }: Props) {
    const stats: StatItem[] = [
        { label: 'Scans Today', value: scansToday, icon: Scan, color: 'text-cyan', border: 'border-t-cyan border-cyan/20', shadow: '0 0 20px rgba(0,255,255,0.6)', glow: 'bg-[rgba(0,255,255,0.15)] drop-shadow-[0_0_8px_#00FFFF]' },
        { label: 'Threats Blocked', value: threatsBlocked, icon: ShieldX, color: 'text-bright-red', border: 'border-t-bright-red border-bright-red/20', shadow: '0 0 20px rgba(255,23,68,0.6)', glow: 'bg-[rgba(255,23,68,0.15)] drop-shadow-[0_0_8px_#FF1744]' },
        { label: 'Safe Opens', value: safeOpens, icon: ShieldCheck, color: 'text-bright-green', border: 'border-t-bright-green border-bright-green/20', shadow: '0 0 20px rgba(0,255,127,0.6)', glow: 'bg-[rgba(0,255,127,0.15)] drop-shadow-[0_0_8px_#00FF7F]' },
        { label: 'Active Monitors', value: activeMonitors, icon: Activity, color: 'text-bright-yellow', border: 'border-t-bright-yellow border-bright-yellow/20', shadow: '0 0 20px rgba(255,224,0,0.6)', glow: 'bg-[rgba(255,224,0,0.15)] drop-shadow-[0_0_8px_#FFE000]', animateIcon: true },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    className={`p-4 rounded-[12px] border-x border-b border-t-[3px] ${stat.border}
                                bg-[linear-gradient(135deg,rgba(17,24,39,0.95)_0%,rgba(13,17,23,0.90)_100%)]
                                backdrop-blur-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.4)]`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${stat.glow} flex items-center justify-center`}>
                            <stat.icon className={`w-6 h-6 ${stat.color} ${stat.animateIcon ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                            <p className={`text-[32px] font-orbitron font-black leading-none ${stat.color}`} style={{ textShadow: stat.shadow }}>
                                {stat.value}
                            </p>
                            <p className="text-[12px] text-[#B0BEC5] font-sans mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
