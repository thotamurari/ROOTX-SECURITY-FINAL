import { Server, type Socket } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import { verifyToken } from '../utils/jwt.js'
import { verifyFirebaseToken, isFirebaseAdminConfigured } from '../utils/firebaseAdmin.js'
import { config } from '../config/index.js'
import logger from '../utils/logger.js'

let io: Server

export function initSocket(httpServer: HTTPServer): Server {
    const allowedOrigins = config.frontendUrl.split(',').map(u => u.trim())
    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    })

    // Auth middleware for Socket.io (Supports Firebase token, local token, and explicit userId)
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token
        const explicitUserId = socket.handshake.auth?.userId

        if (token) {
            try {
                if (isFirebaseAdminConfigured) {
                    const fbUser = await verifyFirebaseToken(token)
                    ;(socket as Socket & { userId?: string }).userId = fbUser.uid
                }
            } catch {
                try {
                    const payload = verifyToken(token)
                    ;(socket as Socket & { userId?: string }).userId = payload.userId
                } catch {
                    // Fall back to explicit userId if provided
                }
            }
        }

        if (!(socket as any).userId && explicitUserId) {
            ;(socket as Socket & { userId?: string }).userId = String(explicitUserId)
        }

        next()
    })

    io.on('connection', (socket) => {
        const userId = (socket as Socket & { userId?: string }).userId
        if (userId) {
            socket.join(`user:${userId}`)
            socket.join(`tracker:${userId}`)
        }

        // Join global room for real-time cross-device scan sync
        socket.join('global')
        logger.info('Socket connected', { userId: userId || 'guest', socketId: socket.id })

        // Handle tracker live subscription
        socket.on('tracker:subscribe', () => {
            if (userId) socket.join(`tracker:${userId}`)
        })

        // Handle scan room join
        socket.on('scan:subscribe', (data: { scanId: string }) => {
            if (data?.scanId) socket.join(`scan:${data.scanId}`)
        })

        socket.on('disconnect', (reason) => {
            logger.info('Socket disconnected', { userId: userId || 'guest', reason })
        })

        // APK scan cancellation via WebSocket
        socket.on('apk:stop:scan' as any, (data: { jobId: string }) => {
            if (data?.jobId) {
                import('../services/scan/queues/apkScan.queue.js').then(m => m.cancelApkScanJob(data.jobId))
                logger.info('APK scan cancel requested via socket', { userId: userId || 'guest', jobId: data.jobId })
            }
        })

        socket.on('error', (error) => {
            logger.error('Socket error', { userId: userId || 'guest', error })
        })
    })

    logger.info('✅ Socket.io server initialized')
    return io
}

export function getIO(): Server | null {
    return io || null
}
