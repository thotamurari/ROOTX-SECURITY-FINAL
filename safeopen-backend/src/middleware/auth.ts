import type { Request, Response, NextFunction } from 'express'
import { verifyFirebaseToken, isFirebaseAdminConfigured } from '../utils/firebaseAdmin.js'
import { isDeviceSessionRevoked, touchDeviceSession } from '../utils/deviceSessionStore.js'
import { supabase } from '../utils/supabase.js'
import logger from '../utils/logger.js'

export interface AuthRequest extends Request {
    userId?: string
    userPlan?: string
    userEmail?: string
}

/**
 * Attaches the user if a valid Firebase token is present, but NEVER blocks the
 * request if it isn't. Used for the scan endpoints so the core feature — real
 * VirusTotal / AbuseIPDB results — works even before the Firebase Admin +
 * Supabase service-role keys are configured. When a user is present, the scan
 * is also persisted to their history; when not, the scan still runs and
 * returns real results, just without saving. This is what stops the frontend
 * from silently falling back to fabricated local results on a 401.
 */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null
        if (token && isFirebaseAdminConfigured) {
            try {
                const user = await verifyFirebaseToken(token)
                req.userId = user.uid
                req.userEmail = user.email
                try {
                    await supabase.from('users').upsert({
                        id: user.uid,
                        email: user.email,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'id' })
                } catch {
                    // Supabase offline — proceed without blocking
                }
            } catch {
                // Invalid/expired token — proceed as an anonymous scan.
            }
        }
    } catch {
        // Never block on auth here.
    }
    next()
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' })
            return
        }

        const token = authHeader.split(' ')[1]
        if (!token) {
            res.status(401).json({ error: 'Invalid token format' })
            return
        }

        if (!isFirebaseAdminConfigured) {
            // Fail loudly and specifically instead of a generic 401 — this is a
            // server misconfiguration, not a bad/expired token, and silently
            // falling back to client-side mock scan results (as previously
            // happened) hides real functionality behind a confusing UX.
            res.status(503).json({
                error: 'Server auth is not configured',
                message: 'FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY are missing from the backend .env file.',
            })
            return
        }

        // Verify the Firebase ID token (matches what the frontend actually sends — see src/services/axios.ts)
        let firebaseUser: { uid: string; email?: string }
        try {
            firebaseUser = await verifyFirebaseToken(token)
        } catch (error) {
            logger.warn('Firebase token verification failed', { error: (error as Error).message })
            res.status(401).json({ error: 'Invalid or expired token' })
            return
        }

        req.userId = firebaseUser.uid
        req.userEmail = firebaseUser.email

        // ─── Device session revocation check ────────────────
        // Firebase ID tokens stay valid for up to an hour on the client even
        // after the user revokes this device from Settings → Active Devices
        // (see routes/auth.routes.ts /sessions endpoints) — refreshing the
        // token wouldn't help, since Firebase itself never considered the
        // device "logged out". So the revocation has to be enforced here,
        // against our own device_sessions store, independent of token validity.
        const deviceId = req.headers['x-device-id'] as string | undefined
        if (deviceId) {
            const isRevoked = await isDeviceSessionRevoked(req.userId, deviceId)
            if (isRevoked) {
                res.status(401).json({
                    error: 'Session revoked',
                    message: 'This device was logged out remotely. Please sign in again.',
                })
                return
            }
            touchDeviceSession(req.userId, deviceId)
        }

        // ─── User Sync ────────────────
        // Ensure user exists in public.users to satisfy foreign key constraints.
        // Uses the service-role Supabase client (see utils/supabase.ts) since
        // there is no Supabase auth session here — Firebase is the identity
        // provider now, and this backend enforces per-user scoping itself.
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('plan')
            .eq('id', req.userId)
            .maybeSingle()

        if (fetchError) {
            logger.warn('User lookup failed', { userId: req.userId, error: fetchError.message })
        }

        req.userPlan = existingUser?.plan || 'free'

        const { error: syncError } = await supabase.from('users').upsert({
            id: req.userId,
            email: req.userEmail,
            plan: req.userPlan,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

        if (syncError) {
            logger.warn('User sync to public table failed', { userId: req.userId, error: syncError.message })
            // We don't block the request here, but subsequent DB calls might fail if the table is missing
        }

        next()
    } catch (error) {
        logger.warn('Auth failed', { error: (error as Error).message })
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}
