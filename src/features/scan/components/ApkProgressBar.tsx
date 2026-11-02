import { motion } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface Props {
    progress: number
    currentApp: string
    current: number
    total: number
    isComplete: boolean
}

export function ApkProgressBar({ progress, currentApp, current, total, isComplete }: Props) {
    return (
        <div className="space-y-2.5">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <div
                    className="relative flex-1 h-2 rounded-full bg-surface-3 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={isComplete ? 'Scan complete' : `Scanning apps, ${current} of ${total}`}
                >
                    <motion.div
                        className={`absolute inset-y-0 left-0 rounded-full ${isComplete ? 'bg-success' : 'bg-accent'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
                <span className="text-[12.5px] font-semibold text-text-primary tabular-nums w-10 text-right shrink-0">
                    {progress}%
                </span>
            </div>

            {/* Status text */}
            {!isComplete && currentApp && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-text-secondary" aria-live="polite">
                    <Loader2 className="w-3.5 h-3.5 text-accent animate-spin shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate">
                        Scanning <span className="text-text-primary font-semibold">{currentApp}</span>
                    </span>
                    <span className="ml-auto text-text-tertiary tabular-nums whitespace-nowrap">
                        {current}/{total} apps
                    </span>
                </div>
            )}

            {isComplete && (
                <div className="flex items-center gap-2 text-[12.5px] text-success" aria-live="polite">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Scan complete — {total} apps analyzed</span>
                </div>
            )}
        </div>
    )
}
