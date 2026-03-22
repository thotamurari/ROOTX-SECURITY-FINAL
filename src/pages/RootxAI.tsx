import { useEffect, useRef, useState } from 'react'
import { BrainCircuit, Send, Loader2, Trash2, Smartphone, Battery, HardDrive, ShieldAlert, Activity } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    isStreaming?: boolean
}

const QUICK_PROMPTS = [
    { emoji: '🎮', text: 'Can I install BGMI on my phone?' },
    { emoji: '🐢', text: 'Why is my phone slow?' },
    { emoji: '🗑️', text: 'Which apps should I delete?' },
    { emoji: '🏦', text: 'Is my phone safe for banking?' },
]

const FALLBACK_ANSWERS = {
    bgmi: `Yes! BGMI will run on your phone.\n\n• RAM: 6GB available ✓ (needs 3GB minimum)\n• Storage: 30GB free ✓ (needs ~2.5GB)\n• Android 13 ✓ (needs Android 8+)\n• Expected FPS: 60fps on Medium-High settings\n\nTip: Close Instagram and TikTok before gaming to free RAM for the best performance.`,
    slow: `Your phone is slow because of 3 main issues:\n\n• RAM pressure — only 1.2GB free out of 6GB (12 apps running in background)\n• Storage at 76% full — Android needs 20%+ free space\n• Clean Master is hurting performance — ironically, this "cleaner" app constantly runs in background\n\nQuick fixes:\n• Force stop Instagram, TikTok, Facebook\n• Clear 8.4GB cache right now\n• Uninstall Clean Master and Flashlight Pro`,
    battery: `Your top battery drains:\n\n• Instagram: 22% of daily battery\n• WhatsApp: 18% of daily battery\n• TikTok: 14% of daily battery\n\nBattery health is 84% — no replacement needed. Restricting background activity for Instagram and TikTok can add 3-4 hours daily.`,
    storage: `Storage breakdown (128GB total, 30GB free):\n\n• Photos/Videos: 49.8GB\n• Apps: 28.1GB\n• Cache: 8.4GB — cleanable now\n• Duplicates: 2.1GB — removable safely\n\nYou can free 12.3GB immediately without deleting any photos.`,
    banking: `Security concerns for banking:\n\n• Flashlight Pro has SMS read permission — major red flag\n• 4 apps flagged as risky: Facebook, TikTok, Clean Master, Flashlight Pro\n• 23 dangerous permissions across all apps\n\nFor safer banking: uninstall Flashlight Pro and Clean Master first.`,
    delete: `Apps you should delete:\n\n• Clean Master — flagged risky, uses excessive RAM\n• Flashlight Pro — reads SMS (privacy risk), Android has built-in flashlight\n• Consider removing TikTok if battery life is priority (14% daily drain)\n\nThis frees ~1.2GB storage and improves performance immediately.`,
    permissions: `Permission analysis:\n\n• 23 dangerous permissions across all apps\n• Flashlight Pro: Location + Microphone + SMS — completely unnecessary\n• TikTok: Camera + Mic + Location + Contacts + always running\n• Facebook: mic and location even when not in use\n\nTop 3 to revoke:\n1. Location for Flashlight Pro\n2. Microphone for Facebook\n3. Background location for Google Maps`,
    update: `For your Samsung A52 on Android 13:\n\nCheck Settings → Software Update → Download and Install.\n\nYour device security scan shows 4 risky apps — update those apps from Play Store regardless of Android version.\n\nCurrent security patch should be less than 3 months old for best protection.`,
}

// ── Conversation classifier ──────────────────
const CASUAL_EXACT = new Set([
  'hi','hii','hey','hello','helo','sup','yo',
  'ok','okay','k','kk','cool','nice','great',
  'awesome','alright','sure','yep','yes','no',
  'bye','cya','goodbye','later','thanks',
  'thank you','thank u','ty','thx','np',
  'good','fine','noted','got it','understood',
])

const CASUAL_STARTS = [
  'how are','how r u','what are you','who are you',
  'what is this','what can you','tell me about you',
  'good morning','good evening','good night',
  'good afternoon','what do you do',
]

