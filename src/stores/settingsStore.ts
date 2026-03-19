import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
    notifications: boolean
    soundAlerts: boolean
    realTimeScanning: boolean
    darkMode: boolean
    autoBlock: boolean
    setNotifications: (v: boolean) => void
    setSoundAlerts: (v: boolean) => void
    setRealTimeScanning: (v: boolean) => void
    setDarkMode: (v: boolean) => void
    setAutoBlock: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            notifications: true,
            soundAlerts: true,
            realTimeScanning: true,
            darkMode: true,
            autoBlock: false,
            setNotifications: (v) => set({ notifications: v }),
            setSoundAlerts: (v) => set({ soundAlerts: v }),
            setRealTimeScanning: (v) => set({ realTimeScanning: v }),
            setDarkMode: (v) => set({ darkMode: v }),
            setAutoBlock: (v) => set({ autoBlock: v }),
        }),
        { name: 'safeopen-settings' }
    )
)
