import { motion } from 'framer-motion'
import { Smartphone, Loader2 } from 'lucide-react'

interface Props {
    progress: number
    currentApp: string
    current: number
    total: number
    isComplete: boolean
}

export function ApkProgressBar({ progress, currentApp, current, total, isComplete }: Props) {
    return (
        <div className="space-y-3">
            {/* Progress bar */}
            <div className="relative w-full h-4 rounded-full bg-[rgba(0,0,0,0.4)] overflow-hidden border border-[rgba(0,255,255,0.15)]">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                        background: isComplete
                            ? 'linear-gradient(90deg, #00FF7F, #00E676)'
                            : 'linear-gradient(90deg, #00FFFF, #2979FF)',
                        boxShadow: isComplete
                            ? '0 0 20px #00FF7F'
                            : '0 0 20px #00FFFF',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-orbitron font-bold text-white drop-shadow-md">
                    {progress}%
                </span>
            </div>

            {/* Status text */}
            {!isComplete && currentApp && (
                <div className="flex items-center gap-2 text-[13px] font-mono text-[#B0BEC5]">
                    <Loader2 className="w-4 h-4 text-[#00FFFF] animate-spin" />
                    <span>Scanning: <span className="text-white font-bold">{currentApp}</span></span>
                    <span className="ml-auto text-[#607D8B]">({current}/{total} apps)</span>
                </div>
            )}

            {isComplete && (
                <div className="flex items-center gap-2 text-[13px] font-mono text-[#00FF7F]">
                    <Smartphone className="w-4 h-4" />
                    <span>Scan complete — {total} apps analyzed</span>
                </div>
            )}
        </div>
    )
}
