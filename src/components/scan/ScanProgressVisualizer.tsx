import { motion } from 'framer-motion'

interface Props {
    progress: number
    stage: string
}

export function ScanProgressVisualizer({ progress, stage }: Props) {
    return (
        <div className="glass-card p-8 flex flex-col items-center justify-center">
            {/* Radar sweep */}
            <div className="relative w-48 h-48 mb-6">
                {/* Outer rings */}
                {[1, 2, 3].map((ring) => (
                    <motion.div
                        key={ring}
                        className="absolute rounded-full border border-dashed border-[rgba(0,255,255,0.3)]"
                        style={{
                            inset: `${ring * 16}px`,
                        }}
                        animate={{ rotate: ring % 2 === 0 ? 360 : -360 }}
                        transition={{ duration: 10 * ring, repeat: Infinity, ease: 'linear' }}
                    />
                ))}

                {/* Sweep arm */}
                <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                    <div
                        className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left"
                        style={{
                            background: 'linear-gradient(90deg, #00F5FF, transparent)',
                        }}
                    />
                </motion.div>

                {/* Sweep trail */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{
                        background: `conic-gradient(from 0deg, rgba(0,255,255,0.2) 0deg, transparent 60deg, transparent 360deg)`,
                    }}
                />

                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.p
                        className="text-[32px] font-orbitron font-bold text-cyan"
                        style={{ textShadow: '0 0 20px #00FFFF, 0 0 40px rgba(0,255,255,0.5)' }}
                        key={progress}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        {progress}%
                    </motion.p>
                </div>

                {/* Random blips */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full bg-cyan"
                        style={{
                            top: `${20 + Math.random() * 60}%`,
                            left: `${20 + Math.random() * 60}%`,
                        }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            delay: i * 0.4,
                            repeat: Infinity,
                        }}
                    />
                ))}
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs mt-6">
                <div className="h-2 bg-[#080B14] rounded-full overflow-hidden border border-cyan/20">
                    <motion.div
                        className="h-full bg-[linear-gradient(90deg,#00FFFF_0%,#00BFFF_100%)] rounded-full shadow-[0_0_10px_#00FFFF]"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <p className="text-[12px] text-[#B0BEC5] font-mono mt-3 tracking-wide text-center uppercase">{stage || 'Initializing scan...'}</p>
            </div>
        </div>
    )
}
