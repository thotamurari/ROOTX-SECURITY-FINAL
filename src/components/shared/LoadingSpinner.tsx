import { motion } from 'framer-motion'

interface Props {
    size?: 'sm' | 'md' | 'lg'
    text?: string
}

export function LoadingSpinner({ size = 'md', text }: Props) {
    const sizeMap = { sm: 32, md: 48, lg: 64 }
    const s = sizeMap[size]

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="relative" style={{ width: s, height: s }}>
                {/* Outer ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-cyan/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
                {/* Inner sweep */}
                <motion.div
                    className="absolute inset-1 rounded-full border-2 border-transparent border-t-cyan"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
                {/* Center dot */}
                <motion.div
                    className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-cyan"
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </div>
            {text && (
                <motion.p
                    className="text-text-secondary text-sm font-body"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {text}
                </motion.p>
            )}
        </div>
    )
}
