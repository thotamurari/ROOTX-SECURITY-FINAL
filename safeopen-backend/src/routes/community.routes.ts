import { Router, type Response } from 'express'
import { z } from 'zod'
import { supabase } from '../utils/supabase.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { getIO } from '../socket/index.js'
import logger from '../utils/logger.js'

const router = Router()
router.use(authMiddleware)

const reportSchema = z.object({
    inputHash: z.string().min(1),
    threatType: z.string().min(1),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string().optional(),
})

const voteSchema = z.object({
    reportId: z.string().uuid(),
    vote: z.enum(['up', 'down']),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapReport = (row: any) => ({
    id: row.id,
    reporterId: row.reporter_id,
    inputHash: row.input_hash,
    threatType: row.threat_type,
    severity: row.severity,
    description: row.description,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    trustScore: row.trust_score,
    verified: row.verified,
    createdAt: row.created_at,
})

// ─── POST /community/report ────────────────
router.post('/report', async (req: AuthRequest, res: Response) => {
    try {
        const parsed = reportSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() })
            return
        }

        const { data: reportRow, error: reportErr } = await supabase.from('community_reports').insert({
            reporter_id: req.userId,
            input_hash: parsed.data.inputHash,
            threat_type: parsed.data.threatType,
            severity: parsed.data.severity,
            description: parsed.data.description,
        }).select().single()

        if (reportErr || !reportRow) {
            throw new Error(reportErr?.message || 'Failed to create report')
        }

        const report = mapReport(reportRow)

        // Upsert threat feed manual increment
        const { data: existingFeed } = await supabase
            .from('threat_feeds')
            .select('reported_count')
            .eq('indicator', parsed.data.inputHash)
            .maybeSingle()

        await supabase.from('threat_feeds').upsert({
            indicator: parsed.data.inputHash,
            threat_type: parsed.data.threatType,
            severity: parsed.data.severity,
            source: 'community',
            reported_count: existingFeed ? existingFeed.reported_count + 1 : 1,
            last_seen: new Date().toISOString(),
        })

        // Emit to all connected clients
        const io = getIO()
        io?.emit('community:new_threat', report)

        logger.info('Community report submitted', { userId: req.userId, threatType: parsed.data.threatType })
        res.status(201).json(report)
    } catch (error) {
        logger.error('Community report error', { error })
        res.status(500).json({ error: 'Failed to submit report' })
    }
})

// ─── GET /community/trust/:hash ────────────────
router.get('/trust/:hash', async (req: AuthRequest, res: Response) => {
    try {
        const { data: reports, error } = await supabase
            .from('community_reports')
            .select('upvotes, downvotes, verified')
            .eq('input_hash', req.params.hash)

        if (error || !reports || reports.length === 0) {
            res.json({
                hash: req.params.hash,
                trustScore: 0,
                totalReports: 0,
                verified: false,
            })
            return
        }

        const totalUps = reports.reduce((sum, r) => sum + r.upvotes, 0)
        const totalDowns = reports.reduce((sum, r) => sum + r.downvotes, 0)
        const trustScore = totalUps + totalDowns > 0
            ? Math.round((totalUps / (totalUps + totalDowns)) * 100)
            : 50

        res.json({
            hash: req.params.hash,
            trustScore,
            totalReports: reports.length,
            verified: reports.some((r) => r.verified),
        })
    } catch (error) {
        logger.error('Trust score error', { error })
        res.status(500).json({ error: 'Failed to get trust score' })
    }
})

// ─── GET /community/feed ────────────────
router.get('/feed', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
        const sortParam = req.query.sort === 'votes' ? 'upvotes' : 'created_at'

        let query = supabase
            .from('community_reports')
            .select('*', { count: 'exact' })
            .order(sortParam, { ascending: false })
            .range((page - 1) * limit, page * limit - 1)

        if (req.query.severity) {
            query = query.eq('severity', req.query.severity as string)
        }

        const { data, count, error } = await query

        if (error) throw new Error(error.message)

        const mappedData = (data || []).map(mapReport)
        const total = count || 0

        res.json({ data: mappedData, total, page, limit, hasMore: ((page - 1) * limit) + mappedData.length < total })
    } catch (error) {
        logger.error('Community feed error', { error })
        res.status(500).json({ error: 'Failed to get feed' })
    }
})

// ─── POST /community/vote ────────────────
router.post('/vote', async (req: AuthRequest, res: Response) => {
    try {
        const parsed = voteSchema.safeParse(req.body)
        if (!parsed.success) {
            res.status(422).json({ error: 'Validation failed' })
            return
        }

        // Fetch current report
        const { data: report, error: fetchErr } = await supabase
            .from('community_reports')
            .select('upvotes, downvotes, trust_score')
            .eq('id', parsed.data.reportId)
            .single()

        if (fetchErr || !report) {
            res.status(404).json({ error: 'Report not found' })
            return
        }

        const newUpvotes = parsed.data.vote === 'up' ? report.upvotes + 1 : report.upvotes
        const newDownvotes = parsed.data.vote === 'down' ? report.downvotes + 1 : report.downvotes
        
        const total = newUpvotes + newDownvotes
        const newTrustScore = total > 0 ? Math.round((newUpvotes / total) * 100) : 50

        const { data: updatedReport, error: updateErr } = await supabase
            .from('community_reports')
            .update({
                upvotes: newUpvotes,
                downvotes: newDownvotes,
                trust_score: newTrustScore,
            })
            .eq('id', parsed.data.reportId)
            .select('upvotes, downvotes, trust_score')
            .single()

        if (updateErr || !updatedReport) throw new Error('Failed to update vote')

        res.json({
            upvotes: updatedReport.upvotes,
            downvotes: updatedReport.downvotes,
            trustScore: updatedReport.trust_score,
        })
    } catch (error) {
        logger.error('Community vote error', { error })
        res.status(500).json({ error: 'Failed to vote' })
    }
})

export default router
