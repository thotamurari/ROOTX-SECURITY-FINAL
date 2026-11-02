import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScanResult, ScanType, ThreatLevel } from '@/types/api'
import { auth, db } from '@/lib/firebase'
import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    type Unsubscribe,
} from 'firebase/firestore'
import { getSocket } from '@/services/socket'
import api from '@/services/axios'

export interface ScanHistoryItem {
    id: string
    scanType: ScanType
    input: string
    riskScore: number
    threatLevel: ThreatLevel
    threatType: string | null
    verificationTier?: 'verified_safe' | 'unverified' | 'high_risk'
    scannedAt: string
    scanDuration: number
    result: ScanResult
    syncedWithCloud?: boolean
    userEmail?: string
}

interface ScanHistoryState {
    history: ScanHistoryItem[]
    isLoadingCloud: boolean
    addScan: (result: ScanResult) => Promise<void>
    removeScan: (id: string) => Promise<void>
    clearHistory: () => Promise<void>
    syncWithFirebase: () => Promise<void>
    subscribeRealtimeSync: (uid?: string) => () => void
    getFilteredHistory: (type?: string, level?: string) => ScanHistoryItem[]
    flushPendingSync: () => Promise<void>
}

const MAX_HISTORY_ITEMS = 80
let activeUnsubscribers: Unsubscribe[] = []
let socketListenerAttached = false

// Helper to sanitize objects for Firestore (removes any undefined values)
function cleanForFirestore<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj, (_k, v) => (v === undefined ? null : v)))
}

