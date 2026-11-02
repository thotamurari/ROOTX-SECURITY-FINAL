import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import axiosRetry from 'axios-retry'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { getDeviceId } from '@/lib/deviceId'

// On Windows, browsers resolve `localhost` to IPv6 `::1`. A Node backend bound
// to IPv4 only would then be unreachable, so prefer the explicit IPv4 loopback
// `127.0.0.1` and normalize any `localhost` we were given to it.
function preferIpv4Loopback(url: string): string {
    return url.replace('://localhost', '://127.0.0.1')
}

const getHostCandidates = (): string[] => {
    const list: string[] = []
    if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        list.push(`http://${window.location.hostname}:3000`)
    }
    return list
}

const CANDIDATE_BACKEND_URLS = [
    ...getHostCandidates(),
    preferIpv4Loopback(import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000'),
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://10.0.2.2:3000',
]

function getInitialBaseUrl(): string {
    const saved = localStorage.getItem('rootx_backend_url')
    if (saved) return preferIpv4Loopback(saved)
    if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return `http://${window.location.hostname}:3000`
    }
    return preferIpv4Loopback(import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000')
}

let activeBaseUrl = getInitialBaseUrl()

const api = axios.create({
    baseURL: activeBaseUrl,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

// Auto-discovery: checks candidate backend URLs if current host is unreachable
let isDiscovering = false
export async function discoverWorkingBackend(): Promise<string | null> {
    if (isDiscovering) return null
    isDiscovering = true
    try {
        for (const candidate of CANDIDATE_BACKEND_URLS) {
            try {
                const res = await axios.get(`${candidate}/health`, { timeout: 2500 })
                if (res.status === 200 && res.data?.service === 'safeopen-api') {
                    activeBaseUrl = candidate
                    api.defaults.baseURL = candidate
                    localStorage.setItem('rootx_backend_url', candidate)
                    console.log('[RootX] Discovered active backend at:', candidate)
                    return candidate
                }
            } catch {
                // Try next candidate
            }
        }
    } finally {
        isDiscovering = false
    }
    return null
}

// Initial probe on startup
void discoverWorkingBackend()

// --- Network Optimization ---
axiosRetry(api, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response?.status || 0) >= 500
    }
})

// Request interceptor — attach Firebase JWT and ensure latest baseURL
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        config.baseURL = activeBaseUrl
        config.headers['X-Device-Id'] = getDeviceId()
        try {
            const currentUser = auth.currentUser
            if (currentUser) {
                const token = await currentUser.getIdToken()
                config.headers.Authorization = `Bearer ${token}`
            }
        } catch {
            // Token unavailable — proceed without token
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor — handle errors
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
        const status = error.response?.status

        // 401 — try refreshing the Firebase token
        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            try {
                const currentUser = auth.currentUser
                if (currentUser) {
                    // Force refresh the Firebase token
                    const newToken = await currentUser.getIdToken(true)
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return api(originalRequest)
                }
            } catch {
                // Refresh failed — sign out
                useAuthStore.getState().logout()
                window.location.href = '/login'
                return Promise.reject(error)
            }
        }

        // 401 that survived a refresh+retry — the session itself is invalid
        // (expired beyond refresh, or revoked from another device). Don't
        // leave the caller hanging on a rejected promise; redirect to login
        // the same way an outright auth failure does.
        if (status === 401 && originalRequest?._retry) {
            toast.error('Your session has expired. Please sign in again.', { icon: '🔒' })
            useAuthStore.getState().logout()
            window.location.href = '/login'
            return Promise.reject(error)
        }

        // 403 — upgrade plan
        if (status === 403) {
            const upgradeEvent = new CustomEvent('show-upgrade-modal')
            window.dispatchEvent(upgradeEvent)
        }

        // 429 — rate limited
        if (status === 429) {
            const retryAfter = error.response?.headers['retry-after']
            const seconds = retryAfter ? parseInt(retryAfter, 10) : 30
            toast.error(`Rate limited. Try again in ${seconds}s`, {
                duration: seconds * 1000,
                icon: '⏳',
            })
        }

        const data = error.response?.data as
            { error?: string; errorId?: string; message?: string; details?: unknown } | undefined
        // Prefer the backend's own specific message over a generic label.
        const serverMessage = data?.message || data?.error

        // 422 — validation error (e.g. invalid/malformed URL). The scan screen
        // handles its own inline message, so only toast when there's a clear one.
        if (status === 422) {
            toast.error(serverMessage || 'Invalid input — please check what you entered.', {
                duration: 5000, icon: '✋',
            })
        }

        // 503 — a backend dependency is not configured/available (e.g. server
        // auth not set up). This is a server-side setup issue, not a bad request.
        if (status === 503) {
            toast.error(serverMessage || 'This feature is temporarily unavailable (server not fully configured).', {
                duration: 6000, icon: '🛠️',
            })
        }

        // 500 — server error. Always surface the specific server message; only
        // fall back to an error id (never a bare "UNKNOWN") for support.
        if (status === 500) {
            const ref = data?.errorId ? ` (ref ${data.errorId})` : ''
            toast.error(`${serverMessage || 'The server hit an unexpected error.'}${ref}`, {
                duration: 6000, icon: '🔴',
            })
        }

        // Timeout — the request was aborted after the configured timeout.
        if (error.code === 'ECONNABORTED') {
            toast.error('The request timed out. The server may be busy — please try again.', {
                duration: 5000, icon: '⏱️',
            })
            return Promise.reject(error)
        }

        // Network error — try to find a working backend and retry once.
        if ((error.code === 'ERR_NETWORK' || !error.response) && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true
            const workingUrl = await discoverWorkingBackend()
            if (workingUrl && workingUrl !== originalRequest.baseURL) {
                originalRequest.baseURL = workingUrl
                return api(originalRequest)
            }
            // Discovery failed — tell the user plainly instead of failing silently.
            toast.error('Cannot reach the server. Check your connection and that the backend is running.', {
                duration: 6000, icon: '📡',
            })
        }

        return Promise.reject(error)
    }
)

export default api