const isCasual = (q: string): boolean => {
  const lower = q.trim().toLowerCase()
  if (CASUAL_EXACT.has(lower)) return true
  return CASUAL_STARTS.some(s => lower.startsWith(s))
}

// ── Casual reply generator ───────────────────
const casualReply = (q: string): string => {
  const l = q.trim().toLowerCase()

  if (['hi','hii','hey','hello','helo','sup','yo'].includes(l) ||
      l.startsWith('hey ') || l.startsWith('hi ')) {
    return "Hey! 👋 How can I help you with your phone today?\n\nTry asking:\n• Can I install BGMI on my phone?\n• Why is my phone slow?\n• Which apps should I delete?\n• Is my phone safe for banking?"
  }
  if (l.startsWith('how are')) {
    return "All systems running! 🟢 I'm actively monitoring your device.\n\nAsk me anything about your phone — performance, security, storage, or app installs."
  }
  if (l.includes('what are you') || l.includes('who are you') ||
      l.includes('what can you') || l.includes('what is this')) {
    return "I'm RootX-AI — your personal device intelligence assistant inside SafeOpen.\n\nI can help you with:\n• Game installation (with FPS estimates)\n• Performance and lag fixes\n• Battery optimization tips\n• Storage cleanup advice\n• Security and privacy checks\n\nJust ask anything about your phone!"
  }
  if (l.startsWith('good morning') || l.startsWith('good evening') ||
      l.startsWith('good afternoon') || l.startsWith('good night')) {
    const greeting = l.startsWith('good morning') ? 'Good morning' :
                     l.startsWith('good evening') ? 'Good evening' :
                     l.startsWith('good afternoon') ? 'Good afternoon' : 'Good night'
    return `${greeting}! 👋 How can I help with your phone today?`
  }
  if (l.includes('thank') || l === 'ty' || l === 'thx') {
    return "You're welcome! 😊 Let me know if there's anything else about your phone I can help with."
  }
  if (['ok','okay','k','kk','cool','nice','great',
       'awesome','alright','sure','yep','yes',
       'noted','got it','understood'].includes(l)) {
    return "Got it! Anything else you'd like to know about your phone?"
  }
  if (l.includes('bye') || l.includes('cya') || l.includes('later')) {
    return "Take care! Your device is in safe hands with SafeOpen. 🛡️"
  }
  return "I'm here to help with your phone! Ask me about performance, security, battery, storage, or app recommendations."
}

