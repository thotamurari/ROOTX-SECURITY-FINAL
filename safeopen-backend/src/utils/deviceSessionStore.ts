import { supabase } from './supabase.js'
import logger from './logger.js'
import crypto from 'crypto'

export interface DeviceSessionRecord {
    id: string
    user_id: string
    device_id: string
    device_name: string | null
    platform: string
    user_agent: string | null
    ip: string | null
    created_at: string
    last_seen_at: string
    revoked_at: string | null
}

// In-memory fallback cache when Supabase is unreachable or unconfigured
const memorySessions = new Map<string, DeviceSessionRecord>()

function getCompositeKey(userId: string, deviceId: string): string {
    return `${userId}:${deviceId}`
}

export async function registerDeviceSession(params: {
    userId: string
    deviceId: string
    deviceName?: string | null
    platform?: string
    userAgent?: string | null
    ip?: string | null
}): Promise<void> {
    const now = new Date().toISOString()
    const compositeKey = getCompositeKey(params.userId, params.deviceId)

    // Update in-memory record first to guarantee local resilience
    const existing = memorySessions.get(compositeKey)
    const sessionRecord: DeviceSessionRecord = {
        id: existing?.id || crypto.randomUUID(),
        user_id: params.userId,
        device_id: params.deviceId,
        device_name: params.deviceName || existing?.device_name || 'Current Device',
        platform: params.platform || existing?.platform || 'web',
        user_agent: params.userAgent || existing?.user_agent || null,
        ip: params.ip || existing?.ip || null,
        created_at: existing?.created_at || now,
        last_seen_at: now,
        revoked_at: null, // Reset revocation on fresh sign-in/registration
    }
    memorySessions.set(compositeKey, sessionRecord)

    // Best-effort persist to Supabase if available
    try {
        const { error } = await supabase.from('device_sessions').upsert({
            user_id: params.userId,
            device_id: params.deviceId,
            device_name: sessionRecord.device_name,
            platform: sessionRecord.platform,
            user_agent: sessionRecord.user_agent,
            ip: sessionRecord.ip,
            last_seen_at: sessionRecord.last_seen_at,
            revoked_at: null,
        }, { onConflict: 'user_id,device_id' })

        if (error) {
            logger.warn('Supabase session upsert skipped (using local store)', { message: error.message })
        }
    } catch (err: any) {
        logger.warn('Supabase unreachable for session register (using local store)', { message: err.message })
    }
}

export async function listDeviceSessions(userId: string): Promise<DeviceSessionRecord[]> {
    // Try Supabase first
    try {
        const { data, error } = await supabase
            .from('device_sessions')
            .select('*')
            .eq('user_id', userId)
            .is('revoked_at', null)
            .order('last_seen_at', { ascending: false })

        if (!error && Array.isArray(data) && data.length > 0) {
            return data as DeviceSessionRecord[]
        }
    } catch (err: any) {
        logger.warn('Supabase unreachable for session list (using local store)', { message: err.message })
    }

    // Fall back to in-memory sessions
    const userSessions: DeviceSessionRecord[] = []
    for (const session of memorySessions.values()) {
        if (session.user_id === userId && !session.revoked_at) {
            userSessions.push(session)
        }
    }
    userSessions.sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime())
    return userSessions
}

export async function revokeDeviceSession(userId: string, sessionIdOrDeviceId: string): Promise<boolean> {
    const now = new Date().toISOString()
    let found = false

    // Update in-memory
    for (const [key, session] of memorySessions.entries()) {
        if (session.user_id === userId && (session.id === sessionIdOrDeviceId || session.device_id === sessionIdOrDeviceId)) {
            session.revoked_at = now
            found = true
        }
    }

    // Try Supabase
    try {
        const { error, count } = await supabase
            .from('device_sessions')
            .update({ revoked_at: now }, { count: 'exact' })
            .or(`id.eq.${sessionIdOrDeviceId},device_id.eq.${sessionIdOrDeviceId}`)
            .eq('user_id', userId)

        if (!error && count && count > 0) {
            found = true
        }
    } catch (err: any) {
        logger.warn('Supabase unreachable for session revoke', { message: err.message })
    }

    return found
}

export async function revokeOtherDeviceSessions(userId: string, currentDeviceId?: string): Promise<void> {
    const now = new Date().toISOString()

    // Update in-memory
    for (const [key, session] of memorySessions.entries()) {
        if (session.user_id === userId && session.device_id !== currentDeviceId) {
            session.revoked_at = now
        }
    }

    // Try Supabase
    try {
        let query = supabase
            .from('device_sessions')
            .update({ revoked_at: now })
            .eq('user_id', userId)
            .is('revoked_at', null)

        if (currentDeviceId) {
            query = query.neq('device_id', currentDeviceId)
        }

        await query
    } catch (err: any) {
        logger.warn('Supabase unreachable for revoke-others', { message: err.message })
    }
}

export async function isDeviceSessionRevoked(userId: string, deviceId: string): Promise<boolean> {
    const compositeKey = getCompositeKey(userId, deviceId)
    const local = memorySessions.get(compositeKey)
    if (local?.revoked_at) {
        return true
    }

    try {
        const { data } = await supabase
            .from('device_sessions')
            .select('revoked_at')
            .eq('user_id', userId)
            .eq('device_id', deviceId)
            .maybeSingle()

        if (data?.revoked_at) {
            if (local) local.revoked_at = data.revoked_at
            return true
        }
    } catch {
        // Supabase offline — rely on local state
    }

    return false
}

export function touchDeviceSession(userId: string, deviceId: string): void {
    const compositeKey = getCompositeKey(userId, deviceId)
    const local = memorySessions.get(compositeKey)
    if (local && !local.revoked_at) {
        local.last_seen_at = new Date().toISOString()
    }
}
