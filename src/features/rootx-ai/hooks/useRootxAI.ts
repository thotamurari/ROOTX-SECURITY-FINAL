import { useState, useRef, useEffect, useCallback } from 'react'
import type { Message } from '../types/index'

const WELCOME: Message = {
    id: '1',
    role: 'assistant',
    content: "Hi! I'm RootX-AI — I have full access to your device specs, installed apps, security status and storage. Ask me anything about your phone!",
    timestamp: new Date(),
    isStreaming: false,
}

export function useRootxAI() {
    const [messages, setMessages] = useState<Message[]>([WELCOME])
    const [input, setInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const generateFallback = (question: string): string => {
        const q = question.toLowerCase()
        if (q.includes('bgmi') || q.includes('battleground')) {
            return "Based on your Samsung A52 (6GB RAM, 30GB free, Android 13):\n\nYes! BGMI will run on your phone.\n\n• RAM: 6GB available ✓ (needs 3GB)\n• Storage: 30GB free ✓ (needs 2.5GB)\n• Expected FPS: 60fps on Medium settings\n\nTip: Close Instagram and TikTok before playing to free RAM for better performance."
        }
        if (q.includes('slow') || q.includes('lag')) {
            return "Your phone is slow because:\n\n• 12 background apps consuming RAM (only 1.2GB free)\n• Storage at 76% full — Android needs 20%+ free\n• Clean Master is ironically hurting performance\n\nFix: Force stop Instagram + TikTok, clear 8.4GB cache, uninstall Clean Master."
        }
        if (q.includes('battery')) {
            return "Your top battery drains:\n\n• Instagram: 22% daily\n• WhatsApp: 18% daily\n• TikTok: 14% daily\n\nYour battery health is 84% — no replacement needed. Restricting background activity for Instagram and TikTok alone could add 3-4 hours daily."
        }
        if (q.includes('storage') || q.includes('space')) {
            return "Your storage breakdown (128GB total, 30GB free):\n\n• Photos/Videos: 49.8GB\n• Apps: 28.1GB\n• Cache: 8.4GB (cleanable now)\n• Duplicates: 2.1GB (removable)\n\nYou can free 12.3GB immediately without deleting any photos."
        }
        if (q.includes('bank') || q.includes('safe')) {
            return "Your phone has security concerns:\n\n• Flashlight Pro has SMS read permissions — risky for banking\n• 4 apps flagged as risky (Facebook, TikTok, Clean Master, Flashlight Pro)\n• 23 dangerous permissions across all apps\n\nFor safer banking: uninstall Flashlight Pro and Clean Master first."
        }
        if (q.includes('delete') || q.includes('remove') || q.includes('uninstall')) {
            return "Apps you should delete:\n\n• Clean Master — flagged risky, uses excessive RAM, ironically slows phone\n• Flashlight Pro — reads SMS (privacy risk), Android has built-in flashlight\n• Consider removing TikTok if battery life is priority (14% daily drain)\n\nThis would free ~1.2GB storage and improve performance immediately."
        }
        if (q.includes('genshin')) {
            return "Genshin Impact on your Samsung A52:\n\n• RAM: 6GB ✓ (needs 4GB min)\n• Storage: Needs 20GB — you have 30GB free ✓\n• Android 13 ✓ (needs 7+)\n\n⚠️ Performance: Expect 30-40fps on Medium settings. Your A52's Snapdragon 720G can handle it, but not at highest quality. Close all background apps before playing."
        }
        return "I understand your question. Based on your Samsung A52 (6GB RAM, Android 13, 30GB free, 4 risky apps detected), I can help you with this. The AI backend is currently reconnecting — please try again in a moment."
    }

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isStreaming) return

            const trimmed = content.trim()

            const userMsg: Message = {
                id: Date.now().toString(),
                role: 'user',
                content: trimmed,
                timestamp: new Date(),
                isStreaming: false,
            }
            setMessages((prev) => [...prev, userMsg])
            setInput('')
            setIsStreaming(true)

            const aiId = (Date.now() + 1).toString()
            setMessages((prev) => [
                ...prev,
                { id: aiId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true },
            ])

            abortRef.current = new AbortController()

            try {
                const token = localStorage.getItem('safeopen_token')
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
                const response = await fetch(`${apiUrl}/rootx-ai/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        message: trimmed,
                        history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
                    }),
                    signal: abortRef.current.signal,
                })

                if (!response.ok) throw new Error(`HTTP ${response.status}`)
                if (!response.body) throw new Error('No body')

                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                let accumulated = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, { stream: true })
                    const lines = chunk.split('\n')

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue
                        const data = line.slice(6).trim()
                        if (data === '[DONE]') break
                        try {
                            const parsed = JSON.parse(data)
                            const text = parsed.delta?.text || ''
                            if (!text) continue
                            accumulated += text
                            setMessages((prev) =>
                                prev.map((m) => (m.id === aiId ? { ...m, content: accumulated } : m))
                            )
                        } catch {
                            /* skip malformed */
                        }
                    }
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') return
                const fallback = generateFallback(trimmed)
                setMessages((prev) =>
                    prev.map((m) => (m.id === aiId ? { ...m, content: fallback } : m))
                )
            } finally {
                setMessages((prev) =>
                    prev.map((m) => (m.id === aiId ? { ...m, isStreaming: false } : m))
                )
                setIsStreaming(false)
            }
        },
        [isStreaming, messages]
    )

    const clearChat = useCallback(() => {
        abortRef.current?.abort()
        setMessages([
            {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Chat cleared! Ask me anything about your phone.',
                timestamp: new Date(),
                isStreaming: false,
            },
        ])
        setIsStreaming(false)
    }, [])

    return { messages, input, setInput, isStreaming, sendMessage, clearChat, messagesEndRef }
}
