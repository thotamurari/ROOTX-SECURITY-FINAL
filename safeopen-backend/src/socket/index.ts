import { Server, type Socket } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import { verifyToken } from '../utils/jwt.js'
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

    // Auth middleware for Socket.io
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token
        if (!token) {
            return next(new Error('Authentication error'))
        }

        try {
            const payload = verifyToken(token)
                ; (socket as Socket & { userId?: string }).userId = payload.userId
            next()
        } catch {
            next(new Error('Invalid token'))
        }
    })

    io.on('connection', (socket) => {
        const userId = (socket as Socket & { userId?: string }).userId
        if (!userId) return

        // Join user's private room
        socket.join(`user:${userId}`)
        logger.info('Socket connected', { userId, socketId: socket.id })

        // Join global room for community alerts
        socket.join('global')

        // Handle tracker live subscription
        socket.on('tracker:subscribe', () => {
            socket.join(`tracker:${userId}`)
            logger.debug('Tracker subscribed', { userId })
        })

        // Handle scan room join
        socket.on('scan:subscribe', (data: { scanId: string }) => {
            socket.join(`scan:${data.scanId}`)
        })

        socket.on('disconnect', (reason) => {
            logger.info('Socket disconnected', { userId, reason })
        })

        // APK scan cancellation via WebSocket
        socket.on('apk:stop:scan' as any, (data: { jobId: string }) => {
            if (data?.jobId) {
                import('../services/scan/queues/apkScan.queue.js').then(m => m.cancelApkScanJob(data.jobId))
                logger.info('APK scan cancel requested via socket', { userId, jobId: data.jobId })
            }
        })

        socket.on('error', (error) => {
            logger.error('Socket error', { userId, error })
        })
    })

    logger.info('✅ Socket.io server initialized')
    return io
}

export function getIO(): Server {
    if (!io) throw new Error('Socket.io not initialized')
    return io
}
