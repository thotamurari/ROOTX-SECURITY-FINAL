import { useEffect, useCallback } from 'react'
import { getSocket } from '@/services/socket'
import { useApkScanStore } from '../store/apkScanStore'
import api from '@/services/axios'
import type { ApkScanProgress, ApkScanResultEvent, ApkScanCompleteEvent } from '../types/apk.types'

export function useApkScanner() {
    const store = useApkScanStore()

    // Subscribe to WebSocket events
    useEffect(() => {
        const socket = getSocket()

        const onProgress = (data: ApkScanProgress) => {
            store.updateProgress(data.appName, data.progress, data.current, data.total)
        }

        const onResult = (data: ApkScanResultEvent) => {
            store.addResult(data.result, data.summary)
        }

        const onComplete = (data: ApkScanCompleteEvent) => {
            store.completeScan(data.summary, data.duration)
        }

        const onError = (data: { error: string }) => {
            store.setError(data.error)
        }

        socket.on('apk:scan:progress' as any, onProgress)
        socket.on('apk:scan:result' as any, onResult)
        socket.on('apk:scan:complete' as any, onComplete)
        socket.on('apk:scan:error' as any, onError)

        return () => {
            socket.off('apk:scan:progress' as any, onProgress)
            socket.off('apk:scan:result' as any, onResult)
            socket.off('apk:scan:complete' as any, onComplete)
            socket.off('apk:scan:error' as any, onError)
        }
    }, [store])

    const startScan = useCallback(async () => {
        try {
            const socket = getSocket()
            const res = await api.post('/scan/apk/all', { socketId: socket.id })
            store.startScan(res.data.totalApps, res.data.jobId)
        } catch {
            store.setError('Failed to start scan')
        }
    }, [store])

    const stopScan = useCallback(async () => {
        try {
            if (store.jobId) {
                const socket = getSocket()
                socket.emit('apk:stop:scan' as any, { jobId: store.jobId })
            }
            store.stopScan()
        } catch {
            // ignore
        }
    }, [store])

    return {
        ...store,
        startScan,
        stopScan,
    }
}
