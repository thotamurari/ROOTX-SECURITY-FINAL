import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/axios'
import axios from 'axios'

// Lazy-loaded pages
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const ScanEngine = lazy(() => import('@/pages/ScanEngine'))
const BehavioralDNA = lazy(() => import('@/pages/BehavioralDNA'))
const TrackerMap = lazy(() => import('@/pages/TrackerMap'))
const SocialShield = lazy(() => import('@/pages/SocialShield'))
const AndroidSEC = lazy(() => import('@/pages/AndroidSEC'))
const Community = lazy(() => import('@/pages/Community'))
const Settings = lazy(() => import('@/pages/Settings'))

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." />}>
            {children}
        </Suspense>
    )
}

export default function App() {
    const { isAuthenticated, isLoading, setLoading, setUser, setAccessToken, logout } = useAuthStore()

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('safeopen_token')
            const storedUserStr = localStorage.getItem('safeopen_user')

            if (storedToken && storedUserStr) {
                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
                    const response = await api.get('/auth/me')
                    setUser(response.data)
                    setAccessToken(storedToken)
                    setLoading(false)
                } catch (err) {
                    try {
                        const refresh = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {}, { withCredentials: true })
                        const newToken = refresh.data.accessToken
                        localStorage.setItem('safeopen_token', newToken)
                        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
                        setUser(JSON.parse(storedUserStr))
                        setAccessToken(newToken)
                        setLoading(false)
                    } catch {
                        localStorage.removeItem('safeopen_token')
                        localStorage.removeItem('safeopen_user')
                        logout()
                        setLoading(false)
                    }
                }
            } else {
                setLoading(false)
            }
        }
        initAuth()
    }, [logout, setAccessToken, setLoading, setUser])

    if (isLoading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-[#060608]"><LoadingSpinner size="lg" text="Authenticating..." /></div>
    }

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Routes>
                        {/* Auth routes */}
                        <Route
                            path="/login"
                            element={
                                <SuspenseWrapper>
                                    <Login />
                                </SuspenseWrapper>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <SuspenseWrapper>
                                    <Register />
                                </SuspenseWrapper>
                            }
                        />

                        {/* Protected routes */}
                        <Route
                            element={
                                <ProtectedRoute>
                                    <AppShell />
                                </ProtectedRoute>
                            }
                        >
                            <Route
                                path="/dashboard"
                                element={
                                    <SuspenseWrapper>
                                        <Dashboard />
                                    </SuspenseWrapper>
                                }
                            />
                            <Route
                                path="/scan"
                                element={
                                    <SuspenseWrapper>
                                        <ScanEngine />
                                    </SuspenseWrapper>
                                }
                            />
                            <Route
                                path="/behavioral-dna"
                                element={
                                    <SuspenseWrapper>
                                        <BehavioralDNA />
                                    </SuspenseWrapper>
                                }
                            />
                            <Route
                                path="/tracker-map"
                                element={
                                    <SuspenseWrapper>
                                        <TrackerMap />
                                    </SuspenseWrapper>
                                }
                            />
                            <Route
                                path="/social-shield"
                                element={
                                    <SuspenseWrapper>
                                        <SocialShield />
                                    </SuspenseWrapper>
                                }
                            />
                            <Route
                                path="/android-sec"
                                element={
                                    <SuspenseWrapper>
                                        <AndroidSEC />
                                    </SuspenseWrapper>
                                }
                            />
                            <Route
                                path="/community"
                                element={
                                    <SuspenseWrapper>
                                        <Community />
                                    </SuspenseWrapper>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <SuspenseWrapper>
                                        <Settings />
                                    </SuspenseWrapper>
                                }
                            />
                        </Route>

                        {/* Default redirect */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </BrowserRouter>

                {/* Global overlays */}
                <UpgradeModal />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#13131F',
                            color: '#F0F0FF',
                            border: '1px solid #2A2A40',
                            borderRadius: '12px',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '14px',
                        },
                    }}
                />
            </QueryClientProvider>
        </ErrorBoundary>
    )
}