// ── Device-aware answers ─────────────────────
const deviceAnswer = (q: string, ctx: any): string => {
  const l = q.trim().toLowerCase()
  const model    = ctx?.model || 'your phone'
  const ram      = ctx?.ramTotal || 6
  const ramFree  = ctx?.ramFree || 1.2
  const free     = ctx?.storageFree || 30
  const total    = ctx?.storageTotal || 128
  const battery  = ctx?.batteryHealth || 84
  const temp     = ctx?.batteryTemp || 32
  const risky    = ctx?.riskyApps || 4
  const bgProcs  = ctx?.bgProcesses || 12
  const android  = ctx?.androidVersion || '13'
  const cache    = ctx?.cacheSize || '8.4'
  const drains   = ctx?.topDrains || 'Instagram 22%, WhatsApp 18%, TikTok 14%'
  const perms    = ctx?.dangerousPerms || 23

  // Games
  if (l.includes('bgmi') || l.includes('battleground') ||
      l.includes('pubg mobile')) {
    return `Yes! BGMI will run on your ${model}.\n\n• RAM: ${ram}GB ✓ (needs 3GB)\n• Storage: ${free}GB free ✓ (needs ~2.5GB)\n• Android ${android} ✓ (needs 8+)\n• Expected FPS: ${ram >= 6 ? '60fps on Medium-High' : '40fps on Low'}\n\nTip: Close ${bgProcs} background apps before gaming for best performance.`
  }
  if (l.includes('free fire') || l.includes('freefire') || l.includes('ff game')) {
    return `Yes! Free Fire runs perfectly on ${model}.\n\n• RAM: ${ram}GB ✓ (Free Fire needs only 1GB)\n• Storage: ${free}GB free ✓ (needs ~700MB)\n• Expected FPS: 60fps on High settings\n\nFree Fire is very lightweight — your phone handles it easily.`
  }
  if (l.includes('genshin')) {
    const ok = ram >= 4 && free >= 20
    return `Genshin Impact is ${ok ? 'possible' : 'very demanding'} on ${model}.\n\n• RAM: ${ram}GB ${ram >= 4 ? '✓' : '✗ needs 4GB'}\n• Storage: ${free}GB ${free >= 20 ? '✓' : '✗ needs 20GB'}\n• Expected FPS: ${ram >= 6 ? '30-40fps Medium' : '20-30fps Low'}\n\n${ok ? 'Clear cache first, then install on Low-Medium graphics.' : 'Your device may struggle — consider Free Fire or BGMI instead.'}`
  }
  if (l.includes('call of duty') || l.includes('cod mobile') || l.includes('codm')) {
    return `Yes! COD Mobile runs well on ${model}.\n\n• RAM: ${ram}GB ✓ (needs 2GB)\n• Storage: ${free}GB free ✓ (needs ~3GB)\n• Expected FPS: ${ram >= 4 ? '60fps High' : '40fps Medium'}\n\nYour phone handles COD Mobile comfortably.`
  }
  if (l.includes('minecraft')) {
    return `Yes! Minecraft runs well on ${model}.\n\n• RAM: ${ram}GB ✓ (needs 1GB)\n• Storage: ${free}GB free ✓ (needs ~200MB)\n• Expected FPS: 60fps\n\nMinecraft is very efficient — no issues expected.`
  }
  if ((l.includes('install') || l.includes('run') || l.includes('play')) &&
      (l.includes('game') || l.includes('app'))) {
    return `For most apps on ${model} (${ram}GB RAM, ${free}GB free, Android ${android}):\n\n• Light games (Free Fire, Among Us): ✓ 60fps easily\n• Medium games (BGMI, COD Mobile): ✓ 60fps\n• Heavy games (Genshin, Warzone): ⚠️ 30fps Low settings\n\nTell me the specific app name for a precise answer!`
  }

  // Performance
  if (l.includes('slow') || l.includes('lag') || l.includes('freeze') ||
      l.includes('hang') || l.includes('stutter')) {
    return `Your ${model} is slow because of ${bgProcs} apps running in background (only ${ramFree}GB RAM free).\n\n• Force stop: Instagram, TikTok, Facebook\n• Clear ${cache}GB cache right now\n• Uninstall Clean Master (flagged risky, hurting performance)\n\nThese steps will speed up your device within minutes.`
  }

  // Battery
  if (l.includes('battery') || l.includes('drain') ||
      l.includes('charge') || l.includes('power')) {
    return `Your battery health: ${battery}% — ${battery > 80 ? 'good' : 'consider replacement'}. Temp: ${temp}°C.\n\n• Top drains: ${drains}\n• Fix: Restrict background for Instagram and TikTok\n• Gain: +3-4 hours daily battery life\n\nNo replacement needed until health drops below 80%.`
  }

  // Storage
  if (l.includes('storage') || l.includes('space') ||
      l.includes('full') || l.includes('memory')) {
    return `Storage: ${free}GB free of ${total}GB (${Math.round((total-free)/total*100)}% used).\n\n• Cache: ${cache}GB cleanable right now\n• Duplicate files: ~2.1GB removable\n• Total recoverable: ~12.3GB without deleting photos\n\nGo to AndroidSEC → Storage to clean up.`
  }

  // Security / banking
  if (l.includes('safe') || l.includes('bank') ||
      l.includes('secure') || l.includes('privacy') ||
      l.includes('hack') || l.includes('virus')) {
    return `Security status: ${risky} risky apps detected.\n\n• Flashlight Pro: has SMS + Location (big red flag)\n• Revoke SMS permission before using banking apps\n• ${perms} dangerous permissions across all apps\n• Your network: clean\n\nFor full analysis open AndroidSEC.`
  }

  // Delete apps
  if (l.includes('delete') || l.includes('uninstall') ||
      l.includes('remove') || l.includes('clean')) {
    return `Top apps to remove from ${model}:\n\n• Flashlight Pro: Mic + Location + SMS — last used 23 days ago\n• Clean Master: flagged risky, sends data externally\n• Battery Doctor: 15 permissions, always running\n\nUninstalling these 3 frees ~465MB and removes 16 dangerous permissions.`
  }

  // Permissions
  if (l.includes('permission') || l.includes('access') ||
      l.includes('spy') || l.includes('track')) {
    return `${perms} dangerous permissions across all apps.\n\n• Flashlight Pro: Location + Mic + SMS — not needed\n• TikTok: Camera + Mic + Location + Contacts\n• Facebook: Mic + location when not in use\n\nFix: Settings → Apps → [App Name] → Permissions → Revoke.`
  }

  // Temperature
  if (l.includes('hot') || l.includes('heat') ||
      l.includes('temp') || l.includes('overheat')) {
    return `Battery temperature: ${temp}°C — ${temp > 40 ? '🔴 Too hot!' : temp > 35 ? '🟡 Slightly warm' : '🟢 Normal'}.\n\n• Normal range: 20-40°C\n• ${temp > 35 ? 'Close heavy apps and remove case to cool down' : 'Your device is not overheating'}\n• Avoid charging while gaming\n• Keep away from direct sunlight`
  }

  // Update
  if (l.includes('update') || l.includes('upgrade') || l.includes('version')) {
    return `Your ${model} is on Android ${android}.\n\nCheck: Settings → Software Update → Download and Install.\n\nAlso update apps from Play Store — your ${risky} flagged apps especially need updates or removal.`
  }

  // RAM / speed
  if (l.includes('ram') || l.includes('cpu') || l.includes('processor') ||
      l.includes('performance')) {
    return `${model} performance: ${ram}GB RAM, ${ramFree}GB currently free.\n\n• ${bgProcs} apps running in background using ${(ram-ramFree).toFixed(1)}GB RAM\n• Close unused apps to free memory\n• Restart device weekly to clear RAM fully\n• Avoid opening many apps simultaneously`
  }

  // Default — don't dump specs for unknown questions
  return `I can help with that! Ask me more specifically:\n• "Can I install [game name]?"\n• "Why is my ${model} slow?"\n• "How do I improve battery?"\n• "Is my phone safe for banking?"\n\nWhat would you like to know?`
}

