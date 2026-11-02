import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import { config } from './config/index.js'
import { initSocket } from './socket/index.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'
import logger from './utils/logger.js'

// Import routes
import authRoutes from './routes/auth.routes.js'
import scanRoutes from './routes/scan.routes.js'
import behaviorRoutes from './routes/behavior.routes.js'
import trackerRoutes from './routes/tracker.routes.js'
import rootxAiRoutes from './routes/rootx-ai.routes.js'
import deviceRoutes from './routes/device.routes.js'
import newsRoutes from './routes/news.routes.js'

async function bootstrap() {
    const app = express()
    const server = http.createServer(app)

    // ─── Optimization ────────────────
    app.use(compression())

    // ─── Security & CORS ────────────────
    app.use(helmet({ crossOriginResourcePolicy: false }))
    const configuredOrigins = config.frontendUrl.split(',').map(u => u.trim())
    const defaultOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost',
        'https://localhost',
        'capacitor://localhost',
        'ionic://localhost',
        'http://10.183.49.135:5173',
        'http://10.183.49.135:3000',
    ]
    const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]))

    app.use(cors({
        origin: (origin, callback) => {
            // Allow mobile apps, curl, Capacitor, and listed origins
            if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('https://localhost') || origin.startsWith('capacitor://') || origin.includes('192.168.') || origin.includes('10.')) {
                callback(null, true)
            } else {
                callback(null, true) // Permissive in development
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Device-Id'],
    }))

    // ─── Rate Limiting ────────────────
    app.use(rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 300,
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

    // ─── Mount Routes (Support both /api and standard prefixes) ───
    app.use('/auth', authRoutes)
    app.use('/api/auth', authRoutes)
    app.use('/scan', scanRoutes)
    app.use('/api/scan', scanRoutes)
    app.use('/behavior', behaviorRoutes)
    app.use('/api/behavior', behaviorRoutes)
    app.use('/tracker', trackerRoutes)
    app.use('/api/tracker', trackerRoutes)
    app.use('/rootx-ai', rootxAiRoutes)
    app.use('/api/rootx-ai', rootxAiRoutes)
    app.use('/device', deviceRoutes)
    app.use('/api/device', deviceRoutes)
    app.use('/news', newsRoutes)
    app.use('/api/news', newsRoutes)

    // ─── Error Handling ────────────────
    app.use(notFoundHandler)
    app.use(errorHandler)

    // ─── Socket.io ────────────────
    initSocket(server)

    // ─── Start Server ────────────────
    // Omit the host so Node binds the unspecified IPv6 address (::) with
    // dual-stack enabled — this accepts BOTH IPv4 (127.0.0.1, phone via
    // `adb reverse`) and IPv6 (::1, which is what Windows browsers resolve
    // `localhost` to). Binding '0.0.0.0' was IPv4-only, so browsers hitting
    // [::1]:3000 got connection-refused ("cannot reach the server").
    server.listen(config.port, () => {
        logger.info(`🚀 SafeOpen API running on port ${config.port} (dual-stack IPv4 + IPv6)`)
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
