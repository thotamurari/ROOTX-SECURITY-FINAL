import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Mail, Lock, CheckCircle2, ShieldCheck, Eye, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { GoogleIcon } from '@/components/shared/Icons'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/shared/Button'
import { Field } from '@/components/shared/Field'
import { GoogleAuthModal } from '@/components/shared/GoogleAuthModal'
import toast from 'react-hot-toast'

/** Shared entrance animation for stacked auth content. */
const fadeUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
}

export default function Login() {
    const {
        login,
        isLoggingIn,
        socialLogin,
        isSocialLoading,
        resetPassword,
        isResettingPassword,
        isAuthenticated,
    } = useAuth()
    const navigate = useNavigate()
    const [view, setView] = useState<'welcome' | 'login' | 'forgot'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [resetEmail, setResetEmail] = useState('')
    const [resetSent, setResetSent] = useState(false)

    // Auto-redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true })
        }
    }, [isAuthenticated, navigate])

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        login({ email, password })
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resetEmail.trim()) {
            toast.error('Please enter your email address')
            return
        }
        try {
            await resetPassword(resetEmail.trim())
            setResetSent(true)
        } catch {
            // Error is handled & toasted in useAuth
        }
    }

    const isSubmitting = isLoggingIn
    const isResetting = isResettingPassword

    /* ------------------------------------------------------------------ */
    /* Welcome                                                             */
    /* ------------------------------------------------------------------ */
    if (view === 'welcome') {
        return (
            <div className="relative min-h-screen bg-base text-text-primary flex flex-col font-sans overflow-hidden">
                {/* Subtle grid + accent wash */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-accent-soft blur-[120px]"
                />

                <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto px-5 py-10">
                    <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
                        <Logo size="lg" className="mb-9" />
                    </motion.div>

                    <motion.div
                        {...fadeUp}
                        transition={{ duration: 0.3, delay: 0.08 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-[30px] sm:text-[34px] leading-[1.1] font-bold tracking-tight mb-3">
                            RootX<span className="text-accent">Security</span>
                        </h1>
                        <p className="text-text-secondary text-[14.5px] leading-relaxed max-w-[300px] mx-auto">
                            AI-powered threat detection that keeps your device, apps and data
                            continuously protected.
                        </p>
                    </motion.div>

                    <motion.ul
                        {...fadeUp}
                        transition={{ duration: 0.3, delay: 0.14 }}
                        className="w-full grid grid-cols-3 gap-2 mb-9"
                    >
                        {[
                            { icon: ShieldCheck, label: 'Real-time' },
                            { icon: Eye, label: 'Tracker map' },
                            { icon: Zap, label: 'AI triage' },
                        ].map((item) => (
                            <li
                                key={item.label}
                                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface-1/70 py-3 px-1"
                            >
                                <item.icon className="w-4 h-4 text-accent" />
                                <span className="text-[11px] font-medium text-text-secondary text-center leading-tight">
                                    {item.label}
                                </span>
                            </li>
                        ))}
                    </motion.ul>

                    <motion.div
                        {...fadeUp}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="w-full space-y-3"
                    >
                        <Button size="lg" fullWidth onClick={() => setView('login')}>
                            Log in
                        </Button>
                        <Link
                            to="/register"
                            className="btn-secondary flex items-center justify-center"
                        >
                            Create account
                        </Link>
                    </motion.div>
                </main>

                <footer className="relative z-10 px-6 pb-8 pt-4 flex items-end justify-between gap-4 max-w-sm mx-auto w-full">
                    <p className="text-[10px] font-mono leading-tight text-text-tertiary">
                        SEC_LEVEL: ALPHA
                        <br />
                        NODE: 0x82…F2
                    </p>
                    <p className="text-[10px] font-mono leading-tight text-right uppercase text-text-tertiary">
                        RootX Systems v2.4.0
                    </p>
                </footer>
            </div>
        )
    }

    /* ------------------------------------------------------------------ */
    /* Forgot password                                                     */
    /* ------------------------------------------------------------------ */
    if (view === 'forgot') {
        return (
            <div className="relative min-h-screen bg-base text-text-primary flex flex-col font-sans">
                <header className="relative z-10 flex items-center gap-2 px-3 py-3 border-b border-border">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Back to sign in"
                        onClick={() => {
                            setView('login')
                            setResetSent(false)
                        }}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-[14px] font-semibold tracking-tight text-text-secondary">
                        Reset password
                    </h1>
                </header>

                <main className="relative z-10 flex-1 w-full max-w-sm mx-auto px-5 py-8 flex flex-col">
                    <div className="flex justify-center mb-7">
                        <Logo size="sm" glow={false} />
                    </div>

                    <AnimatePresence mode="wait">
                        {resetSent ? (
                            <motion.div
                                key="sent"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="flex flex-col items-center text-center gap-5"
                            >
                                <span className="w-16 h-16 rounded-2xl bg-success-soft flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-success" />
                                </span>
                                <div>
                                    <h2 className="text-[19px] font-bold tracking-tight mb-2">
                                        Check your inbox
                                    </h2>
                                    <p className="text-text-secondary text-[13.5px] leading-relaxed max-w-[300px]">
                                        We sent a password reset link to{' '}
                                        <span className="text-text-primary font-medium break-all">
                                            {resetEmail}
                                        </span>
                                        . Follow the instructions in the email to choose a new password.
                                    </p>
                                </div>
                                <div className="w-full space-y-3 pt-2">
                                    <Button
                                        size="lg"
                                        fullWidth
                                        onClick={() => {
                                            setView('login')
                                            setResetSent(false)
                                        }}
                                    >
                                        Back to login
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="md"
                                        fullWidth
                                        onClick={() => setResetSent(false)}
                                    >
                                        Didn't receive it? Try again
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                onSubmit={handleForgotPassword}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-5"
                            >
                                <div className="text-center">
                                    <span className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-7 h-7 text-accent" />
                                    </span>
                                    <h2 className="text-[18px] font-bold tracking-tight mb-1.5">
                                        Forgot your password?
                                    </h2>
                                    <p className="text-text-secondary text-[13.5px] leading-relaxed">
                                        Enter the email tied to your account and we'll send you a
                                        secure reset link.
                                    </p>
                                </div>

                                <Field
                                    label="Email address"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    disabled={isResetting}
                                    leftIcon={<Mail className="w-4 h-4" />}
                                    autoComplete="email"
                                    autoFocus
                                />

                                <Button
                                    type="submit"
                                    size="lg"
                                    fullWidth
                                    isLoading={isResetting}
                                    disabled={isResetting || !resetEmail.trim()}
                                >
                                    {isResetting ? 'Sending…' : 'Send reset link'}
                                </Button>

                                <p className="text-center text-[13px] text-text-secondary">
                                    Remember your password?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setView('login')}
                                        className="font-semibold text-accent hover:text-accent-hover transition-colors"
                                    >
                                        Log in
                                    </button>
                                </p>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        )
    }

    /* ------------------------------------------------------------------ */
    /* Login                                                               */
    /* ------------------------------------------------------------------ */
    return (
        <div className="relative min-h-screen bg-base text-text-primary flex flex-col font-sans">
            <header className="relative z-10 flex items-center gap-2 px-3 py-3 border-b border-border">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Back to welcome screen"
                    onClick={() => setView('welcome')}
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-[14px] font-semibold tracking-tight text-text-secondary">
                    Sign in to RootX
                </h1>
            </header>

            <main className="relative z-10 flex-1 w-full max-w-sm mx-auto px-5 py-8 flex flex-col">
                <motion.div
                    {...fadeUp}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center mb-7"
                >
                    <Logo size="sm" glow={false} />
                    <h2 className="text-[20px] font-bold tracking-tight mt-4">Welcome back</h2>
                    <p className="text-[13px] text-text-secondary mt-1">
                        Sign in to resume monitoring your devices.
                    </p>
                </motion.div>

                <motion.form
                    {...fadeUp}
                    transition={{ duration: 0.3, delay: 0.08 }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                >
                    <Field
                        label="Email address"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        leftIcon={<Mail className="w-4 h-4" />}
                        autoComplete="email"
                    />

                    <Field
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        leftIcon={<Lock className="w-4 h-4" />}
                        autoComplete="current-password"
                    />

                    <div className="flex justify-end -mt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setView('forgot')
                                setResetEmail(email)
                            }}
                            className="text-[12.5px] font-semibold text-accent hover:text-accent-hover transition-colors"
                        >
                            Forgot password?
                        </button>
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        isLoading={isSubmitting}
                        className="mt-1"
                    >
                        {isSubmitting ? 'Signing in…' : 'Log in'}
                    </Button>
                </motion.form>

                <motion.div
                    {...fadeUp}
                    transition={{ duration: 0.3, delay: 0.14 }}
                    className="flex items-center gap-3 py-6"
                >
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[11px] uppercase tracking-wider text-text-tertiary">
                        or continue with
                    </span>
                    <span className="h-px flex-1 bg-border" />
                </motion.div>

                <motion.div
                    {...fadeUp}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className={`space-y-2.5 transition-opacity duration-300 ${
                        isSubmitting || isSocialLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'
                    }`}
                >
                    <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        fullWidth
                        isLoading={isSocialLoading}
                        onClick={() => socialLogin('google')}
                        leftIcon={<GoogleIcon className="w-[18px] h-[18px]" />}
                    >
                        Continue with Google
                    </Button>
                </motion.div>

                <p className="text-center text-[13px] text-text-secondary mt-auto pt-8">
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="font-semibold text-accent hover:text-accent-hover transition-colors"
                    >
                        Create one
                    </Link>
                </p>
            </main>
        </div>
    )
}