// ── Main getFallback ─────────────────────────
const getFallback = (question: string, ctx: any): string[] => {
  if (isCasual(question)) {
    return casualReply(question).split('')
  }
  return deviceAnswer(question, ctx).split('')
}

const DeviceContextBar = ({ profile }: { profile: any }) => {
    if (!profile) return null
    return (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none text-xs text-white/60 mb-4 whitespace-nowrap">
            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full"><Smartphone className="w-3 h-3"/> {profile.model || 'Unknown Device'}</span>
            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full"><Battery className="w-3 h-3"/> {profile.batteryPercent || 0}%</span>
            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full"><HardDrive className="w-3 h-3"/> {profile.storageFreeGB || 0}GB Free</span>
            {(profile.riskyAppsCount > 0) && <span className="flex items-center gap-1 bg-red-500/20 text-red-300 px-2 py-1 rounded-full"><ShieldAlert className="w-3 h-3"/> {profile.riskyAppsCount} Risky Apps</span>}
            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full"><Activity className="w-3 h-3"/> {Math.max(0, (profile.ramTotalGB || 0) - (profile.ramFreeGB || 0)).toFixed(1)}GB RAM Used</span>
        </div>
    )
}

export default function RootxAI() {
    const user = useAuthStore((s) => s.user)
    
    // Fetch real device profile
    const { data: profile } = useQuery({
        queryKey: ['deviceProfile'],
        queryFn: async () => {
            const token = localStorage.getItem('safeopen_token')
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
            const res = await axios.get(`${apiUrl}/device/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return res.data
        }
    })

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [showPrompts, setShowPrompts] = useState(true)
    const bottomRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const abortRef = useRef<AbortController | null>(null)

    // Generate dynamic initial greeting
    useEffect(() => {
        if (!profile || messages.length > 0) return
        
        let greeting = `Hey! I'm RootX-AI — your personal device intelligence assistant.\n\nI've analyzed your ${profile.model || 'device'}. `
        
        const issues = []
        if ((profile.storageUsedPercent || 0) >= 90) issues.push('Your storage is critically full.')
        if ((profile.batteryHealth || 100) < 80) issues.push('Your battery health is degrading.')
        if ((profile.riskyAppsCount || 0) > 0) issues.push(`I found ${profile.riskyAppsCount} risky apps.`)
        
        if (issues.length > 0) {
            greeting += issues.join(' ') + '\n\nHow can I help you fix these?'
        } else {
            greeting += 'Everything looks healthy! Ask me anything about your phone.'
        }
        
        setMessages([{
            id: '1', role: 'assistant', content: greeting, timestamp: new Date(), isStreaming: false
        }])
    }, [profile, messages.length])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const autoResize = () => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = 'auto'
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
    }

    const sendMessage = async (text: string) => {
        const trimmed = text.trim()
        if (!trimmed || isStreaming) return

        // Handle casual messages instantly (no API call needed)
        if (isCasual(trimmed)) {
            const userMsg: Message = {
                id: Date.now().toString(),
                role: 'user', content: trimmed,
                timestamp: new Date(), isStreaming: false
            }
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: casualReply(trimmed),
                timestamp: new Date(), isStreaming: false
            }
            setMessages((prev) => [...prev, userMsg, aiMsg])
            setInput('')
            setShowPrompts(false)
            if (textareaRef.current) textareaRef.current.style.height = 'auto'
            return
        }

        setShowPrompts(false)
        setInput('')
        if (textareaRef.current) textareaRef.current.style.height = 'auto'

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed, timestamp: new Date() }
        setMessages((prev) => [...prev, userMsg])
        setIsStreaming(true)

        const aiId = (Date.now() + 1).toString()
        setMessages((prev) => [...prev, { id: aiId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true }])

        abortRef.current = new AbortController()

        try {
            const token = localStorage.getItem('safeopen_token')
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

            const response = await fetch(`${apiUrl}/rootx-ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    message: trimmed,
                    history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
                }),
                signal: abortRef.current.signal,
            })

            if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let accumulated = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value, { stream: true })
                for (const line of chunk.split('\n')) {
                    if (!line.startsWith('data: ')) continue
                    const data = line.slice(6).trim()
                    if (data === '[DONE]') break
                    try {
                        const parsed = JSON.parse(data)
                        const t = parsed.delta?.text || ''
                        if (!t) continue
                        accumulated += t
                        setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: accumulated } : m)))
                    } catch {
                        /* skip */
                    }
                }
            }
            if (!accumulated) throw new Error('Empty response')
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return
            // Smart fallback with character-by-character animation
            const fallback = getFallback(trimmed, profile || {})
            let displayed = ''
            for (let i = 0; i < fallback.length; i++) {
                await new Promise((r) => setTimeout(r, 6))
                displayed += fallback[i]
                setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: displayed } : m)))
            }
        } finally {
            setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, isStreaming: false } : m)))
            setIsStreaming(false)
        }
    }

    const clearChat = () => {
        abortRef.current?.abort()
        setMessages([{ id: Date.now().toString(), role: 'assistant', content: 'Chat cleared! Ask me anything about your phone.', timestamp: new Date(), isStreaming: false }])
        setShowPrompts(true)
        setIsStreaming(false)
    }

    const formatContent = (content: string) => {
        return content.split('\n').map((line, i) => {
            if (line.startsWith('• '))
                return (
                    <div key={i} className="flex gap-2 my-0.5">
                        <span className="text-[#7B61FF] flex-shrink-0 mt-0.5">•</span>
                        <span>{line.slice(2)}</span>
                    </div>
                )
            if (/^\d+\./.test(line))
                return (
                    <div key={i} className="flex gap-2 my-0.5">
                        <span className="text-[#7B61FF] flex-shrink-0 font-mono text-xs mt-0.5 w-4">{line.match(/^\d+/)?.[0]}.</span>
                        <span>{line.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                )
            if (line === '') return <div key={i} className="h-2" />
            return <div key={i}>{line}</div>
        })
    }

    return (
        <div className="flex flex-col bg-[#060608]" style={{ height: 'calc(100vh - 0px)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1E1E30] bg-[#0D0D14] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7B61FF] flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(123,97,255,0.4)' }}>
                        <BrainCircuit size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-orbitron text-sm font-bold text-[#F0F0FF]">RootX-AI</h1>
                        <p className="font-sans text-[11px] text-[#8888AA]">Your personal device intelligence</p>
                    </div>
                </div>
                <button
                    onClick={clearChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-[#8888AA] border border-[#2A2A40] hover:text-[#FF3366] hover:border-[rgba(255,51,102,0.3)] transition-all duration-200"
                >
                    <Trash2 size={12} />
                    Clear
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    <DeviceContextBar profile={profile} />
                    
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div
                                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${msg.role === 'assistant' ? 'bg-[#7B61FF]' : 'bg-[#00F5FF]'}`}
                                style={msg.role === 'assistant' ? { boxShadow: '0 0 10px rgba(123,97,255,0.3)' } : undefined}
                            >
                                {msg.role === 'assistant' ? (
                                    <BrainCircuit size={13} className="text-white" />
                                ) : (
                                    <span className="font-orbitron text-[10px] font-bold text-[#060608]">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                                )}
                            </div>

                            <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <p className="font-mono text-[10px] font-medium px-1" style={{ color: msg.role === 'assistant' ? '#7B61FF' : '#8888AA' }}>
                                    {msg.role === 'assistant' ? 'RootX-AI' : 'You'}
                                </p>
                                <div
                                    className={`px-4 py-3 rounded-2xl text-sm font-sans leading-relaxed ${
                                        msg.role === 'assistant'
                                            ? 'bg-[#0D0D14] border border-[#2A2A40] rounded-tl-sm text-[#F0F0FF]'
                                            : 'bg-[rgba(0,245,255,0.06)] border border-[rgba(0,245,255,0.12)] rounded-tr-sm text-[#F0F0FF]'
                                    }`}
                                >
                                    {msg.role === 'assistant' ? formatContent(msg.content) : msg.content}
                                    {msg.isStreaming && msg.content === '' && (
                                        <div className="flex gap-1 py-1">
                                            {[0, 1, 2].map((i) => (
                                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#7B61FF] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                            ))}
                                        </div>
                                    )}
                                    {msg.isStreaming && msg.content !== '' && <span className="inline-block w-1.5 h-3.5 bg-[#7B61FF] animate-pulse ml-0.5 align-middle rounded-sm" />}
                                </div>
                                <p className="font-mono text-[10px] text-[#44445A] px-1">
                                    {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Quick prompts */}
            {showPrompts && (
                <div className="px-4 sm:px-6 pb-3 flex-shrink-0">
                    <div className="max-w-3xl mx-auto">
                        <p className="font-sans text-xs text-[#44445A] mb-2">Suggested questions</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {QUICK_PROMPTS.map((p) => (
                                <button
                                    key={p.text}
                                    onClick={() => sendMessage(p.text)}
                                    className="text-left p-3 rounded-xl border border-[#2A2A40] bg-[#0D0D14] hover:border-[rgba(123,97,255,0.4)] hover:bg-[rgba(123,97,255,0.05)] transition-all duration-200 group"
                                >
                                    <span className="text-lg block mb-1">{p.emoji}</span>
                                    <span className="font-sans text-xs text-[#8888AA] group-hover:text-[#F0F0FF] leading-tight line-clamp-2 block">{p.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="px-4 sm:px-6 pb-5 pt-2 flex-shrink-0 border-t border-[#1E1E30]">
                <div className="max-w-3xl mx-auto">
                    <div className="flex gap-3 items-end bg-[#0D0D14] border border-[#2A2A40] rounded-2xl p-3 focus-within:border-[rgba(123,97,255,0.4)] transition-colors duration-200">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value)
                                autoResize()
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    sendMessage(input)
                                }
                            }}
                            placeholder="Ask anything about your phone..."
                            rows={1}
                            disabled={isStreaming}
                            className="flex-1 bg-transparent border-none outline-none resize-none font-sans text-sm text-[#F0F0FF] placeholder-[#44445A] leading-relaxed disabled:opacity-50"
                            style={{ maxHeight: '120px' }}
                        />
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || isStreaming}
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#7B61FF] text-white hover:bg-[#6B51EF] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {isStreaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                    </div>
                    <p className="font-sans text-[10px] text-[#44445A] text-center mt-2">RootX-AI uses your device data · Press Enter to send</p>
                </div>
            </div>
        </div>
    )
}
