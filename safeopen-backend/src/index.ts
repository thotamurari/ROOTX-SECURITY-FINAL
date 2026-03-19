import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { config } from './config/index.js'
import { connectRedis } from './utils/redis.js'
import { initSocket } from './socket/index.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'
import logger from './utils/logger.js'

// Import routes
import authRoutes from './routes/auth.routes.js'
import scanRoutes from './routes/scan.routes.js'
import behaviorRoutes from './routes/behavior.routes.js'
import trackerRoutes from './routes/tracker.routes.js'
import communityRoutes from './routes/community.routes.js'

async function bootstrap() {
    const app = express()
    const server = http.createServer(app)

    // ─── Security ────────────────
    app.use(helmet({ crossOriginResourcePolicy: false }))
    const allowedOrigins = config.frontendUrl.split(',').map(u => u.trim())
    app.use(cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }))

    // ─── Rate Limiting ────────────────
    app.use(rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests, please try again later' },
    }))

    // ─── Parsers ────────────────
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser())

    // ─── Logging ────────────────
    app.use(morgan('short', {
        stream: { write: (msg: string) => logger.info(msg.trim()) },
    }))

    // ─── Health Check ────────────────
    app.get('/health', (_req, res) => {
        res.json({
            status: 'ok',
            service: 'safeopen-api',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        })
    })

    // ─── Mount Routes ────────────────
    app.use('/auth', authRoutes)
    app.use('/scan', scanRoutes)
    app.use('/behavior', behaviorRoutes)
    app.use('/tracker', trackerRoutes)
    app.use('/community', communityRoutes)

    // ─── Error Handling ────────────────
    app.use(notFoundHandler)
    app.use(errorHandler)

    // ─── Connect Services ────────────────
    await connectRedis()

    // ─── Socket.io ────────────────
    initSocket(server)

    // ─── Start Server ────────────────
    server.listen(config.port, () => {
        logger.info(`🚀 SafeOpen API running on port ${config.port}`)
        logger.info(`📡 WebSocket server ready`)
        logger.info(`🔗 Frontend: ${config.frontendUrl}`)
        logger.info(`🌍 Environment: ${config.nodeEnv}`)
    })

    // ─── Graceful Shutdown ────────────────
    const shutdown = async () => {
        logger.info('Shutting down...')
        server.close()
        process.exit(0)
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
}

bootstrap().catch((error) => {
    logger.error('Failed to start server', { error })
    process.exit(1)
})
