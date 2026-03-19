import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Check } from 'lucide-react'

export function UpgradeModal() {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const handler = () => setIsOpen(true)
        window.addEventListener('show-upgrade-modal', handler)
        return () => window.removeEventListener('show-upgrade-modal', handler)
    }, [])

    const plans = [
        {
            name: 'Pro',
            price: '$9.99/mo',
            features: ['Unlimited scans', 'Advanced AI analysis', 'Priority support', 'API access'],
        },
        {
            name: 'Enterprise',
            price: '$29.99/mo',
            features: ['Everything in Pro', 'Team management', 'Custom integrations', 'SLA guarantee', 'Dedicated support'],
        },
    ]

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <motion.div
                        className="relative glass-card p-8 max-w-2xl w-full"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-12 h-12 mx-auto bg-cyan/10 rounded-xl flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 text-cyan" />
                            </div>
                            <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Upgrade Your Plan</h2>
                            <p className="text-text-secondary text-sm font-body">
                                Unlock premium features to enhance your security protection.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {plans.map((plan) => (
                                <div
                                    key={plan.name}
                                    className="glass-card-hover p-6 cursor-pointer"
                                >
                                    <h3 className="text-lg font-display font-bold text-cyan mb-1">{plan.name}</h3>
                                    <p className="text-2xl font-display font-bold text-text-primary mb-4">{plan.price}</p>
                                    <ul className="space-y-2">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-sm text-text-secondary font-body">
                                                <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button className="btn-primary w-full mt-6 text-sm">Select {plan.name}</button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
