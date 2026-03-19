import api from './axios'
import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    ScanResult,
    ScanUrlRequest,
    ScanMessageRequest,
    BehaviorProfile,
    BehaviorAnomaly,
    BehaviorEvent,
    TrackerConnection,
    CommunityReport,
    TrustScore,
    CommunityReportRequest,
    VoteRequest,
    BlockRequest,
    PaginatedResponse,
    UserProfile,
} from '@/types/api'

// ═══════════════ AUTH ═══════════════
export const authAPI = {
    login: (data: LoginRequest) =>
        api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

    register: (data: RegisterRequest) =>
        api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

    refresh: () =>
        api.post<AuthResponse>('/auth/refresh').then((r) => r.data),

    logout: () =>
        api.post('/auth/logout').then((r) => r.data),

    getMe: () =>
        api.get<UserProfile>('/auth/me').then((r) => r.data),
}

// ═══════════════ SCAN ═══════════════
export const scanAPI = {
    scanUrl: (data: ScanUrlRequest) =>
        api.post<ScanResult>('/scan/url', data).then((r) => r.data),

    scanFile: (file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post<ScanResult>('/scan/file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((r) => r.data)
    },

    scanMessage: (data: ScanMessageRequest) =>
        api.post<ScanResult>('/scan/message', data).then((r) => r.data),

    getHistory: (page = 1, limit = 20) =>
        api.get<PaginatedResponse<ScanResult>>('/scan/history', {
            params: { page, limit },
        }).then((r) => r.data),

    getResult: (id: string) =>
        api.get<ScanResult>(`/scan/result/${id}`).then((r) => r.data),
}

// ═══════════════ BEHAVIORAL DNA ═══════════════
export const behaviorAPI = {
    logEvent: (event: { type: string; data: Record<string, unknown> }) =>
        api.post('/behavior/log', event).then((r) => r.data),

    getProfile: () =>
        api.get<BehaviorProfile>('/behavior/profile').then((r) => r.data),

    getAnomalies: () =>
        api.get<BehaviorAnomaly[]>('/behavior/anomalies').then((r) => r.data),

    getReport: () =>
        api.get<BehaviorEvent[]>('/behavior/report').then((r) => r.data),
}

// ═══════════════ TRACKER MAP ═══════════════
export const trackerAPI = {
    getConnections: () =>
        api.get<TrackerConnection[]>('/tracker/connections').then((r) => r.data),

    getHistory: () =>
        api.get<TrackerConnection[]>('/tracker/history').then((r) => r.data),

    toggleBlock: (data: BlockRequest) =>
        api.post('/tracker/block', data).then((r) => r.data),
}

// ═══════════════ COMMUNITY ═══════════════
export const communityAPI = {
    submitReport: (data: CommunityReportRequest) =>
        api.post<CommunityReport>('/community/report', data).then((r) => r.data),

    getTrustScore: (hash: string) =>
        api.get<TrustScore>(`/community/trust/${hash}`).then((r) => r.data),

    getFeed: (page = 1, limit = 20) =>
        api.get<PaginatedResponse<CommunityReport>>('/community/feed', {
            params: { page, limit },
        }).then((r) => r.data),

    vote: (data: VoteRequest) =>
        api.post('/community/vote', data).then((r) => r.data),
}
