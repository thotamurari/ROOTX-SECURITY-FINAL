// ═══════════════════════════════════════════════
// SafeOpen API Response Types
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
export type ThreatLevel = 'safe' | 'caution' | 'danger' | 'critical'
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
    communityMatches: number
}

export interface Indicator {
    name: string
    severity: Severity
    description: string
}

export interface AIAnalysis {
    summary: string
    confidence: number
    details?: string[]
    recommendation?: string
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

export interface BatteryEstimator {
    currentPercent: number
    capacity: number
    temperature: number
    drainRate: number
    scenarios: BatteryScenario[]
    tips: string[]
}
