import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, ArrowRight, ShieldCheck } from 'lucide-react'
import { GoogleIcon } from './Icons'
import { Button } from './Button'
import { Field } from './Field'

interface Props {
    isOpen: boolean
    onClose: () => void
    onConfirm: (email: string) => Promise<void> | void
    isLoading?: boolean
}

export function GoogleAuthModal({ isOpen, onClose, onConfirm, isLoading = false }: Props) {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = email.trim().toLowerCase()
        if (!trimmed) {
            setError('Please enter your Google email address')
            return
        }
        if (!trimmed.includes('@') || !trimmed.includes('.')) {
            setError('Please enter a valid email address')
            return
        }
        setError('')
        await onConfirm(trimmed)
    }

    const handleQuickDomain = (domain: string) => {
        if (!email.includes('@')) {
            setEmail(email.trim() + domain)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-overlay backdrop-blur-xs"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-sm bg-surface-1 border border-border rounded-2xl p-6 shadow-2xl z-10 space-y-5"
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="absolute top-4 right-4 p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-2 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Header */}
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto shadow-xs">
                                <GoogleIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-[17px] font-bold text-text-primary tracking-tight">
                                    Sign in with Google
                                </h3>
                                <p className="text-[12.5px] text-text-secondary mt-0.5">
                                    Choose your Google account to access RootX-Security
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Field
                                    label="Google Account Email"
                                    type="email"
                                    placeholder="yourname@gmail.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        if (error) setError('')
                                    }}
                                    disabled={isLoading}
                                    leftIcon={<Mail className="w-4 h-4" />}
                                    autoFocus
                                    autoComplete="email"
                                />

                                {error && (
                                    <p className="text-[11.5px] text-danger mt-1.5">{error}</p>
                                )}

                                {/* Quick domain shortcuts */}
                                {!email.includes('@') && email.length > 2 && (
                                    <div className="flex gap-1.5 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => handleQuickDomain('@gmail.com')}
                                            className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-2 border border-border text-text-secondary hover:text-accent hover:border-accent"
                                        >
                                            + @gmail.com
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickDomain('@googlemail.com')}
                                            className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-2 border border-border text-text-secondary hover:text-accent hover:border-accent"
                                        >
                                            + @googlemail.com
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-surface-2/60 border border-border rounded-xl flex items-start gap-2.5">
                                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                                <p className="text-[11.5px] text-text-secondary leading-snug">
                                    If this email is already registered, you'll be signed in immediately. If it's your first time, a secure new account will be created automatically.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                fullWidth
                                isLoading={isLoading}
                                rightIcon={<ArrowRight className="w-4 h-4" />}
                                className="font-semibold shadow-xs"
                            >
                                {isLoading ? 'Authenticating…' : 'Continue to RootX'}
                            </Button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
