import { Router, type Response } from 'express'
import { z } from 'zod'
import { supabase } from '../utils/supabase.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { getIO } from '../socket/index.js'
import logger from '../utils/logger.js'

const router = Router()
router.use(authMiddleware)

const blockSchema = z.object({
    connectionId: z.string().uuid(),
    blocked: z.boolean(),
})

// Helper to map Supabase rows to Frontend objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapTracker = (row: any) => ({
    id: row.id,
    userId: row.user_id,
    appName: row.app_name,
    appIcon: row.app_icon,
    destinationIp: row.destination_ip,
    country: row.country,
    countryCode: row.country_code,
    latitude: row.latitude,
    longitude: row.longitude,
    dataType: row.data_type,
    isFlagged: row.is_flagged,
    isBlocked: row.is_blocked,
    riskScore: row.risk_score,
    connectedAt: row.connected_at,
})

// ─── Seed demo connections if none exist ────────────────
async function seedConnections(userId: string) {
    const { count } = await supabase
        .from('tracker_connections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    if (count && count > 0) return

    const demoConnections = [
        { app_name: 'Instagram', destination_ip: '157.240.1.35', country: 'United States', country_code: 'US', latitude: 37.7749, longitude: -122.4194, data_type: 'telemetry', risk_score: 15 },
        { app_name: 'WhatsApp', destination_ip: '157.240.12.53', country: 'United States', country_code: 'US', latitude: 40.7128, longitude: -74.006, data_type: 'metadata', risk_score: 10 },
        { app_name: 'TikTok', destination_ip: '142.250.80.46', country: 'Singapore', country_code: 'SG', latitude: 1.3521, longitude: 103.8198, data_type: 'analytics', is_flagged: true, risk_score: 65 },
        { app_name: 'Unknown SDK', destination_ip: '185.159.82.104', country: 'Russia', country_code: 'RU', latitude: 55.7558, longitude: 37.6173, data_type: 'unknown', is_flagged: true, risk_score: 82 },
        { app_name: 'Facebook', destination_ip: '157.240.1.35', country: 'Ireland', country_code: 'IE', latitude: 53.3498, longitude: -6.2603, data_type: 'ads', risk_score: 35 },
        { app_name: 'Google Maps', destination_ip: '142.250.185.206', country: 'Netherlands', country_code: 'NL', latitude: 52.3676, longitude: 4.9041, data_type: 'location', risk_score: 25 },
        { app_name: 'Weather App', destination_ip: '104.18.25.35', country: 'Germany', country_code: 'DE', latitude: 50.1109, longitude: 8.6821, data_type: 'telemetry', risk_score: 20 },
        { app_name: 'Gaming SDK', destination_ip: '203.88.164.5', country: 'China', country_code: 'CN', latitude: 39.9042, longitude: 116.4074, data_type: 'analytics', is_flagged: true, risk_score: 78 },
        { app_name: 'Spotify', destination_ip: '35.186.224.25', country: 'Sweden', country_code: 'SE', latitude: 59.3293, longitude: 18.0686, data_type: 'streaming', risk_score: 8 },
        { app_name: 'Chrome', destination_ip: '142.250.80.46', country: 'Japan', country_code: 'JP', latitude: 35.6762, longitude: 139.6503, data_type: 'browsing', risk_score: 12 },
    ]

    const insertData = demoConnections.map((c) => ({
        ...c,
        user_id: userId,
        app_icon: '',
        is_blocked: false,
    }))

    const { error } = await supabase.from('tracker_connections').insert(insertData)
    if (error) {
        logger.error('Seed connections error', { error })
    } else {
        logger.info('Seeded demo tracker connections', { userId })
    }
}

// ─── GET /tracker/connections ────────────────
router.get('/connections', async (req: AuthRequest, res: Response) => {
    try {
        await seedConnections(req.userId!)
        
        const { data: connections, error } = await supabase
            .from('tracker_connections')
            .select('*')
            .eq('user_id', req.userId)
            .order('connected_at', { ascending: false })

        if (error) throw new Error(error.message)

        res.json((connections || []).map(mapTracker))
    } catch (error) {
        logger.error('Tracker connections error', { error })
        res.status(500).json({ error: 'Failed to get connections' })
    }
})

// ─── GET /tracker/history ────────────────
router.get('/history', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
        
        let query = supabase
            .from('tracker_connections')
            .select('*', { count: 'exact' })
            .eq('user_id', req.userId)
            .order('connected_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1)

        if (req.query.flagged === 'true') {
            query = query.eq('is_flagged', true)
        }
        if (req.query.country) {
            query = query.eq('country', req.query.country as string)
        }
        if (req.query.app) {
            query = query.ilike('app_name', `%${req.query.app}%`)
        }

        const { data, count, error } = await query

        if (error) throw new Error(error.message)

        const mappedData = (data || []).map(mapTracker)
        const total = count || 0

        res.json({ connections: mappedData, total })
    } catch (error) {
        logger.error('Tracker history error', { error })
        res.status(500).json({ error: 'Failed to get history' })
    }
})

// ─── POST /tracker/block ────────────────
router.post('/block', async (req: AuthRequest, res: Response) => {
    try {
        const parsed = blockSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(422).json({ error: 'Validation failed' })
            return
        }

        const { data: conn, error } = await supabase
            .from('tracker_connections')
            .update({ is_blocked: parsed.data.blocked })
            .eq('id', parsed.data.connectionId)
            .eq('user_id', req.userId)
            .select()
            .single()

        if (error || !conn) {
            res.status(404).json({ error: 'Connection not found' })
            return
        }

        logger.info('Connection block toggled', { connectionId: conn.id, blocked: parsed.data.blocked })
        res.json({ success: true, connection: mapTracker(conn) })
    } catch (error) {
        logger.error('Tracker block error', { error })
        res.status(500).json({ error: 'Failed to update connection' })
    }
})

export default router
