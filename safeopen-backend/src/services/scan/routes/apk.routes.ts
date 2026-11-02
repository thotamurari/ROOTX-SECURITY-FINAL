import { Router, type Response } from 'express'
import crypto from 'crypto'
import { authMiddleware, type AuthRequest } from '../../../middleware/auth.js'
import { startApkScanJob, cancelApkScanJob } from '../queues/apkScan.queue.js'
import logger from '../../../utils/logger.js'

const router = Router()
router.use(authMiddleware)

function sendApkError(res: Response, label: string, error: unknown, context: Record<string, unknown>) {
    const errorId = `ERR-APK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex')}`
    const message = error instanceof Error ? error.message : String(error)
    logger.error(label, { errorId, message, stack: error instanceof Error ? error.stack : undefined, ...context })
    res.status(500).json({ error: label, errorId, message })
}

// ─── POST /scan/apk/all — Start full APK scan ────────────────
router.post('/all', async (req: AuthRequest, res: Response) => {
    try {
        const socketId = req.body.socketId
        if (!socketId) {
            res.status(400).json({ error: 'socketId is required' })
            return
        }

        const { jobId, totalApps } = await startApkScanJob(req.userId!, socketId)

        logger.info('APK scan started', { userId: req.userId, jobId, totalApps })
        res.json({ jobId, totalApps, status: 'started' })
    } catch (error) {
        sendApkError(res, 'Failed to start APK scan', error, { userId: req.userId })
    }
})

// ─── POST /scan/apk/stop — Cancel a running scan ────────────────
router.post('/stop', async (req: AuthRequest, res: Response) => {
    try {
        const { jobId } = req.body
        if (!jobId) {
            res.status(400).json({ error: 'jobId is required' })
            return
        }

        cancelApkScanJob(jobId)
        res.json({ success: true, message: 'Scan cancellation requested' })
    } catch (error) {
        sendApkError(res, 'Failed to stop scan', error, { userId: req.userId, jobId: req.body?.jobId })
    }
})

export default router
