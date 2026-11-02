import { motion } from 'framer-motion'
import logoImg from '@/assets/logo.png'

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    glow?: boolean
    className?: string
}

export const Logo = ({ size = 'md', glow = true, className = '' }: LogoProps) => {
    const sizeMap = {
        sm: 'w-12 h-12 rounded-xl p-2',
        md: 'w-24 h-24 rounded-2xl p-4',
        lg: 'w-32 h-32 rounded-[2rem] p-6',
        xl: 'w-40 h-40 rounded-[2.5rem] p-8'
    }

    return (
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative flex-shrink-0 ${sizeMap[size]} ${className}`}
        >
            {/* Accent glow */}
            {glow && (
                <div className="absolute inset-0 bg-accent rounded-full blur-[40px] opacity-30 animate-pulse"></div>
            )}

            {/* Logo Container */}
            <div className="relative w-full h-full bg-gradient-to-br from-surface-2 to-surface-1 rounded-[inherit] overflow-hidden border border-border shadow-lg flex items-center justify-center">
                <img 
                    src={logoImg} 
                    alt="RootX Logo" 
                    className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                />
                
                {/* Overlay highlight */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none"></div>
            </div>
        </motion.div>
    )
}
