import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/authStore'
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
    'threat:detected': (data: ThreatDetectedEvent) => void
    'behavior:anomaly': (data: BehaviorAnomalyEvent) => void
    'tracker:new_connection': (data: TrackerNewConnectionEvent) => void
}

export interface ClientToServerEvents {
    'subscribe:scan': (scanId: string) => void
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
    if (!socket) {
        socket = io(import.meta.env.VITE_WS_URL, {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000,
            randomizationFactor: 0.5,
            auth: {
                token: useAuthStore.getState().accessToken,
            },
            transports: ['websocket', 'polling'],
        })

        socket.on('connect', () => {
            console.log('[WS] Connected:', socket?.id)
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

export const connectSocket = () => {
    const s = getSocket()
    if (s.auth) {
        ; (s.auth as { token: string }).token = useAuthStore.getState().accessToken || ''
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
