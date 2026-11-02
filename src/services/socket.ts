import { io, Socket } from 'socket.io-client'
import { auth } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'
import type {
    ScanProgressEvent,
    ScanCompleteEvent,
    ThreatDetectedEvent,
    BehaviorAnomalyEvent,
    TrackerNewConnectionEvent,
} from '@/types/api'

// Event map for type-safe listeners
export interface ServerToClientEvents {
    'scan:progress': (data: ScanProgressEvent) => void
    'scan:complete': (data: ScanCompleteEvent) => void
    'scan:new': (data: any) => void
    'threat:detected': (data: ThreatDetectedEvent) => void
    'behavior:anomaly': (data: BehaviorAnomalyEvent) => void
    'tracker:new_connection': (data: TrackerNewConnectionEvent) => void
    'user:updated': (data: { userId: string; email: string }) => void
}

export interface ClientToServerEvents {
    'subscribe:scan': (scanId: string) => void
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

function getSocketUrl(): string {
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    return `http://${host}:3000`
}

async function getAuthDetails(): Promise<{ token: string; userId?: string }> {
    try {
        const fbUser = auth.currentUser
        if (fbUser) {
            const token = await fbUser.getIdToken()
            return { token, userId: fbUser.uid }
        }
        const { data: { session } } = await supabase.auth.getSession()
        return { token: session?.access_token ?? '', userId: session?.user?.id }
    } catch {
        return { token: '' }
    }
}

export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
    if (!socket) {
        socket = io(getSocketUrl(), {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000,
            randomizationFactor: 0.5,
            auth: {
                token: '',
            },
            transports: ['websocket', 'polling'],
        })

        socket.on('connect', () => {
            console.log('[WS] Connected to backend at:', getSocketUrl(), socket?.id)
        })

        socket.on('disconnect', (reason) => {
            console.log('[WS] Disconnected:', reason)
        })

        socket.on('connect_error', (error) => {
            console.error('[WS] Connection error:', error.message)
        })
    }

    return socket
}

export const connectSocket = async () => {
    const s = getSocket()
    const { token, userId } = await getAuthDetails()
    if (s.auth) {
        ;(s.auth as { token: string; userId?: string }).token = token
        if (userId) {
            ;(s.auth as { token: string; userId?: string }).userId = userId
        }
    }
    if (!s.connected) {
        s.connect()
    }
}

export const disconnectSocket = () => {
    if (socket?.connected) {
        socket.disconnect()
    }
}

export default getSocket
