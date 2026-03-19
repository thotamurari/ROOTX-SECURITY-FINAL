import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

// Request interceptor — attach JWT
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().accessToken
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor — handle errors
let isRefreshing = false
let failedQueue: Array<{
    resolve: (value: unknown) => void
    reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
        const status = error.response?.status

        // 401 — silent refresh
        if (status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return api(originalRequest)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const { data } = await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                )
                const newToken = data.accessToken
                localStorage.setItem('safeopen_token', newToken)
                useAuthStore.getState().setAccessToken(newToken)
                processQueue(null, newToken)
                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return api(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                localStorage.removeItem('safeopen_token')
                localStorage.removeItem('safeopen_user')
                useAuthStore.getState().logout()
                window.location.href = '/login'
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
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

        // 500 — server error
        if (status === 500) {
            const errorId = (error.response?.data as { errorId?: string })?.errorId || 'UNKNOWN'
            toast.error(`Server error (${errorId}). Please try again.`, {
                duration: 5000,
                icon: '🔴',
            })
        }

        return Promise.reject(error)
    }
)

export default api
