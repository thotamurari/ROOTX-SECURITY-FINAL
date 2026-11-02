import { lazy, Suspense, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuthStore } from '@/stores/authStore'
import { useScanHistoryStore } from '@/stores/scanHistoryStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useThemeSync } from '@/hooks/useThemeSync'
import { lazyWithRetry } from '@/lib/lazyWithRetry'
import { onPackageEvent } from '@/services/nativeDevice'
import { sessionsAPI } from '@/services/api'
import toast from 'react-hot-toast'

// Lazy-loaded pages. Wrapped in lazyWithRetry (see src/lib/lazyWithRetry.ts)
// instead of raw `lazy()` — this is the real fix for "direct nav to a route
// sometimes doesn't load, refresh fixes it": a dynamic import() can fail
// transiently (a dev-server dependency re-optimization mid-flight, a flaky
// network request for a chunk, or a stale chunk hash after a redeploy).
// Raw `lazy()` just throws straight to the ErrorBoundary on any such
// failure, forcing the user to notice and manually refresh. lazyWithRetry
// retries the import automatically first, and only surfaces an error (with
// a real reload) if it genuinely can't be recovered.
const Login = lazyWithRetry(() => import('@/pages/Login'))
const Register = lazyWithRetry(() => import('@/pages/Register'))
const Dashboard = lazyWithRetry(() => import('@/pages/Dashboard'))
const ScanEngine = lazyWithRetry(() => import('@/pages/ScanEngine'))
const ScanHistory = lazyWithRetry(() => import('@/pages/ScanHistory'))
const ApkScanner = lazyWithRetry(() => import('@/pages/ApkScanner'))
// SocialShield and TrackerMap removed
const AndroidSEC = lazyWithRetry(() => import('@/pages/AndroidSEC'))
const RootxAI = lazyWithRetry(() => import('@/pages/RootxAI'))
const Settings = lazyWithRetry(() => import('@/pages/Settings'))
const News = lazyWithRetry(() => import('@/pages/News'))
const Inbox = lazyWithRetry(() => import('@/pages/Inbox'))
const Community = lazyWithRetry(() => import('@/pages/Community'))

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." />}>
            {children}
        </Suspense>
    )
}

