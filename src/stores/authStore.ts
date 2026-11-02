import { create } from 'zustand'
import type { User as FirebaseUser } from 'firebase/auth'
import type { UserProfile } from '@/types/api'

interface AuthState {
    user: UserProfile | null
    firebaseUser: FirebaseUser | null
    isAuthenticated: boolean
    isLoading: boolean
    setFirebaseUser: (firebaseUser: FirebaseUser | null) => void
    setUser: (user: UserProfile | null) => void
    setLoading: (loading: boolean) => void
    login: (user: UserProfile, firebaseUser: FirebaseUser) => void
    logout: () => void
}

const getCachedUser = (): UserProfile | null => {
    try {
        const stored = localStorage.getItem('rootx_cached_user')
        return stored ? JSON.parse(stored) : null
    } catch {
        return null
    }
}

export const useAuthStore = create<AuthState>()((set) => ({
    user: null,
    firebaseUser: null,
    isAuthenticated: false,
    isLoading: true, // Wait for Firebase onAuthStateChanged to resolve

    setFirebaseUser: (firebaseUser) => {
        if (firebaseUser) {
            const profile: UserProfile = {
                id: firebaseUser.uid,
                email: firebaseUser.email ?? '',
                plan: 'free',
                createdAt: firebaseUser.metadata.creationTime ?? new Date().toISOString(),
            }
            try {
                localStorage.setItem('rootx_cached_user', JSON.stringify(profile))
            } catch { /* ignore */ }
            set({
                firebaseUser,
                user: profile,
                isAuthenticated: true,
                isLoading: false,
            })
        } else {
            try {
                localStorage.removeItem('rootx_cached_user')
            } catch { /* ignore */ }
            set({
                firebaseUser: null,
                user: null,
                isAuthenticated: false,
                isLoading: false,
            })
        }
    },

    setUser: (user) => {
        if (user) {
            try { localStorage.setItem('rootx_cached_user', JSON.stringify(user)) } catch { /* ignore */ }
        } else {
            try { localStorage.removeItem('rootx_cached_user') } catch { /* ignore */ }
        }
        set({ user })
    },

    setLoading: (loading) => set({ isLoading: loading }),

    login: (user, firebaseUser) => {
        try { localStorage.setItem('rootx_cached_user', JSON.stringify(user)) } catch { /* ignore */ }
        set({
            user,
            firebaseUser,
            isAuthenticated: true,
            isLoading: false,
        })
    },

    logout: () => {
        try { localStorage.removeItem('rootx_cached_user') } catch { /* ignore */ }
        set({
            user: null,
            firebaseUser: null,
            isAuthenticated: false,
            isLoading: false,
        })
    },
}))
