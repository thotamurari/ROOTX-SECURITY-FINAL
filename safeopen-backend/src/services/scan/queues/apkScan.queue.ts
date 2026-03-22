import crypto from 'crypto'
import { getIO } from '../../../socket/index.js'
import { scanSingleApk } from '../pipelines/apk.pipeline.js'
import { MOCK_APP_LIST } from '../data/mockApps.js'
import logger from '../../../utils/logger.js'

interface RiskSummary {
    total: number
    safe: number
    caution: number
    risky: number
    critical: number
    totalRiskyPermissions: number
    highestRiskApp: string
}

// In-memory job tracking (production would use Redis/BullMQ)
const activeJobs = new Map<string, { cancelled: boolean }>()

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function calculateSummary(results: any[]): RiskSummary {
    const summary: RiskSummary = {
        total: results.length,
        safe: 0,
        caution: 0,
        risky: 0,
        critical: 0,
        totalRiskyPermissions: 0,
        highestRiskApp: '',
    }

    let maxRisk = 0
    for (const r of results) {
        if (r.riskLevel === 'safe') summary.safe++
        else if (r.riskLevel === 'caution') summary.caution++
        else if (r.riskLevel === 'risky') summary.risky++
        else if (r.riskLevel === 'critical') summary.critical++

        summary.totalRiskyPermissions += r.dangerousPermissions.length
        if (r.riskScore > maxRisk) {
            maxRisk = r.riskScore
            summary.highestRiskApp = r.appName
        }
    }

    return summary
}

export async function startApkScanJob(userId: string, socketId: string): Promise<{ jobId: string; totalApps: number }> {
    const jobId = crypto.randomBytes(8).toString('hex')
    const io = getIO()
    const apps = MOCK_APP_LIST

    activeJobs.set(jobId, { cancelled: false })

    // Run scan asynchronously
    ;(async () => {
        const startTime = Date.now()
        const results: any[] = []

        for (let i = 0; i < apps.length; i++) {
            const job = activeJobs.get(jobId)
            if (!job || job.cancelled) {
                logger.info('APK scan cancelled', { jobId, scannedSoFar: i })
                break
            }

            const app = apps[i]

            // Emit progress
            io.to(socketId).emit('apk:scan:progress' as any, {
                appName: app.name,
                progress: Math.round(((i) / apps.length) * 100),
                current: i + 1,
                total: apps.length,
            })

            // Scan this app
            try {
                const result = await scanSingleApk(app)
                results.push(result)

                // Emit result + running summary
                io.to(socketId).emit('apk:scan:result' as any, {
                    result,
                    summary: calculateSummary(results),
                })
            } catch (err) {
                logger.error('APK scan error for app', { app: app.name, error: err })
                io.to(socketId).emit('apk:scan:error' as any, {
                    error: `Failed to scan ${app.name}`,
                    appName: app.name,
                })
            }

            // Rate limit delay between apps
            await delay(600)
        }

        // Emit completion
        const duration = Date.now() - startTime
        io.to(socketId).emit('apk:scan:complete' as any, {
            summary: calculateSummary(results),
            totalScanned: results.length,
            duration,
        })

        activeJobs.delete(jobId)
        logger.info('APK scan complete', { jobId, totalScanned: results.length, duration })
    })()

    return { jobId, totalApps: apps.length }
}

export function cancelApkScanJob(jobId: string) {
    const job = activeJobs.get(jobId)
    if (job) {
        job.cancelled = true
    }
}
