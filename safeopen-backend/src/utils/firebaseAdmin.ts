import { initializeApp, cert, getApps, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { config } from '../config/index.js'
import logger from './logger.js'

// The frontend authenticates with Firebase Auth (see src/lib/firebase.ts) and
// sends the resulting Firebase ID token as a Bearer token on every API call
// (see src/services/axios.ts). This backend must verify that same token type
// — Firebase Admin SDK is the server-side counterpart that can do so
// (Supabase's `auth.getUser()` only understands Supabase-issued JWTs, which
// is what caused every authenticated request to 401 before this fix).

let app: App | null = null
let firebaseConfigured = false

if (config.firebaseProjectId && config.firebaseClientEmail && config.firebasePrivateKey) {
    try {
        app = getApps()[0] ?? initializeApp({
            credential: cert({
                projectId: config.firebaseProjectId,
                clientEmail: config.firebaseClientEmail,
                privateKey: config.firebasePrivateKey,
            }),
        })
        firebaseConfigured = true
        logger.info('✅ Firebase Admin initialized')
    } catch (error) {
        logger.error('Failed to initialize Firebase Admin SDK', { error: (error as Error).message })
    }
} else {
    logger.warn(
        '⚠️  Firebase Admin is not configured (missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env). ' +
        'All authenticated API requests will fail with 401 until these are set. ' +
        'Get them from Firebase Console → Project Settings → Service Accounts → Generate new private key.'
    )
}

export const isFirebaseAdminConfigured = firebaseConfigured

export interface VerifiedFirebaseUser {
    uid: string
    email?: string
}

/**
 * Verifies a Firebase ID token and returns the decoded user identity.
 * Throws if Firebase Admin isn't configured or the token is invalid/expired.
 */
export async function verifyFirebaseToken(idToken: string): Promise<VerifiedFirebaseUser> {
    if (!app) {
        throw new Error('Firebase Admin is not configured on the server')
    }
    const decoded = await getAuth(app).verifyIdToken(idToken)
    return { uid: decoded.uid, email: decoded.email }
}

export function getAdminAuth() {
    if (!app) {
        throw new Error('Firebase Admin is not configured on the server')
    }
    return getAuth(app)
}
