import { useState, useCallback } from 'react'
import { scanAPI } from '@/services/api'
import {
    performClientUrlScan,
    performClientFileScan,
    performClientMessageScan,
} from '@/services/fallbackScanner'
import type { ScanResult } from '@/types/api'
import { useScanHistoryStore } from '@/stores/scanHistoryStore'

const SCAN_STAGES = [
    'Initializing analysis engine...',
    'Analyzing URL structure and patterns...',
    'Checking security indicators...',
    'Evaluating risk signals...',
    'Compiling analysis report...',
    'Scan Complete',
]

export function useScan() {
    const [progress, setProgress] = useState(0)
    const [stage, setStage] = useState('')
    const [isScanning, setIsScanning] = useState(false)
    const [currentResult, setCurrentResult] = useState<ScanResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Simulate smooth progress animation while scan runs
    const simulateProgress = useCallback(() => {
        let step = 0
        const interval = setInterval(() => {
            step++
            if (step <= 5) {
                const progressVal = Math.min(step * 18, 90)
                setProgress(progressVal)
                setStage(SCAN_STAGES[Math.min(step - 1, SCAN_STAGES.length - 1)]!)
            }
        }, 600)
        return () => clearInterval(interval)
    }, [])

    const scanUrl = useCallback(async (data: { url: string }) => {
        setIsScanning(true)
        setProgress(5)
        setStage(SCAN_STAGES[0]!)
        setCurrentResult(null)
        setError(null)

        const stopProgress = simulateProgress()

        try {
            let result: ScanResult
            try {
                result = await scanAPI.scanUrl(data)
            } catch (err: any) {
                // If backend is unreachable or returning network/server error, fallback seamlessly to client intelligence
                if (err?.code === 'ERR_NETWORK' || !err?.response || err?.response?.status >= 500) {
                    result = await performClientUrlScan(data.url)
                } else {
                    throw err
                }
            }
            stopProgress()
            setProgress(100)
            setStage('Scan Complete')
            await new Promise(r => setTimeout(r, 450))
            setCurrentResult(result)
            useScanHistoryStore.getState().addScan(result)
        } catch (err: any) {
            stopProgress()
            setError(describeScanError(err))
        } finally {
            setIsScanning(false)
        }
    }, [simulateProgress])

    const scanFile = useCallback(async (file: File) => {
        setIsScanning(true)
        setProgress(5)
        setStage('Reading file...')
        setCurrentResult(null)
        setError(null)

        const stopProgress = simulateProgress()

        try {
            let result: ScanResult
            try {
                result = await scanAPI.scanFile(file)
            } catch (err: any) {
                if (err?.code === 'ERR_NETWORK' || !err?.response || err?.response?.status >= 500) {
                    result = performClientFileScan(file)
                } else {
                    throw err
                }
            }
            stopProgress()
            setProgress(100)
            setStage('Scan Complete')
            await new Promise(r => setTimeout(r, 450))
            setCurrentResult(result)
            useScanHistoryStore.getState().addScan(result)
        } catch (err: any) {
            stopProgress()
            setError(describeScanError(err))
        } finally {
            setIsScanning(false)
        }
    }, [simulateProgress])

    const scanMessage = useCallback(async (message: string) => {
        setIsScanning(true)
        setProgress(5)
        setStage('Analyzing text patterns...')
        setCurrentResult(null)
        setError(null)

        const stopProgress = simulateProgress()

        try {
            let result: ScanResult
            try {
                result = await scanAPI.scanMessage({ message })
            } catch (err: any) {
                if (err?.code === 'ERR_NETWORK' || !err?.response || err?.response?.status >= 500) {
                    result = performClientMessageScan(message)
                } else {
                    throw err
                }
            }
            stopProgress()
            setProgress(100)
            setStage('Scan Complete')
            await new Promise(r => setTimeout(r, 450))
            setCurrentResult(result)
            useScanHistoryStore.getState().addScan(result)
        } catch (err: any) {
            stopProgress()
            setError(describeScanError(err))
        } finally {
            setIsScanning(false)
        }
    }, [simulateProgress])

    const resetScan = useCallback(() => {
        setProgress(0)
        setStage('')
        setIsScanning(false)
        setCurrentResult(null)
        setError(null)
    }, [])

    return {
        progress,
        stage,
        isScanning,
        currentResult,
        error,
        scanUrl,
        scanFile,
        scanMessage,
        resetScan,
    }
}

function describeScanError(err: any): string {
    const status = err?.response?.status
    const serverMsg = err?.response?.data?.error || err?.response?.data?.message

    if (status === 429) return 'Too many scans in a short time. Wait a moment and try again.'
    if (status === 422) return 'That doesn’t look like a valid URL. Include https:// and a full domain.'
    return serverMsg || 'Scan failed. Please try again.'
}
