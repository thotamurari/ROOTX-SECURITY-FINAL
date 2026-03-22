import { Router, type Response } from 'express'
import { authMiddleware, type AuthRequest } from '../../../middleware/auth.js'
import { startApkScanJob, cancelApkScanJob } from '../queues/apkScan.queue.js'
import logger from '../../../utils/logger.js'

const router = Router()
router.use(authMiddleware)

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
        logger.error('APK scan start error', { error })
        res.status(500).json({ error: 'Failed to start APK scan' })
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
        logger.error('APK scan stop error', { error })
        res.status(500).json({ error: 'Failed to stop scan' })
    }
})

export default router
