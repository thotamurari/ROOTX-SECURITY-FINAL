import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '@/types/api'

interface AuthState {
    user: UserProfile | null
    accessToken: string | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (user: UserProfile, token: string) => void
    logout: () => void
    setLoading: (loading: boolean) => void
    setUser: (user: UserProfile | null) => void
    setAccessToken: (token: string | null) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: true, // initial state is loading while we check localstorage/tokens
            login: (user, token) => {
                localStorage.setItem('safeopen_user', JSON.stringify(user))
                localStorage.setItem('safeopen_token', token)
                set({ user, accessToken: token, isAuthenticated: true, isLoading: false })
            },
            logout: () => {
                localStorage.removeItem('safeopen_token')
                localStorage.removeItem('safeopen_user')
                set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false })
            },
            setLoading: (loading) => set({ isLoading: loading }),
            setUser: (user) => set({ user }),
            setAccessToken: (token) => set({ accessToken: token })
        }),
        {
            name: 'safeopen-auth',
            partialize: (state) => ({ 
                user: state.user, 
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated 
            })
        }
    )
)
