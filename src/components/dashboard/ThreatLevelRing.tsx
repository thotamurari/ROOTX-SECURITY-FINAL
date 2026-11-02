import { motion } from 'framer-motion'
import { useRiskScore } from '@/hooks/useRiskScore'

interface Props {
    score: number
    /** Maximum rendered diameter in px. The ring shrinks below this on
     *  narrow viewports rather than overflowing its container. */
    size?: number
}

export function ThreatLevelRing({ score, size = 200 }: Props) {
    const risk = useRiskScore(score)
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    return (
        <div
            className="relative w-full aspect-square flex items-center justify-center mx-auto"
            style={{ maxWidth: size }}
        >
            {/* Background ring */}
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${size} ${size}`}
                aria-hidden="true"
                focusable="false"
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--bg-surface-3)"
                    strokeWidth={strokeWidth}
                />
            </svg>

            {/* Animated progress ring */}
            <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox={`0 0 ${size} ${size}`}
                aria-hidden="true"
                focusable="false"
            >
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
                    transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ filter: `drop-shadow(0 0 12px ${risk.color}33)` }}
                />
            </svg>

            {/* Soft live halo — kept subtle; this is a real-time threat readout */}
            <motion.div
                className="absolute rounded-full pointer-events-none"
                aria-hidden="true"
                style={{
                    width: '80%',
                    height: '80%',
                    background: `radial-gradient(circle, ${risk.color}10 0%, transparent 70%)`,
                }}
                animate={{ opacity: [0.3, 0.55, 0.3], scale: [0.92, 1.06, 0.92] }}
                transition={{ duration: 4, repeat: Infinity }}
            />

            {/* Score text */}
            <div className="relative text-center px-2">
                <motion.div
                    className="flex flex-col items-center justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <span className="text-[44px] sm:text-[56px] font-bold leading-none tracking-tighter text-text-primary tabular-nums">
                        {score}
                    </span>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ backgroundColor: risk.color }}
                            aria-hidden="true"
                        />
                        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
                            {risk.label}
                        </p>
                    </div>
                </motion.div>
            </div>

            <span className="sr-only">Threat level {risk.label}, score {score} out of 100</span>
        </div>
    )
}
