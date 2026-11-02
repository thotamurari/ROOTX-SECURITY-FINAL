import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import api from '@/services/axios'

import { getSocket } from '@/services/socket'

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
    subscribeSettings: (userId?: string) => () => void
}

let activeSettingsUnsub: (() => void) | null = null

const syncToCloud = async (partialSettings: Record<string, boolean>) => {
    try {
        const user = auth.currentUser
        const uid = user?.uid || 'shared-user'
        if (db && user) {
            const settingsRef = doc(db, 'users', uid, 'settings', 'preferences')
            await setDoc(settingsRef, {
                ...partialSettings,
                updatedAt: new Date().toISOString(),
            }, { merge: true }).catch(() => {})
        }
        await api.put('/auth/settings', { ...partialSettings, userId: uid }).catch(() => {})
    } catch {}
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            notifications: true,
            soundAlerts: true,
            realTimeScanning: true,
            darkMode: true,
            autoBlock: false,
            setNotifications: (v) => {
                set({ notifications: v })
                void syncToCloud({ notifications: v })
            },
            setSoundAlerts: (v) => {
                set({ soundAlerts: v })
                void syncToCloud({ soundAlerts: v })
            },
            setRealTimeScanning: (v) => {
                set({ realTimeScanning: v })
                void syncToCloud({ realTimeScanning: v })
            },
            setDarkMode: (v) => {
                set({ darkMode: v })
                void syncToCloud({ darkMode: v })
            },
            setAutoBlock: (v) => {
                set({ autoBlock: v })
                void syncToCloud({ autoBlock: v })
            },
            subscribeSettings: (userId?: string) => {
                if (activeSettingsUnsub) {
                    try { activeSettingsUnsub() } catch {}
                    activeSettingsUnsub = null
                }

                if (!userId) {
                    return () => {}
                }

                const uid = userId || auth.currentUser?.uid
                if (!uid) return () => {}

                // 1. Fetch initial settings from backend REST
                api.get('/auth/settings', { params: { userId: uid } }).then((res) => {
                    if (res.data) {
                        set({
                            notifications: res.data.notifications ?? get().notifications,
                            soundAlerts: res.data.soundAlerts ?? get().soundAlerts,
                            realTimeScanning: res.data.realTimeScanning ?? get().realTimeScanning,
                            darkMode: res.data.darkMode ?? get().darkMode,
                            autoBlock: res.data.autoBlock ?? get().autoBlock,
                        })
                    }
                }).catch(() => {})

                // 2. Listen to real-time Socket.io settings updates
                const socket = getSocket()
                const onSettingsUpdated = (data: any) => {
                    if (data && (!data.userId || data.userId === uid) && data.settings) {
                        const s = data.settings
                        set({
                            notifications: s.notifications ?? get().notifications,
                            soundAlerts: s.soundAlerts ?? get().soundAlerts,
                            realTimeScanning: s.realTimeScanning ?? get().realTimeScanning,
                            darkMode: s.darkMode ?? get().darkMode,
                            autoBlock: s.autoBlock ?? get().autoBlock,
                        })
                    }
                }
                socket.on('settings:updated', onSettingsUpdated)

                // 3. Attach Firestore Realtime Listener for instant mobile ⇄ web updates
                let unsubFirestore: (() => void) | null = null
                if (db) {
                    try {
                        const settingsRef = doc(db, 'users', uid, 'settings', 'preferences')
                        unsubFirestore = onSnapshot(settingsRef, (docSnap) => {
                            if (docSnap.exists()) {
                                const data = docSnap.data()
                                set({
                                    notifications: data.notifications ?? get().notifications,
                                    soundAlerts: data.soundAlerts ?? get().soundAlerts,
                                    realTimeScanning: data.realTimeScanning ?? get().realTimeScanning,
                                    darkMode: data.darkMode ?? get().darkMode,
                                    autoBlock: data.autoBlock ?? get().autoBlock,
                                })
                            }
                        }, (err) => {
                            console.warn('[SettingsSync] Firestore sync listener warning:', err)
                        })
                    } catch {}
                }

                const cleanup = () => {
                    socket.off('settings:updated', onSettingsUpdated)
                    if (unsubFirestore) {
                        try { unsubFirestore() } catch {}
                    }
                }
                activeSettingsUnsub = cleanup
                return cleanup
            },
        }),
        { name: 'RootX-Security-settings' }
    )
)
