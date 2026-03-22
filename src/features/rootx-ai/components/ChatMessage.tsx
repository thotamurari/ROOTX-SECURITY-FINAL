import { BrainCircuit } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import type { Message } from '../types/index'

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function FormattedMessage({ content }: { content: string }) {
    const parts = content.split('\n\n').filter(Boolean)

    return (
        <div className="space-y-3">
            {parts.map((part, i) => {
                // Bullet list
                if (part.includes('\n•') || part.startsWith('•')) {
                    const lines = part.split('\n').filter(Boolean)
                    return (
                        <ul key={i} className="space-y-1.5">
                            {lines.map((line, j) =>
                                line.startsWith('•') ? (
                                    <li key={j} className="flex gap-2">
                                        <span className="text-[#7B61FF] mt-0.5 flex-shrink-0">•</span>
                                        <span>{formatBold(line.slice(1).trim())}</span>
                                    </li>
                                ) : (
                                    <li key={j}>
                                        <span className="font-medium">{formatBold(line)}</span>
                                    </li>
                                )
                            )}
                        </ul>
                    )
                }

                // Numbered list
                if (/^\d\./.test(part) || part.includes('\n1.')) {
                    const lines = part.split('\n').filter(Boolean)
                    return (
                        <ol key={i} className="space-y-1.5 list-none">
                            {lines.map((line, j) => (
                                <li key={j} className="flex gap-2">
                                    <span className="text-[#7B61FF] font-mono text-xs mt-0.5 flex-shrink-0 w-4">
                                        {j + 1}.
                                    </span>
                                    <span>{formatBold(line.replace(/^\d\.\s*/, ''))}</span>
                                </li>
                            ))}
                        </ol>
                    )
                }

                // Result/data card
                if (
                    (part.includes(':') && part.includes('✓')) ||
                    (part.includes(':') && (part.includes('GB') || part.includes('fps')))
                ) {
                    return <ResultCard key={i} content={part} />
                }

                // Regular paragraph
                return (
                    <p key={i} className="leading-relaxed">
                        {formatBold(part)}
                    </p>
                )
            })}
        </div>
    )
}

function formatBold(text: string): React.ReactNode {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    if (parts.length === 1) return text
    return parts.map((part, i) =>
        i % 2 === 1 ? (
            <strong key={i} className="font-semibold text-[#F0F0FF]">
                {part}
            </strong>
        ) : (
            part
        )
    )
}

function ResultCard({ content }: { content: string }) {
    const lines = content.split('\n').filter(Boolean)
    return (
        <div className="mt-2 rounded-xl border border-[#2A2A40] bg-[#0D0D14] overflow-hidden">
            {lines.map((line, i) => {
                const colonIdx = line.indexOf(':')
                if (colonIdx === -1)
                    return (
                        <div key={i} className="px-4 py-2 border-b border-[#1E1E30] last:border-0">
                            <span className="text-xs font-medium text-[#8888AA] uppercase tracking-wider">
                                {line}
                            </span>
                        </div>
                    )
                const label = line.slice(0, colonIdx).trim()
                const value = line.slice(colonIdx + 1).trim()
                const isGood = value.includes('✓') || value.toLowerCase().includes('good')
                const isBad = value.includes('✗') || value.toLowerCase().includes('risk')
                const isWarn = value.includes('~') || value.toLowerCase().includes('low')

                return (
                    <div
                        key={i}
                        className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E1E30] last:border-0"
                    >
                        <span className="font-sans text-xs text-[#8888AA]">{label}</span>
                        <span
                            className={`font-mono text-xs font-medium px-2 py-0.5 rounded-md ${
                                isGood
                                    ? 'text-[#00FF88] bg-[rgba(0,255,136,0.1)]'
                                    : isBad
                                      ? 'text-[#FF3366] bg-[rgba(255,51,102,0.1)]'
                                      : isWarn
                                        ? 'text-[#FF8C00] bg-[rgba(255,140,0,0.1)]'
                                        : 'text-[#00F5FF] bg-[rgba(0,245,255,0.1)]'
                            }`}
                        >
                            {value}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

export function TypingIndicator() {
    return (
        <div className="flex gap-4 items-start">
            <div className="w-7 h-7 rounded-full bg-[#7B61FF] flex-shrink-0 flex items-center justify-center">
                <BrainCircuit size={14} className="text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#0D0D14] border border-[#2A2A40] flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#7B61FF] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
        </div>
    )
}

export function ChatMessage({ message }: { message: Message }) {
    const user = useAuthStore((s) => s.user)
    const isAI = message.role === 'assistant'

    if (isAI) {
        return (
            <div className="flex gap-4 items-start group">
                <div
                    className="w-7 h-7 rounded-full bg-[#7B61FF] flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ boxShadow: '0 0 10px rgba(123,97,255,0.3)' }}
                >
                    <BrainCircuit size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-[#7B61FF] mb-1.5 font-medium">RootX-AI</p>
                    <div className="font-sans text-sm text-[#F0F0FF] leading-relaxed">
                        <FormattedMessage content={message.content} />
                        {message.isStreaming && (
                            <span className="inline-block w-2 h-4 bg-[#7B61FF] animate-pulse ml-0.5 align-middle rounded-sm" />
                        )}
                    </div>
                    <p className="font-mono text-[10px] text-[#44445A] mt-2">{formatTime(message.timestamp)}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex gap-4 items-start justify-end group">
            <div className="max-w-[75%]">
                <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-[rgba(0,245,255,0.06)] border border-[rgba(0,245,255,0.12)]">
                    <p className="font-sans text-sm text-[#F0F0FF] leading-relaxed">{message.content}</p>
                </div>
                <p className="font-mono text-[10px] text-[#44445A] mt-1 text-right">
                    {formatTime(message.timestamp)}
                </p>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#00F5FF] flex-shrink-0 flex items-center justify-center mt-0.5">
                <span className="font-orbitron text-[11px] font-bold text-[#060608]">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
            </div>
        </div>
    )
}