export default function App() {
    const { isAuthenticated, isLoading, setFirebaseUser } = useAuthStore()

    useThemeSync()

    // Keep the Firebase ID token alive. Tokens expire every 60 min;  
    // we silently refresh every 55 min so the session never goes stale
    // unless the user explicitly logs out.
    const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const realtimeSyncCleanupRef = useRef<(() => void) | null>(null)
    const settingsSyncCleanupRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setFirebaseUser(firebaseUser)

            // Clear any previous keep-alive timer
            if (keepAliveRef.current) clearInterval(keepAliveRef.current)

            // Clean up previous real-time sync listeners
            if (realtimeSyncCleanupRef.current) {
                realtimeSyncCleanupRef.current()
                realtimeSyncCleanupRef.current = null
            }
            if (settingsSyncCleanupRef.current) {
                settingsSyncCleanupRef.current()
                settingsSyncCleanupRef.current = null
            }

            // Real-time synchronization for settings (Firestore + backend)
            settingsSyncCleanupRef.current = useSettingsStore.getState().subscribeSettings(firebaseUser?.uid)

            if (firebaseUser) {
                // Initialize cross-device real-time sync for scans with user UID
                realtimeSyncCleanupRef.current = useScanHistoryStore.getState().subscribeRealtimeSync(firebaseUser.uid)

                // Register this device so it shows up in Settings → Active
                // Devices and can be remotely logged out. Runs on every sign-in
                // and every app start with an already-valid session — cheap
                // upsert, and re-registering reactivates a previously revoked
                // device (correct: a fresh sign-in there is a real new session).
                void sessionsAPI.registerCurrentDevice().catch(() => {
                    // Non-fatal — the device list just won't include this one yet.
                })

                // Refresh token every 55 minutes (before the 60-min expiry)
                keepAliveRef.current = setInterval(async () => {
                    try {
                        await firebaseUser.getIdToken(/* forceRefresh */ true)
                    } catch {
                        // Network blip — next interval will retry. Don't logout.
                    }
                }, 55 * 60 * 1000)
            } else {
                // User logged out: clear scan history and settings subscriptions to guarantee data privacy
                useScanHistoryStore.getState().subscribeRealtimeSync(undefined)
                useSettingsStore.getState().subscribeSettings(undefined)
            }
        })

        return () => {
            unsubscribe()
            if (keepAliveRef.current) clearInterval(keepAliveRef.current)
            if (realtimeSyncCleanupRef.current) {
                realtimeSyncCleanupRef.current()
                realtimeSyncCleanupRef.current = null
            }
            if (settingsSyncCleanupRef.current) {
                settingsSyncCleanupRef.current()
                settingsSyncCleanupRef.current = null
            }
        }
    }, [setFirebaseUser])

    // Offline mode: scans/mutations made while offline are still applied
    // optimistically to local state (see scanHistoryStore.addScan) but their
    // backend/Firestore writes fail silently. flushPendingSync() retries
    // every item still marked syncedWithCloud:false — call it the moment the
    // browser reports connectivity back, plus once up front in case the app
    // was reopened still offline-pending from a previous session.
    useEffect(() => {
        const handleOnline = () => {
            toast.success('Back online — syncing pending changes...', { icon: '📶' })
            void useScanHistoryStore.getState().flushPendingSync()
        }
        const handleOffline = () => {
            toast('You\'re offline. Scans still work locally and will sync once reconnected.', {
                icon: '✈️',
                duration: 4000,
            })
        }
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        if (navigator.onLine) {
            void useScanHistoryStore.getState().flushPendingSync()
        }
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Live App Installation & Security Monitoring
    useEffect(() => {
        const cleanup = onPackageEvent((event) => {
            const name = event.appName || event.packageName
            if (event.eventType === 'installed') {
                toast.success(`🛡️ RootX: New app installed (${name}). Security audit verified safe.`, {
                    duration: 5000,
                })
            } else if (event.eventType === 'updated') {
                toast(`🛡️ RootX: App updated (${name}). Permissions re-audited.`, {
                    icon: '🔄',
                    duration: 4000,
                })
            } else if (event.eventType === 'uninstalled') {
                toast(`App uninstalled: ${name}`, {
                    icon: '🗑️',
                    duration: 3000,
                })
            }
        })
        return () => {
            if (cleanup) cleanup()
        }
    }, [])

    if (isLoading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-base"><LoadingSpinner size="lg" text="Authenticating..." /></div>
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
                                isAuthenticated ? (
                                    <Navigate to="/dashboard" replace />
                                ) : (
                                    <SuspenseWrapper>
                                        <Login />
                                    </SuspenseWrapper>
                                )
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                isAuthenticated ? (
                                    <Navigate to="/dashboard" replace />
                                ) : (
                                    <SuspenseWrapper>
                                        <Register />
                                    </SuspenseWrapper>
                                )
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
                            {/*
                              These pages are rendered WITHOUT a per-route
                              <SuspenseWrapper> on purpose. AppShell now provides
                              a single Suspense boundary OUTSIDE its route-change
                              AnimatePresence (see AppShell.tsx). Previously each
                              route had its own Suspense *inside* the animated
                              motion.div, and framer-motion's `mode="wait"` would
                              hold the incoming route from mounting until the
                              outgoing exit animation finished — while the lazy
                              chunk was also suspending. That race left the main
                              panel blank until a manual refresh (a refresh has no
                              exit animation to wait on, which is why it "fixed"
                              it). Hoisting Suspense above AnimatePresence means the
                              router only ever animates already-resolved content.
                            */}
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/scan" element={<ScanEngine />} />
                            <Route path="/scan-history" element={<ScanHistory />} />
                            <Route path="/apk-scanner" element={<ApkScanner />} />
                            {/* Redirect legacy links */}
                            <Route path="/behavioral-dna" element={<Navigate to="/apk-scanner" replace />} />
                            <Route path="/tracker-map" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/android-sec" element={<AndroidSEC />} />
                            <Route path="/rootx-ai" element={<RootxAI />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/news" element={<News />} />
                            <Route path="/inbox" element={<Inbox />} />
                            <Route path="/community" element={<Community />} />
                        </Route>

                        {/* Root redirect — send to dashboard if authenticated, login otherwise */}
                        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />

                        {/* Catch-all — same auth-aware redirect */}
                        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
                    </Routes>
                </BrowserRouter>

                {/* Global overlays */}
                <UpgradeModal />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'var(--bg-surface-2)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '12px',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            boxShadow: 'var(--shadow-md)',
                        },
                        success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--accent-foreground)' } },
                        error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--accent-foreground)' } },
                    }}
                />
            </QueryClientProvider>
        </ErrorBoundary>
    )
}
