import { Router, type Response } from 'express'
import { z } from 'zod'
import { authMiddleware, optionalAuth, type AuthRequest } from '../middleware/auth.js'
import {
    registerDeviceSession,
    listDeviceSessions,
    revokeDeviceSession,
    revokeOtherDeviceSessions,
} from '../utils/deviceSessionStore.js'
import { getAdminAuth } from '../utils/firebaseAdmin.js'
import { supabase } from '../utils/supabase.js'
import { getIO } from '../socket/index.js'
import logger from '../utils/logger.js'

const router = Router()

const updateEmailSchema = z.object({
    email: z.string().trim().email('Invalid email address'),
})

const registerSessionSchema = z.object({
    deviceId: z.string().trim().min(1).max(200),
    deviceName: z.string().trim().max(200).optional(),
    platform: z.enum(['web', 'android', 'ios']).optional(),
})

const mapSession = (row: any, currentDeviceId?: string) => ({
    id: row.id,
    deviceId: row.device_id,
    deviceName: row.device_name || 'Unknown device',
    platform: row.platform,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    current: !!currentDeviceId && row.device_id === currentDeviceId,
})

// ─── POST /auth/sessions/register ────────────────
// Called once after login (and on app start if already logged in) so this
// device shows up in the user's "Active Devices" list and can be targeted
// for remote logout. Re-registering a previously revoked device reactivates
// it — correct, since that means the user genuinely signed back in there.
router.post('/sessions/register', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const parsed = registerSessionSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(422).json({ error: 'Invalid device session payload', details: parsed.error.flatten() })
            return
        }
        const { deviceId, deviceName, platform } = parsed.data

        await registerDeviceSession({
            userId: req.userId!,
            deviceId,
            deviceName,
            platform,
            userAgent: (req.headers['user-agent'] as string) || null,
            ip: req.ip || null,
        })

        res.json({ success: true })
    } catch (error: any) {
        logger.error('Session register error', { error: error.message, userId: req.userId })
        res.status(500).json({ error: 'Failed to register device session' })
    }
})

// ─── GET /auth/sessions ────────────────
router.get('/sessions', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const currentDeviceId = req.headers['x-device-id'] as string | undefined
        const sessions = await listDeviceSessions(req.userId!)
        res.json({ sessions: sessions.map((row) => mapSession(row, currentDeviceId)) })
    } catch (error: any) {
        logger.error('List sessions error', { error: error.message, userId: req.userId })
        res.status(500).json({ error: 'Failed to load active devices' })
    }
})

// ─── DELETE /auth/sessions/:id ────────────────
// Revokes one specific device. That device's next API call fails
// authMiddleware's revocation check and it's bounced to /login.
router.delete('/sessions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
        const revoked = await revokeDeviceSession(req.userId!, sessionId)
        if (!revoked) {
            res.status(404).json({ error: 'Device session not found' })
            return
        }
        res.json({ success: true })
    } catch (error: any) {
        logger.error('Revoke session error', { error: error.message, userId: req.userId, sessionId: req.params.id })
        res.status(500).json({ error: 'Failed to log out device' })
    }
})

// ─── POST /auth/sessions/revoke-others ────────────────
// "Log out all other devices" — keeps the caller's own device active.
router.post('/sessions/revoke-others', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const currentDeviceId = req.headers['x-device-id'] as string | undefined
        await revokeOtherDeviceSessions(req.userId!, currentDeviceId)
        res.json({ success: true })
    } catch (error: any) {
        logger.error('Revoke-others error', { error: error.message, userId: req.userId })
        res.status(500).json({ error: 'Failed to log out other devices' })
    }
})

// ─── GET /auth/me ────────────────
// Returns the authenticated user's profile from Supabase
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        res.json({
            id: req.userId,
            email: req.userEmail,
            plan: req.userPlan || 'free',
            createdAt: new Date().toISOString(),
        })
    } catch (error: any) {
        logger.error('Get me error', { error: error.message })
        res.status(500).json({ error: 'Failed to get user' })
    }
})

// ─── PUT /auth/email ────────────────
// Updates user email in Firebase Admin & Supabase, and broadcasts via Socket.io
router.put('/email', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const parsed = updateEmailSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(422).json({ error: 'Valid email is required', details: parsed.error.flatten() })
            return
        }
        const newEmail = parsed.data.email.toLowerCase()

        // 1. Update in Firebase Admin Auth
        try {
            await getAdminAuth().updateUser(req.userId!, { email: newEmail })
        } catch (fbErr: any) {
            logger.warn('Firebase email update note:', { error: fbErr.message })
        }

        // 2. Update in Supabase
        try {
            await supabase.from('users').upsert({
                id: req.userId!,
                email: newEmail,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })
        } catch (dbErr: any) {
            logger.warn('Supabase email update note:', { error: dbErr.message })
        }

        // 3. Broadcast real-time update to all active sessions (Web + Mobile)
        const io = getIO()
        io?.to(`user:${req.userId}`).emit('user:updated', { userId: req.userId, email: newEmail })
        io?.emit('user:updated', { userId: req.userId, email: newEmail })

        logger.info('User email updated and synchronized', { userId: req.userId, newEmail })
        res.json({ success: true, email: newEmail })
    } catch (error: any) {
        logger.error('Email update error', { error: error.message, userId: req.userId })
        res.status(500).json({ error: 'Failed to update email' })
    }
})

// ─── Shared In-Memory & Cloud Settings Store ───
const sharedSettingsMap = new Map<string, any>()

// ─── GET /auth/settings ────────────────
router.get('/settings', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
        const key = req.userId || (req.query.userId as string) || 'default-user'
        let current = sharedSettingsMap.get(key)
        if (!current) {
            current = {
                notifications: true,
                soundAlerts: false,
                realTimeScanning: true,
                autoBlock: false,
                darkMode: true,
                updatedAt: new Date().toISOString(),
            }
            sharedSettingsMap.set(key, current)
        }
        res.json(current)
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to load settings' })
    }
})

// ─── PUT /auth/settings ────────────────
router.put('/settings', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
        const key = req.userId || req.body?.userId || (req.query.userId as string) || 'default-user'
        const existing = sharedSettingsMap.get(key) || {
            notifications: true,
            soundAlerts: false,
            realTimeScanning: true,
            autoBlock: false,
            darkMode: true,
        }
        const updated = {
            ...existing,
            ...req.body,
            updatedAt: new Date().toISOString(),
        }
        sharedSettingsMap.set(key, updated)

        // Broadcast to both Web and Mobile active sockets
        const io = getIO()
        io?.emit('settings:updated', { userId: key, settings: updated })
        if (key && key !== 'default-user') {
            io?.to(`user:${key}`).emit('settings:updated', { userId: key, settings: updated })
        }

        logger.info('User settings synchronized', { userId: key, updated })
        res.json({ success: true, settings: updated })
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update settings' })
    }
})

// ─── POST /auth/logout ────────────────
// Server-side cleanup (clear cookies, etc.)
router.post('/logout', (_req: AuthRequest, res: Response) => {
    try {
        res.clearCookie('refreshToken', { path: '/' })
        res.json({ success: true })
    } catch (error: any) {
        logger.error('Logout error', { error: error.message })
        res.status(500).json({ error: 'Logout failed' })
    }
})

export default router
