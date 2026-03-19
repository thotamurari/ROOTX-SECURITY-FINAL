import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Link, FileUp, MessageSquare, X } from 'lucide-react'

export function QuickScanFAB() {
    const [isOpen, setIsOpen] = useState(false)
    const navigate = useNavigate()

    const actions = [
        { label: 'Scan URL', icon: Link, color: 'bg-cyan/20 text-cyan', action: () => navigate('/scan?type=url') },
        { label: 'Scan File', icon: FileUp, color: 'bg-neon-green/20 text-neon-green', action: () => navigate('/scan?type=file') },
        { label: 'Scan Message', icon: MessageSquare, color: 'bg-neon-orange/20 text-neon-orange', action: () => navigate('/scan?type=message') },
    ]

    return (
        <div className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 z-30">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute bottom-16 right-0 space-y-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        {actions.map((action, i) => (
                            <motion.button
                                key={action.label}
                                onClick={() => {
                                    action.action()
                                    setIsOpen(false)
                                }}
                                className="flex items-center gap-3 glass-card px-4 py-2.5 whitespace-nowrap hover:border-cyan/30 transition-colors"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                                    <action.icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-ui text-text-primary">{action.label}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-2xl bg-cyan text-primary flex items-center justify-center shadow-lg shadow-cyan/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isOpen ? 45 : 0 }}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </motion.button>
        </div>
    )
}
