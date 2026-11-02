import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

interface Props {
    progress: number
    stage: string
}

const SIZE = 176
const RADIUS = 58
const CENTER = SIZE / 2

export function ScanProgressVisualizer({ progress, stage }: Props) {
    const isComplete = progress >= 100
    const circumference = 2 * Math.PI * RADIUS
    const strokeColor = isComplete ? 'var(--success)' : 'var(--accent)'
    const label = stage || 'Initializing scan...'

    return (
        <div className="flex flex-col items-center justify-center py-4">
            {/* Progress ring */}
            <div
                className="relative mb-7"
                style={{ width: SIZE, height: SIZE }}
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${Math.round(progress)}% — ${label}`}
                aria-label="Scan progress"
            >
                {/* Soft breathing halo while the scan is active */}
                {!isComplete && (
                    <motion.div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-accent-soft"
                        animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.94, 1.04, 0.94] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                )}

                {/* Slow conic sweep — the "engine is working" cue */}
                {!isComplete && (
                    <motion.div
                        aria-hidden="true"
                        className="absolute inset-2 rounded-full opacity-60"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                        style={{
                            background:
                                'conic-gradient(from 0deg, var(--accent-soft-strong) 0deg, transparent 80deg, transparent 360deg)',
                        }}
                    />
                )}

                {/* Ring */}
                <svg
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                >
                    <circle
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        fill="none"
                        stroke="var(--border-default)"
                        strokeWidth="6"
                    />
                    <motion.circle
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={false}
                        animate={{
                            strokeDashoffset: circumference - (circumference * progress) / 100,
                        }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </svg>

                {/* Center readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        {isComplete ? (
                            <motion.div
                                key="complete"
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                                className="flex flex-col items-center"
                            >
                                <span className="w-12 h-12 rounded-2xl bg-success-soft text-success flex items-center justify-center mb-2">
                                    <ShieldCheck className="w-6 h-6" aria-hidden="true" />
                                </span>
                                <span className="text-[12px] font-semibold text-success tracking-wide">
                                    Complete
                                </span>
                            </motion.div>
                        ) : (
                            <motion.div key="progress" className="flex flex-col items-center">
                                <motion.span
                                    key={progress}
                                    initial={{ scale: 1.12, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.25 }}
                                    className="text-[34px] leading-none font-bold text-text-primary tabular-nums tracking-tight"
                                >
                                    {progress}%
                                </motion.span>
                                <span className="text-[11.5px] font-medium text-text-tertiary mt-1.5 tracking-wide">
                                    Scanning
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Linear progress + stage */}
            <div className="w-full max-w-sm">
                <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full ${isComplete ? 'bg-success' : 'bg-accent'}`}
                        initial={false}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                </div>

                <motion.p
                    key={stage}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    aria-live="polite"
                    className="text-[12.5px] text-text-secondary mt-3 text-center"
                >
                    {label}
                </motion.p>
            </div>

            {/* Subtle activity meter */}
            {!isComplete && (
                <div aria-hidden="true" className="flex items-end gap-1 mt-6 h-5">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.span
                            key={i}
                            className="w-1 rounded-full bg-accent/60"
                            animate={{ height: ['6px', '18px', '6px'] }}
                            transition={{
                                duration: 1.1,
                                delay: i * 0.12,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
