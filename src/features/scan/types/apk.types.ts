export interface ApkScanResult {
    id: string
    appName: string
    packageName: string
    version: string
    apkSize: number
    riskScore: number
    riskLevel: 'safe' | 'caution' | 'risky' | 'critical'
    virusTotalResult: {
        malicious: number
        suspicious: number
        clean: number
        total: number
    } | null
    permissions: string[]
    dangerousPermissions: string[]
    permissionRiskScore: number
    backgroundActivity: 'none' | 'low' | 'medium' | 'high' | 'always'
    lastUsed: string
    installDate: string
    aiAnalysis: {
        summary: string
        threats: string[]
        suspiciousPatterns: string[]
        recommendation: string
        confidence: number
    }
    scannedAt: string
    scanDuration?: number
}

export interface RiskSummary {
    total: number
    safe: number
    caution: number
    risky: number
    critical: number
    totalRiskyPermissions: number
    highestRiskApp: string
}

export interface MockApp {
    name: string
    packageName: string
    category: string
    version: string
    size: number
    backgroundActivity: string
    lastUsed: string
    installDate: string
    permissions: string[]
}

export interface ApkScanProgress {
    appName: string
    progress: number
    current: number
    total: number
}

export interface ApkScanResultEvent {
    result: ApkScanResult
    summary: RiskSummary
}

export interface ApkScanCompleteEvent {
    summary: RiskSummary
    totalScanned: number
    duration: number
}
