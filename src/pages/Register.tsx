import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, User, Mail, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { GoogleIcon } from '@/components/shared/Icons'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/shared/Button'
import { Field } from '@/components/shared/Field'
import { GoogleAuthModal } from '@/components/shared/GoogleAuthModal'

/** Shared entrance animation for stacked auth content. */
const fadeUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
}

export default function Register() {
    const {
        register: registerUser,
        isRegistering,
        socialLogin,
        isSocialLoading,
        isAuthenticated,
    } = useAuth()
    const navigate = useNavigate()

    // form state
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // Auto-redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true })
        }
    }, [isAuthenticated, navigate])

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault()
        registerUser({
            email,
            password,
            confirmPassword: password, // For backend compatibility
            deviceFingerprint: navigator.userAgent,
        })
    }

    const isSubmitting = isRegistering

    return (
        <div className="relative min-h-screen bg-base text-text-primary flex flex-col font-sans overflow-hidden">
            {/* Subtle grid backdrop */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
            />

            <header className="relative z-10 flex items-center gap-2 px-3 py-3 border-b border-border">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Go back"
                    onClick={() => navigate(-1)}
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-[14px] font-semibold tracking-tight text-text-secondary">
                    Create account
                </h1>
            </header>

            <main className="relative z-10 flex-1 w-full max-w-sm mx-auto px-5 py-8 flex flex-col">
                <motion.div
                    {...fadeUp}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center mb-7"
                >
                    <Logo size="sm" glow={false} />
                    <h2 className="text-[20px] font-bold tracking-tight mt-4">Get protected</h2>
                    <p className="text-[13px] text-text-secondary mt-1 text-center">
                        Create your RootX account to start scanning in seconds.
                    </p>
                </motion.div>

                <motion.form
                    {...fadeUp}
                    transition={{ duration: 0.3, delay: 0.08 }}
                    onSubmit={handleRegister}
                    className="space-y-4"
                >
                    <Field
                        label="Full name"
                        type="text"
                        placeholder="e.g. Alex Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        leftIcon={<User className="w-4 h-4" />}
                        autoComplete="name"
                    />

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
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        leftIcon={<Lock className="w-4 h-4" />}
                        hint="Use at least 8 characters with a number or symbol."
                        autoComplete="new-password"
                    />

                    <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        isLoading={isSubmitting}
                        className="mt-1"
                    >
                        {isSubmitting ? 'Creating account…' : 'Create account'}
                    </Button>
                </motion.form>

                <motion.div
                    {...fadeUp}
                    transition={{ duration: 0.3, delay: 0.14 }}
                    className="flex items-center gap-3 py-6"
                >
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[11px] uppercase tracking-wider text-text-tertiary">
                        or sign up with
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
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="font-semibold text-accent hover:text-accent-hover transition-colors"
                    >
                        Log in
                    </Link>
                </p>
            </main>
        </div>
    )
}