export const useScanHistoryStore = create<ScanHistoryState>()(
    persist(
        (set, get) => {
            // Pushes one item's backend + Firestore writes, marking it synced
            // on success. Offline (or any transient failure), it's left
            // syncedWithCloud:false — flushPendingSync() (wired to the
            // browser's `online` event in App.tsx) retries every such item
            // once connectivity returns, so a scan made offline isn't lost,
            // just delayed.
            const syncItemToCloud = async (item: ScanHistoryItem) => {
                const user = auth.currentUser
                if (!user) return false
                let ok = true

                try {
                    await api.post('/scan/sync', { item: { ...item, userId: user.uid } })
                } catch {
                    ok = false
                }

                try {
                    if (db) {
                        const payload = cleanForFirestore({
                            ...item,
                            userId: user.uid,
                            userEmail: user.email || 'user@rootx.sec',
                            updatedAt: new Date().toISOString(),
                        })
                        const userRef = doc(db, 'users', user.uid, 'scans', item.id)
                        await setDoc(userRef, payload)
                    }
                } catch (err) {
                    ok = false
                    console.warn('[ScanHistory] Firebase cloud sync error:', err)
                }

                if (ok) {
                    set((state) => ({
                        history: state.history.map((h) =>
                            h.id === item.id ? { ...h, syncedWithCloud: true } : h
                        ),
                    }))
                }
                return ok
            }

            return {
            history: [],
            isLoadingCloud: false,

            flushPendingSync: async () => {
                const pending = get().history.filter((h) => !h.syncedWithCloud)
                for (const item of pending) {
                    await syncItemToCloud(item)
                }
            },

            addScan: async (result: ScanResult) => {
                const user = auth.currentUser
                const item: ScanHistoryItem = {
                    id: result.id || `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    scanType: result.scanType,
                    input: result.input,
                    riskScore: result.riskScore,
                    threatLevel: result.threatLevel,
                    threatType: result.threatType || null,
                    verificationTier: result.verificationTier || 'verified_safe',
                    scannedAt: result.scannedAt || new Date().toISOString(),
                    scanDuration: result.scanDuration || 0,
                    result,
                    syncedWithCloud: false,
                    userEmail: user?.email || 'user@rootx.sec',
                }

                // 1. Optimistic local update
                set((state) => {
                    const filtered = state.history.filter(
                        (h) => h.id !== item.id && !(h.input === item.input && Math.abs(Date.now() - new Date(h.scannedAt).getTime()) < 3000)
                    )
                    return {
                        history: [item, ...filtered].slice(0, MAX_HISTORY_ITEMS),
                    }
                })

                // 2+3. Backend sync + Firestore cloud sync — if this fails
                // (e.g. offline), the item stays syncedWithCloud:false and
                // flushPendingSync() will retry it once back online.
                await syncItemToCloud(item)
            },

            removeScan: async (id: string) => {
                set((state) => ({
                    history: state.history.filter((h) => h.id !== id),
                }))

                try {
                    const user = auth.currentUser
                    if (db) {
                        await deleteDoc(doc(db, 'global_scans', id)).catch(() => {})
                        if (user) {
                            await deleteDoc(doc(db, 'users', user.uid, 'scans', id)).catch(() => {})
                        }
                    }
                } catch (err) {
                    console.warn('[ScanHistory] Firebase delete error:', err)
                }
            },

            clearHistory: async () => {
                const currentHistory = get().history
                set({ history: [] })

                try {
                    const user = auth.currentUser
                    if (db) {
                        for (const item of currentHistory) {
                            await deleteDoc(doc(db, 'global_scans', item.id)).catch(() => {})
                            if (user) {
                                await deleteDoc(doc(db, 'users', user.uid, 'scans', item.id)).catch(() => {})
                            }
                        }
                    }
                } catch (err) {
                    console.warn('[ScanHistory] Firebase clear error:', err)
                }
            },

            subscribeRealtimeSync: (uid?: string) => {
                // Clear existing Firestore listeners
                activeUnsubscribers.forEach((unsub) => {
                    try { unsub() } catch {}
                })
                activeUnsubscribers = []

                if (!uid) {
                    set({ history: [], isLoadingCloud: false })
                    return () => {}
                }

                // Clear previous session history and load user's real scans
                set({ history: [], isLoadingCloud: true })

                const handleIncomingItems = (cloudItems: ScanHistoryItem[]) => {
                    if (cloudItems.length > 0) {
                        set((state) => {
                            const map = new Map<string, ScanHistoryItem>()
                            // Preserve local items not yet synced
                            for (const h of state.history) {
                                map.set(h.id, h)
                            }
                            // Merge incoming real-time cloud items
                            for (const c of cloudItems) {
                                map.set(c.id, { ...c, syncedWithCloud: true })
                            }
                            const merged = Array.from(map.values()).sort(
                                (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
                            )
                            return {
                                history: merged.slice(0, MAX_HISTORY_ITEMS),
                                isLoadingCloud: false,
                            }
                        })
                    }
                }

                // 1. Socket.io Real-time Event Subscription
                try {
                    const socket = getSocket()
                    if (!socketListenerAttached) {
                        socketListenerAttached = true
                        const onScanEvent = (data: any) => {
                            const result = data?.result || data
                            if (result && result.input) {
                                if (result.userId && result.userId !== uid) return
                                const item: ScanHistoryItem = {
                                    id: result.id || `scan-${Date.now()}`,
                                    scanType: result.scanType || 'url',
                                    input: result.input,
                                    riskScore: result.riskScore ?? 0,
                                    threatLevel: result.threatLevel || 'safe',
                                    threatType: result.threatType || null,
                                    verificationTier: result.verificationTier || 'verified_safe',
                                    scannedAt: result.scannedAt || new Date().toISOString(),
                                    scanDuration: result.scanDuration || 0,
                                    result,
                                    syncedWithCloud: true,
                                }
                                handleIncomingItems([item])
                            }
                        }
                        socket.on('scan:new' as any, onScanEvent)
                        socket.on('scan:complete' as any, onScanEvent)
                        socket.on('scan:sync' as any, onScanEvent)
                    }
                } catch {
                    // Socket unavailable
                }

                // 2. Fetch from Backend REST API to seed immediately
                try {
                    void api.get('/scan/history', { params: { userId: uid } }).then((res) => {
                        if (res.data?.data && Array.isArray(res.data.data)) {
                            const items: ScanHistoryItem[] = res.data.data.map((r: any) => ({
                                id: r.id,
                                scanType: r.scanType || 'url',
                                input: r.input,
                                riskScore: r.riskScore ?? 0,
                                threatLevel: r.threatLevel || 'safe',
                                threatType: r.threatType || null,
                                verificationTier: r.verificationTier || 'verified_safe',
                                scannedAt: r.scannedAt || new Date().toISOString(),
                                scanDuration: r.scanDuration || 0,
                                result: r,
                                syncedWithCloud: true,
                            }))
                            handleIncomingItems(items)
                        } else {
                            set({ isLoadingCloud: false })
                        }
                    }).catch(() => {
                        set({ isLoadingCloud: false })
                    })
                } catch {}

                // 3. Firestore Real-time onSnapshot Listener for authenticated user
                if (db) {
                    try {
                        const userQ = query(
                            collection(db, 'users', uid, 'scans'),
                            orderBy('scannedAt', 'desc'),
                            limit(MAX_HISTORY_ITEMS)
                        )
                        const unsubUser = onSnapshot(userQ, (snapshot) => {
                            const cloudItems: ScanHistoryItem[] = []
                            snapshot.forEach((docSnap) => {
                                const data = docSnap.data() as ScanHistoryItem
                                cloudItems.push({
                                    ...data,
                                    id: docSnap.id,
                                    syncedWithCloud: true,
                                })
                            })
                            handleIncomingItems(cloudItems)
                        }, (err) => {
                            console.warn('[ScanHistory] Realtime user sync error:', err)
                            set({ isLoadingCloud: false })
                        })
                        activeUnsubscribers.push(unsubUser)
                    } catch (err) {
                        console.warn('[ScanHistory] Could not attach Firestore listeners:', err)
                        set({ isLoadingCloud: false })
                    }
                }

                return () => {
                    activeUnsubscribers.forEach((unsub) => {
                        try { unsub() } catch {}
                    })
                    activeUnsubscribers = []
                }
            },

            syncWithFirebase: async () => {
                const user = auth.currentUser
                if (!user) {
                    set({ history: [], isLoadingCloud: false })
                    return
                }
                set({ isLoadingCloud: true })
                const allItems: ScanHistoryItem[] = []

                // 1. Fetch from Backend REST
                try {
                    const res = await api.get('/scan/history', { params: { userId: user.uid } })
                    if (res.data?.data && Array.isArray(res.data.data)) {
                        for (const r of res.data.data) {
                            allItems.push({
                                id: r.id,
                                scanType: r.scanType || 'url',
                                input: r.input,
                                riskScore: r.riskScore ?? 0,
                                threatLevel: r.threatLevel || 'safe',
                                threatType: r.threatType || null,
                                verificationTier: r.verificationTier || 'verified_safe',
                                scannedAt: r.scannedAt || new Date().toISOString(),
                                scanDuration: r.scanDuration || 0,
                                result: r,
                                syncedWithCloud: true,
                            })
                        }
                    }
                } catch {}

                // 2. Fetch from Firestore user scans
                if (db) {
                    try {
                        const userQ = query(collection(db, 'users', user.uid, 'scans'), orderBy('scannedAt', 'desc'), limit(MAX_HISTORY_ITEMS))
                        const userSnap = await getDocs(userQ)
                        userSnap.forEach((docSnap) => {
                            allItems.push({
                                ...docSnap.data() as ScanHistoryItem,
                                id: docSnap.id,
                                syncedWithCloud: true,
                            })
                        })
                    } catch (err) {
                        console.warn('[ScanHistory] Failed to pull history from Firebase:', err)
                    }
                }

                if (allItems.length > 0) {
                    set((state) => {
                        const map = new Map<string, ScanHistoryItem>(state.history.map((h) => [h.id, h]))
                        for (const item of allItems) {
                            map.set(item.id, item)
                        }
                        return {
                            history: Array.from(map.values()).sort(
                                (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
                            ).slice(0, MAX_HISTORY_ITEMS),
                            isLoadingCloud: false,
                        }
                    })
                } else {
                    set({ isLoadingCloud: false })
                }
            },

            getFilteredHistory: (type?: string, level?: string) => {
                const { history } = get()
                return history.filter((item) => {
                    if (type && type !== 'all' && item.scanType !== type) return false
                    if (level && level !== 'all') {
                        if (level === 'unverified' && (item.threatLevel === 'unverified' || item.verificationTier === 'unverified')) return true
                        if (item.threatLevel !== level) return false
                    }
                    return true
                })
            },
            }
        },
        {
            name: 'rootx_scan_history_v2',
        }
    )
)
