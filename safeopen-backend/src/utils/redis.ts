import Redis from 'ioredis'
import { config } from '../config/index.js'
import logger from './logger.js'

let redis: Redis | null = null

export function getRedis(): Redis {
    if (!redis) {
        redis = new Redis(config.redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 200, 5000)
                return delay
            },
            lazyConnect: true,
        })

        redis.on('connect', () => logger.info('✅ Redis connected'))
        redis.on('error', (err) => logger.error('Redis error', { error: err.message }))
    }
    return redis
}

export async function connectRedis(): Promise<void> {
    try {
        const r = getRedis()
        await r.connect()
    } catch (error) {
        logger.warn('⚠️ Redis connection failed, running without cache', { error: (error as Error).message })
    }
}
