export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    isStreaming: boolean
}

export interface DeviceInfo {
    model: string
    android: string
    ram: { total: number; free: number }
    cpu: string
    storage: { total: number; free: number; usedPercent: number }
    battery: { health: number; temperature: number }
    riskyApps: number
    bgProcesses: number
}
