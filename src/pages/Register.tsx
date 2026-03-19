import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

const registerSchema = z
    .object({
        email: z.string().email('Enter a valid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

type RegisterForm = z.infer<typeof registerSchema>

export default function Register() {
    const { register: registerUser, isRegistering } = useAuth()
    const [showPassword, setShowPassword] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = (data: RegisterForm) => {
        registerUser({
            email: data.email,
            password: data.password,
            confirmPassword: data.confirmPassword,
            deviceFingerprint: navigator.userAgent,
        })
    }

    return (
        <div className="min-h-screen bg-primary bg-grid flex items-center justify-center p-4">
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan/5 rounded-full blur-[120px]" />
            </div>

            <motion.div
                className="relative w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.div
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neon-green/10 flex items-center justify-center glow-green"
                        animate={{ boxShadow: ['0 0 20px rgba(0,255,136,0.15)', '0 0 40px rgba(0,255,136,0.25)', '0 0 20px rgba(0,255,136,0.15)'] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <UserPlus className="w-8 h-8 text-neon-green" />
                    </motion.div>
                    <h1 className="text-3xl font-display font-bold text-gradient-cyan mb-2">Join SafeOpen</h1>
                    <p className="text-text-secondary text-sm font-body">Create your security guardian account</p>
                </div>

                {/* Form */}
                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-ui text-text-secondary mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="you@example.com"
                                    className="input-field pl-10"
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-xs text-neon-red font-body">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-ui text-text-secondary mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Minimum 8 characters"
                                    className="input-field pl-10 pr-10"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-neon-red font-body">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-ui text-text-secondary mb-2">Confirm Password</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    {...register('confirmPassword')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Repeat password"
                                    className="input-field pl-10"
                                    autoComplete="new-password"
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-neon-red font-body">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={isRegistering}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            {isRegistering ? (
                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-text-muted font-body">
                            Already have an account?{' '}
                            <Link to="/login" className="text-cyan hover:underline font-ui font-medium">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
