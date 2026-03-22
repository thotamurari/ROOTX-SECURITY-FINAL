import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { ReactNode } from 'react'

interface Props {
    children: ReactNode
}

export function ProtectedRoute({ children }: Props) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const isLoading = useAuthStore((s) => s.isLoading)
    const location = useLocation()

    // CRITICAL: Wait for auth check to complete before redirecting.
    // Without this, the route redirects to /login before
    // the token is validated from localStorage.
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#060608] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-[#00F5FF] border-t-transparent rounded-full animate-spin" />
                    <p className="font-mono text-sm text-[#8888AA]">Verifying session...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return <>{children}</>
}
