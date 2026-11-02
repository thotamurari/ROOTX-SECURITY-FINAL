import type { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger.js'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`
    logger.error('Unhandled error', { errorId, message: err.message, stack: err.stack })
    res.status(500).json({ error: 'Internal server error', errorId, message: err.message, stack: err.stack })
}

export function notFoundHandler(_req: Request, res: Response): void {
    res.status(404).json({ error: 'Route not found' })
}
