import winston from 'winston'
import { config } from '../config/index.js'

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
    ],
})

export default logger
