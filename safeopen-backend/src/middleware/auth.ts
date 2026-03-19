import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.js'
import logger from '../utils/logger.js'

export interface AuthRequest extends Request {
    userId?: string
    userPlan?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' })
            return
        }

        const token = authHeader.split(' ')[1]
        if (!token) {
            res.status(401).json({ error: 'Invalid token format' })
            return
        }

        const payload = verifyToken(token)
        req.userId = payload.userId
        req.userPlan = payload.plan
        next()
    } catch (error) {
        logger.warn('Auth failed', { error: (error as Error).message })
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}
