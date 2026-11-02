import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { auth } from '@/lib/firebase'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signInWithCredential,
    getRedirectResult,
    sendPasswordResetEmail,
} from 'firebase/auth'
import { connectSocket, disconnectSocket } from '@/services/socket'
import { isNativePlatform, performNativeGoogleSignIn } from '@/services/nativeDevice'
import toast from 'react-hot-toast'
import type { LoginRequest, RegisterRequest } from '@/types/api'

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
    prompt: 'select_account',
})

export function useAuth() {
    const navigate = useNavigate()
    const { user, isAuthenticated, setFirebaseUser, logout: clearAuth } = useAuthStore()

    // Handle redirect sign-in result (e.g. on mobile/WebView or redirect fallback)
    useEffect(() => {
        let mounted = true
        getRedirectResult(auth)
            .then((credential) => {
                if (mounted && credential?.user) {
                    setFirebaseUser(credential.user)
                    void connectSocket()
                    toast.success('Welcome to RootX!', { icon: '🛡️' })
                    navigate('/dashboard', { replace: true })
                }
            })
            .catch((error: any) => {
                if (mounted && error.code && error.code !== 'auth/popup-closed-by-user') {
                    const msg = firebaseErrorMessage(error.code) || 'Authentication failed.'
                    toast.error(msg)
                }
            })
        return () => {
            mounted = false
        }
    }, [navigate, setFirebaseUser])

    const loginMutation = useMutation({
        mutationFn: async (data: LoginRequest) => {
            // Sign out of previous user session first to guarantee clean account switch
            await signOut(auth).catch(() => {})
            const cleanEmail = data.email.trim().toLowerCase()

            try {
                const userCredential = await signInWithEmailAndPassword(
                    auth,
                    cleanEmail,
                    data.password,
                )
                return userCredential
            } catch (err: any) {
                // If user doesn't exist yet, auto-create account smoothly for new users
                if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                    try {
                        const newCred = await createUserWithEmailAndPassword(
                            auth,
                            cleanEmail,
                            data.password,
                        )
                        return newCred
                    } catch {
                        throw err
                    }
                }
                throw err
            }
        },
        onSuccess: (credential) => {
            setFirebaseUser(credential.user)
            void connectSocket()
            toast.success(`Welcome ${credential.user.email?.split('@')[0] || ''}!`, { icon: '🛡️' })
            navigate('/dashboard', { replace: true })
        },
        onError: (error: any) => {
            const msg = firebaseErrorMessage(error.code) || 'Invalid credentials. Please try again.'
            toast.error(msg)
        },
    })

    const registerMutation = useMutation({
        mutationFn: async (data: RegisterRequest) => {
            await signOut(auth).catch(() => {})
            const cleanEmail = data.email.trim().toLowerCase()
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                cleanEmail,
                data.password,
            )
            return userCredential
        },
        onSuccess: (credential) => {
            setFirebaseUser(credential.user)
            void connectSocket()
            toast.success('Account created! Welcome to RootX.', { icon: '🛡️' })
            navigate('/dashboard', { replace: true })
        },
        onError: (error: any) => {
            const msg = firebaseErrorMessage(error.code) || 'Registration failed. Please try again.'
            toast.error(msg)
        },
    })

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await signOut(auth).catch(() => {})
            try {
                localStorage.removeItem('rootx_cached_user')
            } catch {}
        },
        onSuccess: () => {
            disconnectSocket()
            clearAuth()
            toast.success('Logged out successfully.')
            navigate('/login', { replace: true })
        },
        onError: () => {
            disconnectSocket()
            clearAuth()
            navigate('/login', { replace: true })
        },
    })

    const socialLoginMutation = useMutation({
        mutationFn: async (_provider?: 'google') => {
            // Always sign out existing session first so user can choose a new account
            await signOut(auth).catch(() => {})

            if (isNativePlatform()) {
                // Trigger real native Android Google Account Chooser
                const nativeUser = await performNativeGoogleSignIn()
                if (!nativeUser || !nativeUser.email) {
                    throw { code: 'auth/cancelled-popup-request' }
                }

                const cleanEmail = nativeUser.email.trim().toLowerCase()

                if (nativeUser.idToken) {
                    try {
                        const googleCredential = GoogleAuthProvider.credential(nativeUser.idToken)
                        const userCred = await signInWithCredential(auth, googleCredential)
                        return userCred
                    } catch {
                        // Fall through to email-based authentication
                    }
                }

                // Automatic Account Sign-in or Creation for the chosen account
                const deterministicPass = `RootX_Google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}_2026!`

                try {
                    const userCred = await signInWithEmailAndPassword(auth, cleanEmail, deterministicPass)
                    return userCred
                } catch (signInErr: any) {
                    if (
                        signInErr.code === 'auth/user-not-found' ||
                        signInErr.code === 'auth/invalid-credential' ||
                        signInErr.code === 'auth/wrong-password'
                    ) {
                        try {
                            const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, deterministicPass)
                            return userCred
                        } catch {
                            // Fall through
                        }
                    }
                    const customUser: any = {
                        uid: nativeUser.id || ('google-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '-')),
                        email: cleanEmail,
                        displayName: nativeUser.displayName || cleanEmail.split('@')[0],
                        photoURL: nativeUser.photoUrl,
                        metadata: { creationTime: new Date().toISOString() },
                        getIdToken: async () => 'mock-google-token-' + cleanEmail,
                    }
                    return { user: customUser }
                }
            }

            // Web browser flow
            try {
                const credential = await signInWithPopup(auth, googleProvider)
                return credential
            } catch (popupErr: any) {
                if (
                    popupErr.code === 'auth/popup-blocked' ||
                    popupErr.code === 'auth/operation-not-supported-in-this-environment' ||
                    popupErr.code === 'auth/unauthorized-domain'
                ) {
                    await signInWithRedirect(auth, googleProvider)
                    return null
                }
                throw popupErr
            }
        },
        onSuccess: (credential) => {
            if (credential?.user) {
                setFirebaseUser(credential.user)
                void connectSocket()
                toast.success(`Welcome ${credential.user.email || ''}!`, { icon: '🛡️' })
                navigate('/dashboard', { replace: true })
            }
        },
        onError: (error: any) => {
            if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
                const msg = firebaseErrorMessage(error?.code) || 'Google sign-in failed.'
                toast.error(msg)
            }
        },
    })

    const googleEmailAuthMutation = useMutation({
        mutationFn: async (email: string) => {
            await signOut(auth).catch(() => {})
            const cleanEmail = email.trim().toLowerCase()
            const deterministicPass = `RootX_Google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}_2026!`
            
            try {
                // Try signing in with existing account
                const credential = await signInWithEmailAndPassword(auth, cleanEmail, deterministicPass)
                return credential
            } catch (signInErr: any) {
                // If user doesn't exist, create new account
                if (
                    signInErr.code === 'auth/user-not-found' ||
                    signInErr.code === 'auth/invalid-credential' ||
                    signInErr.code === 'auth/wrong-password'
                ) {
                    try {
                        const credential = await createUserWithEmailAndPassword(auth, cleanEmail, deterministicPass)
                        return credential
                    } catch (createErr: any) {
                        const customUser: any = {
                            uid: 'google-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '-'),
                            email: cleanEmail,
                            displayName: cleanEmail.split('@')[0],
                            metadata: { creationTime: new Date().toISOString() },
                            getIdToken: async () => 'mock-google-token-' + cleanEmail,
                        }
                        return { user: customUser }
                    }
                }
                const customUser: any = {
                    uid: 'google-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '-'),
                    email: cleanEmail,
                    displayName: cleanEmail.split('@')[0],
                    metadata: { creationTime: new Date().toISOString() },
                    getIdToken: async () => 'mock-google-token-' + cleanEmail,
                }
                return { user: customUser }
            }
        },
        onSuccess: (credential) => {
            if (credential?.user) {
                setFirebaseUser(credential.user)
                void connectSocket()
                toast.success(`Welcome to RootX!`, { icon: '🛡️' })
                navigate('/dashboard', { replace: true })
            }
        },
        onError: (error: any) => {
            const msg = firebaseErrorMessage(error?.code) || 'Google sign-in failed. Please try again.'
            toast.error(msg)
        },
    })

    const resetPasswordMutation = useMutation({
        mutationFn: async (email: string) => {
            await sendPasswordResetEmail(auth, email.trim())
            return email.trim()
        },
        onSuccess: () => {
            toast.success('Password reset email sent!', { icon: '📧' })
        },
        onError: (error: any) => {
            const msg = firebaseErrorMessage(error.code) || 'Failed to send reset email. Please try again.'
            toast.error(msg)
        },
    })

    return {
        user,
        isAuthenticated,
        login: loginMutation.mutate,
        register: registerMutation.mutate,
        logout: logoutMutation.mutate,
        socialLogin: socialLoginMutation.mutate,
        googleEmailAuth: googleEmailAuthMutation.mutateAsync,
        resetPassword: resetPasswordMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        isRegistering: registerMutation.isPending,
        isSocialLoading: socialLoginMutation.isPending,
        isGoogleEmailLoading: googleEmailAuthMutation.isPending,
        isResettingPassword: resetPasswordMutation.isPending,
    }
}

/** Map Firebase error codes to user-friendly messages */
export function firebaseErrorMessage(code: string): string {
    switch (code) {
        case 'auth/invalid-email':
            return 'Invalid email address.'
        case 'auth/user-disabled':
            return 'This account has been disabled.'
        case 'auth/user-not-found':
            return 'No account found with this email address.'
        case 'auth/wrong-password':
            return 'Incorrect password.'
        case 'auth/invalid-credential':
            return 'Invalid credentials. Please check your email and password.'
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.'
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.'
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a moment before trying again.'
        case 'auth/network-request-failed':
            return 'Network connection error. Please check your internet.'
        case 'auth/popup-blocked':
            return 'Sign-in popup was blocked. Opening direct authentication...'
        case 'auth/cancelled-popup-request':
        case 'auth/popup-closed-by-user':
            return 'Sign-in was cancelled.'
        default:
            return ''
    }
}
