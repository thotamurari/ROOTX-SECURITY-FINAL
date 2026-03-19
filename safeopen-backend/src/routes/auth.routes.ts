import { Router, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { supabase } from '../utils/supabase.js'
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import logger from '../utils/logger.js'

const router = Router()

// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    deviceFingerprint: z.string().optional(),
})

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

// ─── POST /auth/register ────────────────
router.post('/register', async (req: AuthRequest, res: Response) => {
    try {
        const parsed = registerSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() })
            return
        }

        const { email, password, deviceFingerprint } = parsed.data

        const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
        if (existing) {
            res.status(409).json({ error: 'Email already registered' })
            return
        }

        const passwordHash = await bcrypt.hash(password, 12)
        
        const { data: user, error: dbErr } = await supabase
            .from('users')
            .insert({ email, password_hash: passwordHash, device_fingerprint: deviceFingerprint })
            .select()
            .single()

        if (dbErr || !user) {
            logger.error('Database register error', { error: dbErr })
            res.status(500).json({ error: 'Failed to create user record' })
            return
        }

        const accessToken = signAccessToken({ userId: user.id, plan: user.plan })
        const refreshToken = signRefreshToken({ userId: user.id, plan: user.plan })

        // Add refresh token to user
        await supabase
            .from('users')
            .update({ refresh_tokens: [refreshToken] })
            .eq('id', user.id)

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        })

        logger.info('User registered', { userId: user.id, email })
        res.status(201).json({
            accessToken,
            user: { id: user.id, email: user.email, plan: user.plan, createdAt: user.created_at },
        })
    } catch (error) {
        logger.error('Register error', { error })
        res.status(500).json({ error: 'Registration failed' })
    }
})

// ─── POST /auth/login ────────────────
router.post('/login', async (req: AuthRequest, res: Response) => {
    try {
        const parsed = loginSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() })
            return
        }

        const { email, password } = parsed.data

        const { data: user } = await supabase.from('users').select('*').eq('email', email).single()
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' })
            return
        }

        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' })
            return
        }

        const accessToken = signAccessToken({ userId: user.id, plan: user.plan })
        const refreshToken = signRefreshToken({ userId: user.id, plan: user.plan })

        const prevTokens = user.refresh_tokens || []
        const updatedTokens = [...prevTokens, refreshToken]
        
        // Keep only last 5 refresh tokens
        const finalTokens = updatedTokens.length > 5 ? updatedTokens.slice(-5) : updatedTokens

        await supabase
            .from('users')
            .update({ refresh_tokens: finalTokens })
            .eq('id', user.id)

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        })

        logger.info('User logged in', { userId: user.id, email })
        res.json({
            accessToken,
            user: { id: user.id, email: user.email, plan: user.plan, createdAt: user.created_at },
        })
    } catch (error) {
        logger.error('Login error', { error })
        res.status(500).json({ error: 'Login failed' })
    }
})

// ─── POST /auth/refresh ────────────────
router.post('/refresh', async (req: AuthRequest, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken
        if (!refreshToken) {
            res.status(401).json({ error: 'No refresh token' })
            return
        }

        const payload = verifyToken(refreshToken)
        const { data: user } = await supabase.from('users').select('*').eq('id', payload.userId).single()

        if (!user || !(user.refresh_tokens || []).includes(refreshToken)) {
            res.status(401).json({ error: 'Invalid refresh token' })
            return
        }

        const newAccessToken = signAccessToken({ userId: user.id, plan: user.plan })
        res.json({ accessToken: newAccessToken })
    } catch (error) {
        logger.warn('Refresh failed', { error: (error as Error).message })
        res.status(401).json({ error: 'Invalid refresh token' })
    }
})

// ─── POST /auth/logout ────────────────
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken
        if (refreshToken && req.userId) {
            const { data: user } = await supabase.from('users').select('refresh_tokens').eq('id', req.userId).single()
            if (user) {
                const updatedTokens = (user.refresh_tokens || []).filter((t: string) => t !== refreshToken)
                await supabase.from('users').update({ refresh_tokens: updatedTokens }).eq('id', req.userId)
            }
        }

        res.clearCookie('refreshToken', { path: '/' })
        res.json({ success: true })
    } catch (error) {
        logger.error('Logout error', { error })
        res.status(500).json({ error: 'Logout failed' })
    }
})

// ─── GET /auth/me ────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { data: user, error } = await supabase.from('users').select('id, email, plan, created_at').eq('id', req.userId).single()
        if (error || !user) {
            res.status(404).json({ error: 'User not found' })
            return
        }
        res.json({ id: user.id, email: user.email, plan: user.plan, createdAt: user.created_at })
    } catch (error) {
        logger.error('Get me error', { error })
        res.status(500).json({ error: 'Failed to get user' })
    }
})

export default router
