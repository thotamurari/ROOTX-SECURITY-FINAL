import { useState, useCallback, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { scanAPI } from '@/services/api'
import { getSocket } from '@/services/socket'
import type { ScanResult, ScanProgressEvent } from '@/types/api'

export function useScan() {
    const [progress, setProgress] = useState(0)
    const [stage, setStage] = useState('')
    const [isScanning, setIsScanning] = useState(false)
    const [currentResult, setCurrentResult] = useState<ScanResult | null>(null)

    useEffect(() => {
        const socket = getSocket()

        const onProgress = (data: ScanProgressEvent) => {
            setProgress(data.progress)
            setStage(data.stage)
        }

        const onComplete = (data: { result: ScanResult }) => {
            setCurrentResult(data.result)
            setIsScanning(false)
            setProgress(100)
        }

        socket.on('scan:progress', onProgress)
        socket.on('scan:complete', onComplete)

        return () => {
            socket.off('scan:progress', onProgress)
            socket.off('scan:complete', onComplete)
        }
    }, [])

    const scanUrlMutation = useMutation({
        mutationFn: scanAPI.scanUrl,
        onMutate: () => {
            setIsScanning(true)
            setProgress(0)
            setCurrentResult(null)
        },
        onSuccess: (data) => {
            setCurrentResult(data)
            setIsScanning(false)
        },
        onError: () => {
            setIsScanning(false)
        },
    })

    const scanFileMutation = useMutation({
        mutationFn: scanAPI.scanFile,
        onMutate: () => {
            setIsScanning(true)
            setProgress(0)
            setCurrentResult(null)
        },
        onSuccess: (data) => {
            setCurrentResult(data)
            setIsScanning(false)
        },
        onError: () => {
            setIsScanning(false)
        },
    })

    const scanMessageMutation = useMutation({
        mutationFn: (message: string) => scanAPI.scanMessage({ message }),
        onMutate: () => {
            setIsScanning(true)
            setProgress(0)
            setCurrentResult(null)
        },
        onSuccess: (data) => {
            setCurrentResult(data)
            setIsScanning(false)
        },
        onError: () => {
            setIsScanning(false)
        },
    })

    const historyQuery = useQuery({
        queryKey: ['scan', 'history'],
        queryFn: () => scanAPI.getHistory(),
    })

    const resetScan = useCallback(() => {
        setProgress(0)
        setStage('')
        setIsScanning(false)
        setCurrentResult(null)
    }, [])

    return {
        progress,
        stage,
        isScanning,
        currentResult,
        scanUrl: scanUrlMutation.mutate,
        scanFile: scanFileMutation.mutate,
        scanMessage: scanMessageMutation.mutate,
        history: historyQuery.data,
        isLoadingHistory: historyQuery.isLoading,
        resetScan,
    }
}
