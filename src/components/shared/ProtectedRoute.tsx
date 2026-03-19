import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { ReactNode } from 'react'

interface Props {
    children: ReactNode
}

export function ProtectedRoute({ children }: Props) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const location = useLocation()

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return <>{children}</>
}
