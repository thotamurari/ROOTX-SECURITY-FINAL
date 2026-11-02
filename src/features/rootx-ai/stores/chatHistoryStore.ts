import { create } from 'zustand'

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    isStreaming?: boolean
    feedback?: 'like' | 'dislike' | null
}

export interface ChatConversation {
    id: string
    title: string
    createdAt: string
    updatedAt: string
    messages: ChatMessage[]
}

interface ChatHistoryState {
    conversations: ChatConversation[]
    activeConversationId: string | null
    isHistoryOpen: boolean
    setIsHistoryOpen: (open: boolean) => void
    createNewChat: () => string
    setActiveConversation: (id: string) => void
    addMessageToActive: (message: Omit<ChatMessage, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => void
    updateMessageInActive: (id: string, updates: Partial<ChatMessage>) => void
    renameConversation: (id: string, newTitle: string) => void
    deleteConversation: (id: string) => void
    clearAllHistory: () => void
}

const STORAGE_KEY = 'rootx_ai_chat_conversations_v2'
const ACTIVE_ID_KEY = 'rootx_ai_active_chat_id'

const createDefaultMessage = (): ChatMessage => ({
    id: 'welcome-1',
    role: 'assistant',
    content: "Hi! I'm **RootX-AI** — your on-device intelligence guardian. 🛡️\n\nI analyze your real device telemetry, app permissions, and security posture.\n\nGrant consent in the **Device Intelligence** panel above to train my local baseline on your device!",
    timestamp: new Date().toISOString(),
    isStreaming: false,
})

const getInitialConversations = (): ChatConversation[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed
            }
        }
    } catch {
        /* ignore */
    }
    const initialId = 'conv-' + Date.now()
    return [{
        id: initialId,
        title: 'New Security Consultation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [createDefaultMessage()],
    }]
}

const getInitialActiveId = (conversations: ChatConversation[]): string => {
    try {
        const stored = localStorage.getItem(ACTIVE_ID_KEY)
        if (stored && conversations.some(c => c.id === stored)) {
            return stored
        }
    } catch {
        /* ignore */
    }
    return conversations[0]?.id || 'conv-' + Date.now()
}

export const useChatHistoryStore = create<ChatHistoryState>((set, get) => {
    const initialConvs = getInitialConversations()
    const initialActiveId = getInitialActiveId(initialConvs)

    const persist = (conversations: ChatConversation[], activeId?: string) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
            if (activeId) {
                localStorage.setItem(ACTIVE_ID_KEY, activeId)
            }
        } catch {
            /* ignore */
        }
    }

    return {
        conversations: initialConvs,
        activeConversationId: initialActiveId,
        isHistoryOpen: false,

        setIsHistoryOpen: (open: boolean) => set({ isHistoryOpen: open }),

        createNewChat: () => {
            const newId = 'conv-' + Date.now()
            const newConv: ChatConversation = {
                id: newId,
                title: 'New Security Audit',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: [createDefaultMessage()],
            }
            const updated = [newConv, ...get().conversations]
            set({
                conversations: updated,
                activeConversationId: newId,
                isHistoryOpen: false,
            })
            persist(updated, newId)
            return newId
        },

        setActiveConversation: (id: string) => {
            set({ activeConversationId: id, isHistoryOpen: false })
            try {
                localStorage.setItem(ACTIVE_ID_KEY, id)
            } catch {
                /* ignore */
            }
        },

        addMessageToActive: (msg) => {
            const state = get()
            const activeId = state.activeConversationId
            const now = new Date().toISOString()
            const newMsg: ChatMessage = {
                id: msg.id || 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp || now,
                isStreaming: msg.isStreaming ?? false,
            }

            const updated = state.conversations.map(conv => {
                if (conv.id !== activeId) return conv
                const isFirstUserMsg = conv.messages.filter(m => m.role === 'user').length === 0 && msg.role === 'user'
                let title = conv.title
                if (isFirstUserMsg) {
                    title = msg.content.slice(0, 32).trim() + (msg.content.length > 32 ? '...' : '')
                }
                return {
                    ...conv,
                    title,
                    updatedAt: now,
                    messages: [...conv.messages, newMsg],
                }
            })

            set({ conversations: updated })
            persist(updated)
        },

        updateMessageInActive: (id: string, updates: Partial<ChatMessage>) => {
            const state = get()
            const activeId = state.activeConversationId
            const updated = state.conversations.map(conv => {
                if (conv.id !== activeId) return conv
                return {
                    ...conv,
                    messages: conv.messages.map(m => (m.id === id ? { ...m, ...updates } : m)),
                }
            })
            set({ conversations: updated })
            persist(updated)
        },

        renameConversation: (id: string, newTitle: string) => {
            const state = get()
            const trimmed = newTitle.trim()
            if (!trimmed) return
            const updated = state.conversations.map(conv =>
                conv.id === id ? { ...conv, title: trimmed, updatedAt: new Date().toISOString() } : conv
            )
            set({ conversations: updated })
            persist(updated)
        },

        deleteConversation: (id: string) => {
            const state = get()
            const filtered = state.conversations.filter(c => c.id !== id)
            let newActiveId = state.activeConversationId
            if (state.activeConversationId === id) {
                if (filtered.length > 0) {
                    newActiveId = filtered[0]!.id
                } else {
                    const fallbackId = 'conv-' + Date.now()
                    const fallbackConv: ChatConversation = {
                        id: fallbackId,
                        title: 'New Security Consultation',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        messages: [createDefaultMessage()],
                    }
                    filtered.push(fallbackConv)
                    newActiveId = fallbackId
                }
            }
            set({ conversations: filtered, activeConversationId: newActiveId })
            persist(filtered, newActiveId)
        },

        clearAllHistory: () => {
            const initialId = 'conv-' + Date.now()
            const freshConv: ChatConversation = {
                id: initialId,
                title: 'New Security Consultation',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: [createDefaultMessage()],
            }
            const updated = [freshConv]
            set({ conversations: updated, activeConversationId: initialId })
            persist(updated, initialId)
        },
    }
})
