import { create } from 'zustand'
import type { ApkScanResult, RiskSummary } from '../types/apk.types'

interface ApkScanState {
    scanStatus: 'idle' | 'scanning' | 'complete' | 'error'
    currentAppName: string
    currentAppIndex: number
    totalApps: number
    progress: number
    scannedApps: ApkScanResult[]
    overallRiskSummary: RiskSummary
    jobId: string | null
    scanDuration: number

    // Actions
    startScan: (totalApps: number, jobId: string) => void
    updateProgress: (appName: string, progress: number, current: number, total: number) => void
    addResult: (result: ApkScanResult, summary: RiskSummary) => void
    completeScan: (summary: RiskSummary, duration: number) => void
    setError: (error: string) => void
    stopScan: () => void
    resetScan: () => void
}

const initialSummary: RiskSummary = {
    total: 0,
    safe: 0,
    caution: 0,
    risky: 0,
    critical: 0,
    totalRiskyPermissions: 0,
    highestRiskApp: '',
}

export const useApkScanStore = create<ApkScanState>((set) => ({
    scanStatus: 'idle',
    currentAppName: '',
    currentAppIndex: 0,
    totalApps: 0,
    progress: 0,
    scannedApps: [],
    overallRiskSummary: { ...initialSummary },
    jobId: null,
    scanDuration: 0,

    startScan: (totalApps, jobId) =>
        set({
            scanStatus: 'scanning',
            totalApps,
            jobId,
            currentAppIndex: 0,
            progress: 0,
            scannedApps: [],
            overallRiskSummary: { ...initialSummary },
            scanDuration: 0,
        }),

    updateProgress: (appName, progress, current, total) =>
        set({
            currentAppName: appName,
            progress,
            currentAppIndex: current,
            totalApps: total,
        }),

    addResult: (result, summary) =>
        set((state) => ({
            scannedApps: [...state.scannedApps, result],
            overallRiskSummary: summary,
        })),

    completeScan: (summary, duration) =>
        set({
            scanStatus: 'complete',
            overallRiskSummary: summary,
            progress: 100,
            scanDuration: duration,
        }),

    setError: () =>
        set({ scanStatus: 'error' }),

    stopScan: () =>
        set({ scanStatus: 'idle' }),

    resetScan: () =>
        set({
            scanStatus: 'idle',
            currentAppName: '',
            currentAppIndex: 0,
            totalApps: 0,
            progress: 0,
            scannedApps: [],
            overallRiskSummary: { ...initialSummary },
            jobId: null,
            scanDuration: 0,
        }),
}))
