import fs from 'fs'
import path from 'path'
import winston from 'winston'
import { config } from '../config/index.js'

const logsDir = path.resolve(process.cwd(), 'logs')
try {
    fs.mkdirSync(logsDir, { recursive: true })
} catch {
    // Non-fatal — console transport still works if the dir can't be created.
}

const logger = winston.createLogger({
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'safeopen' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, service, ...rest }) => {
                    const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : ''
                    return `${timestamp} [${service}] ${level}: ${message}${extra}`
                })
            ),
        }),
        // Every logger.error(...) call — including every failed scan — is
        // persisted here so failures survive a restart and aren't lost when
        // the console scrolls away (e.g. when running under a process manager).
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
        }),
    ],
})

export default logger
