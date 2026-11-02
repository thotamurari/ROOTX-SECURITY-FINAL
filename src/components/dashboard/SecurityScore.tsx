import { motion } from 'framer-motion'

type Tone = {
    /** Ring stroke color (semantic token) */
    stroke: string
    /** Soft variant of the same token, used for the subtle halo */
    glow: string
    label: string
}

/**
 * Score → semantic tone. Uses the design-system CSS variables so the ring
 * re-colors correctly in both light and dark themes instead of being pinned
 * to hardcoded hex values.
 */
function getTone(s: number): Tone {
    if (s >= 90) return { stroke: 'var(--success)', glow: 'var(--success-soft)', label: 'Excellent' }
    if (s >= 70) return { stroke: 'var(--accent)', glow: 'var(--accent-soft)', label: 'Good' }
    if (s >= 40) return { stroke: 'var(--warning)', glow: 'var(--warning-soft)', label: 'Fair' }
    return { stroke: 'var(--danger)', glow: 'var(--danger-soft)', label: 'At risk' }
}

const RADIUS = 58
const CIRCUMFERENCE = 2 * Math.PI * RADIUS // ~364.4

export function SecurityScore({ score = 92 }: { score?: number }) {
    const tone = getTone(score)

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                {/* Responsive ring: viewBox-driven so it scales with the container
                    on narrow viewports instead of relying on fixed pixel sizes. */}
                <svg
                    viewBox="0 0 128 128"
                    className="w-full h-auto -rotate-90"
                    aria-hidden="true"
                    focusable="false"
                >
                    <circle
                        cx="64"
                        cy="64"
                        r={RADIUS}
                        stroke="var(--bg-surface-3)"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    <motion.circle
                        cx="64"
                        cy="64"
                        r={RADIUS}
                        stroke={tone.stroke}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={CIRCUMFERENCE}
                        initial={{ strokeDashoffset: CIRCUMFERENCE }}
                        animate={{ strokeDashoffset: CIRCUMFERENCE - (CIRCUMFERENCE * score) / 100 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 10px ${tone.glow})` }}
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="text-[30px] sm:text-[34px] font-bold tracking-tight text-text-primary tabular-nums leading-none"
                    >
                        {score}
                    </motion.span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-tertiary mt-1">
                        Score
                    </span>
                </div>
            </div>

            {/* Available to assistive tech as plain text, not only as a graphic */}
            <span className="sr-only">Security score {score} out of 100 — {tone.label}</span>
        </div>
    )
}
