import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authAPI } from '@/services/api'
import { connectSocket, disconnectSocket } from '@/services/socket'
import toast from 'react-hot-toast'
import type { LoginRequest, RegisterRequest } from '@/types/api'

export function useAuth() {
    const navigate = useNavigate()
    const { login: setAuthStore, logout: clearAuth, user, isAuthenticated } = useAuthStore()

    const loginMutation = useMutation({
        mutationFn: (data: LoginRequest) => authAPI.login(data),
        onSuccess: (data) => {
            setAuthStore(data.user, data.accessToken)
            connectSocket()
            toast.success('Welcome back!', { icon: '🛡️' })
            navigate('/dashboard')
        },
        onError: (error: any) => {
            const msg = error.response?.data?.error || 'Invalid credentials. Please try again.'
            toast.error(msg)
        },
    })

    const registerMutation = useMutation({
        mutationFn: (data: RegisterRequest) => authAPI.register(data),
        onSuccess: (data) => {
            setAuthStore(data.user, data.accessToken)
            connectSocket()
            toast.success('Account created! Welcome to SafeOpen.', { icon: '🛡️' })
            navigate('/dashboard')
        },
        onError: (error: any) => {
            const msg = error.response?.data?.error || 'Registration failed. Please try again.'
            toast.error(msg)
        },
    })

    const logoutMutation = useMutation({
        mutationFn: () => authAPI.logout(),
        onSuccess: () => {
            disconnectSocket()
            clearAuth()
            toast.success('Logged out successfully.')
            navigate('/login')
        },
        onError: () => {
            disconnectSocket()
            clearAuth()
            navigate('/login')
        },
    })

    return {
        user,
        isAuthenticated,
        login: loginMutation.mutate,
        register: registerMutation.mutate,
        logout: logoutMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        isRegistering: registerMutation.isPending,
    }
}
