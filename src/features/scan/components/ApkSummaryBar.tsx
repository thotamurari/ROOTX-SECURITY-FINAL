import { motion } from 'framer-motion'
import { ShieldCheck, AlertTriangle, ShieldAlert, Layers } from 'lucide-react'
import type { RiskSummary } from '../types/apk.types'

interface Props {
    summary: RiskSummary
}

const cards = [
    { key: 'total' as const, label: 'Total', icon: Layers, color: '#00FFFF', glow: 'rgba(0,255,255,0.15)' },
    { key: 'safe' as const, label: 'Safe', icon: ShieldCheck, color: '#00FF7F', glow: 'rgba(0,255,127,0.15)' },
    { key: 'caution' as const, label: 'Caution', icon: AlertTriangle, color: '#FFE000', glow: 'rgba(255,224,0,0.15)' },
    { key: 'risky' as const, label: 'Risky', icon: ShieldAlert, color: '#FF1744', glow: 'rgba(255,23,68,0.15)' },
]

export function ApkSummaryBar({ summary }: Props) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cards.map((card, i) => {
                const value = card.key === 'risky'
                    ? summary.risky + summary.critical
                    : summary[card.key]

                return (
                    <motion.div
                        key={card.key}
                        className="rounded-[14px] p-4 flex flex-col items-center justify-center border text-center"
                        style={{
                            background: `linear-gradient(135deg, ${card.glow} 0%, rgba(8,11,20,0.9) 100%)`,
                            borderColor: `${card.color}33`,
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                    >
                        <card.icon className="w-5 h-5 mb-2" style={{ color: card.color, filter: `drop-shadow(0 0 6px ${card.color})` }} />
                        <motion.span
                            className="text-[28px] font-orbitron font-black leading-none"
                            style={{ color: card.color, textShadow: `0 0 15px ${card.color}` }}
                            key={value}
                            initial={{ scale: 1.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                        >
                            {value}
                        </motion.span>
                        <span className="text-[11px] font-mono text-[#B0BEC5] mt-1 uppercase tracking-[2px]">{card.label}</span>
                    </motion.div>
                )
            })}
        </div>
    )
}
