import { motion } from 'framer-motion'
import { useRiskScore } from '@/hooks/useRiskScore'

interface Props {
    score: number
    size?: number
}

export function ThreatLevelRing({ score, size = 200 }: Props) {
    const risk = useRiskScore(score)
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* Background ring */}
            <svg className="absolute" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#1A2236"
                    strokeWidth={strokeWidth}
                />
            </svg>

            {/* Animated progress ring */}
            <svg className="absolute -rotate-90" width={size} height={size}>
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={risk.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ filter: `drop-shadow(0 0 16px ${risk.color})` }}
                />
            </svg>

            {/* Glow pulse */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: size - 30,
                    height: size - 30,
                    background: `radial-gradient(circle, ${risk.color}08 0%, transparent 70%)`,
                }}
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 3, repeat: Infinity }}
            />

            {/* Score text */}
            <div className="relative text-center">
                <motion.p
                    className="text-[56px] font-orbitron font-black leading-none"
                    style={{
                        color: risk.color,
                        textShadow: `0 0 20px ${risk.color}CC, 0 0 40px ${risk.color}66, 0 0 80px ${risk.color}33`,
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    {score}
                </motion.p>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full animate-blink" style={{ backgroundColor: risk.color, boxShadow: `0 0 8px ${risk.color}` }} />
                    <p className="font-mono text-[14px] font-bold uppercase tracking-[4px]" style={{ color: risk.color, textShadow: `0 0 10px ${risk.color}99` }}>
                        {risk.label}
                    </p>
                </div>
            </div>
        </div>
    )
}
