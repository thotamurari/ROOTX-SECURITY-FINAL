// ═══════════════════════════════════════════════
// RootX-Security API Response Types
// ═══════════════════════════════════════════════

// Auth
export interface AuthResponse {
    accessToken: string
    user: UserProfile
}

export interface UserProfile {
    id: string
    email: string
    plan: 'free' | 'pro' | 'enterprise'
    createdAt: string
}

// Scan
export type ScanType = 'url' | 'file' | 'message' | 'apk'
export type ThreatLevel = 'safe' | 'unverified' | 'caution' | 'danger' | 'critical'
export type VerificationTier = 'verified_safe' | 'unverified' | 'high_risk'
export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface ScanResult {
    id: string
    scanType: ScanType
    input: string
    inputHash: string
    riskScore: number
    threatLevel: ThreatLevel
    threatType: string | null
    indicators: Indicator[]
    recommendations: string[]
    scannedAt: string
    scanDuration: number
    aiAnalysis: AIAnalysis | null
    communityMatches?: number
    userId?: string
    verificationTier?: VerificationTier
    analysisMethod?: 'local_heuristic' | 'backend_multi_engine'
}

export interface Indicator {
    name: string
    severity: Severity
    description: string
    type?: string
}

export type ThreatIndicator = Indicator

export type VendorCategory = 'malicious' | 'suspicious' | 'clean' | 'undetected'

export interface VendorResult {
    engine: string
    category: VendorCategory
    result: string
}

export interface DetectionStats {
    malicious: number
    suspicious: number
    clean: number
    undetected: number
    total: number
}

export interface ToolsBreakdown {
    virusTotal: {
        name: string
        status: 'safe' | 'suspicious' | 'malicious' | 'unknown'
        maliciousCount: number
        suspiciousCount: number
        cleanCount: number
        totalVendors: number
        verdict: string
    }
    urlScan: {
        name: string
        status: 'safe' | 'suspicious' | 'malicious'
        score: number
        domain: string
        ip: string | null
        country: string | null
        server: string | null
        pageTitle: string | null
        asn: string | null
        screenshot: string | null
        url: string
        verdict: string
    }
    googleSafeBrowsing: {
        name?: string
        status: 'safe' | 'malicious'
        isSafe: boolean
        threatType: string | null
        verdict: string
    }
    sucuri: {
        status: 'safe' | 'warning' | 'malicious'
        isSafe: boolean
        blacklisted: boolean
        malwareFound: boolean
        webServer: string | null
        cdn: string | null
        certIssuer: string | null
        securityRecommendations: string[]
        verdict: string
    }
}

export interface SourceConsulted {
    name: string
    status: 'clean' | 'flagged' | 'unavailable' | 'unknown'
    detail: string
}

export interface AIAnalysis {
    summary: string
    confidence: number
    details?: string[]
    recommendation?: string
    detectionStats?: DetectionStats | null
    vendors?: VendorResult[]
    toolsBreakdown?: ToolsBreakdown
    resolvedIp?: string | null
    domain?: string
    scannedAtUtc?: string
    sourcesConsulted?: SourceConsulted[]
}

// Behavioral DNA
export interface BehaviorProfile {
    userId: string
    baseline: BehaviorMetrics
    today: BehaviorMetrics
    anomalyScore: number
    lastUpdated: string
}

export interface BehaviorMetrics {
    appUsage: number
    locationVariance: number
    networkActivity: number
    timePattern: number
    permissionUsage: number
    contactAccess: number
    cameraUsage: number
    paymentActivity: number
}

export interface BehaviorAnomaly {
    id: string
    type: string
    severity: Severity
    timestamp: string
    description: string
    score: number
}

export interface BehaviorEvent {
    id: string
    type: string
    description: string
    timestamp: string
    riskLevel: Severity
}

// Tracker Map
export interface TrackerConnection {
    id: string
    appName: string
    appIcon: string
    destinationIp: string
    country: string
    countryCode: string
    latitude: number
    longitude: number
    dataType: string
    isFlagged: boolean
    isBlocked: boolean
    riskScore: number
    connectedAt: string
}

// Community
export interface CommunityReport {
    id: string
    inputHash: string
    threatType: string
    severity: Severity
    reportedBy: number
    upvotes: number
    downvotes: number
    trustScore: number
    verified: boolean
    createdAt: string
}

export interface TrustScore {
    hash: string
    trustScore: number
    totalReports: number
    verified: boolean
}

// API Request Types
export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    email: string
    password: string
    confirmPassword: string
    deviceFingerprint?: string
}

export interface ScanUrlRequest {
    url: string
}

// Device sessions ("Active Devices")
export interface DeviceSession {
    id: string
    deviceId: string
    deviceName: string
    platform: 'web' | 'android' | 'ios'
    createdAt: string
    lastSeenAt: string
    current: boolean
}

export interface ScanMessageRequest {
    message: string
}

export interface CommunityReportRequest {
    inputHash: string
    threatType: string
    severity: Severity
    description: string
}

export interface VoteRequest {
    reportId: string
    vote: 'up' | 'down'
}

export interface BlockRequest {
    connectionId: string
    blocked: boolean
}

// Paginated Response
export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
    hasMore: boolean
}

// WebSocket Event Types
export interface ScanProgressEvent {
    scanId: string
    progress: number
    stage: string
}

export interface ScanCompleteEvent {
    result: ScanResult
}

export interface ThreatDetectedEvent {
    id: string
    type: string
    severity: Severity
    message: string
    timestamp: string
}

export interface BehaviorAnomalyEvent {
    anomaly: BehaviorAnomaly
}

export interface TrackerNewConnectionEvent {
    connection: TrackerConnection
}

// AndroidSEC Telemetry
export interface InstalledApp {
    id: string
    name: string
    category: string
    storageUsed: number
    cacheSize: number
    dataSize: number
    apkSize: number
    safetyStatus: 'safe' | 'caution' | 'risky' | 'unknown'
    safetyReason: string
    lastUsed: string
    installDate: string
    version: string
    permissions: number
    dangerousPermissions: number
    isSystemApp?: boolean
    // Trust signals driving risk classification (see riskClassification.ts)
    packageName?: string
    installSource?: 'play_store' | 'preinstalled' | 'sideloaded' | 'unknown'
    signatureVerified?: boolean
    knownThreat?: boolean
    trustLevel?: 'trusted' | 'untrusted'
    signals?: string[]
}

export interface BatteryScenario {
    label: string
    icon: string
    drainPerHour: number
    hoursRemaining: number
    minutesRemaining: number
    shutdownTime: string
    shutdownDate: string
    status: 'great' | 'good' | 'low' | 'critical'
}

export type BatteryHealthGrade = 'excellent' | 'good' | 'fair' | 'degraded' | 'poor'

export interface BatteryEstimator {
    currentPercent: number
    capacity: number
    temperature: number
    drainRate: number
    health?: string
    voltage?: number
    isCharging?: boolean
    plugged?: boolean
    chargingTime?: number
    dischargingTime?: number
    scenarios: BatteryScenario[]
    tips: string[]
    healthGrade?: BatteryHealthGrade
    healthSummary?: string
    alerts?: string[]
}
