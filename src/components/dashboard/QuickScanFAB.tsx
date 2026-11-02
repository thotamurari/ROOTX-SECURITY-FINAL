import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Link as LinkIcon, FileUp, MessageSquare, X } from 'lucide-react'

export function QuickScanFAB() {
    const [isOpen, setIsOpen] = useState(false)
    const navigate = useNavigate()

    const actions = [
        { label: 'Scan URL', icon: LinkIcon, color: 'bg-accent-soft text-accent', action: () => navigate('/scan?type=url') },
        { label: 'Scan File', icon: FileUp, color: 'bg-success-soft text-success', action: () => navigate('/scan?type=file') },
        { label: 'Scan Message', icon: MessageSquare, color: 'bg-warning-soft text-warning', action: () => navigate('/scan?type=message') },
    ]

    return (
        <div className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 z-30">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute bottom-16 right-0 space-y-2"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18 }}
                    >
                        {actions.map((action, i) => (
                            <motion.button
                                key={action.label}
                                onClick={() => {
                                    action.action()
                                    setIsOpen(false)
                                }}
                                className="flex items-center gap-3 w-full bg-surface-1 border border-border rounded-xl shadow-sm px-3 py-2.5 whitespace-nowrap transition-colors hover:border-border-strong hover:bg-surface-2"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                transition={{ delay: i * 0.05, duration: 0.18 }}
                            >
                                <span
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}
                                    aria-hidden="true"
                                >
                                    <action.icon className="w-4 h-4" />
                                </span>
                                <span className="text-[13px] font-medium text-text-primary">{action.label}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close quick scan menu' : 'Open quick scan menu'}
                aria-expanded={isOpen}
                className="w-14 h-14 rounded-2xl bg-accent text-white flex items-center justify-center shadow-md hover:bg-accent-hover transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.18 }}
            >
                {isOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Plus className="w-6 h-6" aria-hidden="true" />}
            </motion.button>
        </div>
    )
}
