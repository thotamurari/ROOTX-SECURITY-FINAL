import React, { useState } from 'react'
import {
    BrainCircuit, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown,
    Cpu, Search, ShieldAlert, ShieldCheck, Info, CheckCircle2,
    AlertTriangle, Terminal, ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import type { ChatMessage as ChatMessageType } from '../stores/chatHistoryStore'

interface ChatMessageProps {
    message: ChatMessageType
    isLatest?: boolean
    onRegenerate?: (messageId: string) => void
    onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void
}

function formatTime(timestamp: string): string {
    try {
        const d = new Date(timestamp)
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
        return ''
    }
}

/** Parses inline markdown: bold (**text**), inline code (`code`), and plain text */
function renderInlineFormatting(text: string): React.ReactNode {
    // Regex splits by code blocks `...` and bold **...**
    const tokens: React.ReactNode[] = []
    let cursor = 0
    const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
        if (match.index > cursor) {
            tokens.push(text.slice(cursor, match.index))
        }
        const fullMatch = match[0]
        if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
            tokens.push(
                <code
                    key={match.index}
                    className="font-mono text-[12px] px-1.5 py-0.5 rounded bg-surface-3 border border-border text-accent"
                >
                    {fullMatch.slice(1, -1)}
                </code>
            )
        } else if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
            tokens.push(
                <strong key={match.index} className="font-semibold text-text-primary">
                    {fullMatch.slice(2, -2)}
                </strong>
            )
        }
        cursor = regex.lastIndex
    }

    if (cursor < text.length) {
        tokens.push(text.slice(cursor))
    }

    return tokens.length > 0 ? tokens : text
}

function getSectionMeta(title: string) {
    const lower = title.toLowerCase()
    if (lower.includes('status') || lower.includes('telemetry') || lower.includes('hardware')) {
        return { icon: Cpu, color: 'text-accent', border: 'border-l-accent bg-accent/5' }
    }
    if (lower.includes('found') || lower.includes('detection') || lower.includes('what was')) {
        return { icon: Search, color: 'text-cyan-400', border: 'border-l-cyan-400 bg-cyan-400/5' }
    }
    if (lower.includes('risk') || lower.includes('threat') || lower.includes('severity')) {
        return { icon: ShieldAlert, color: 'text-warning', border: 'border-l-warning bg-warning/5' }
    }
    if (lower.includes('evidence') || lower.includes('proof') || lower.includes('indicator')) {
        return { icon: CheckCircle2, color: 'text-emerald-400', border: 'border-l-emerald-400 bg-emerald-400/5' }
    }
    if (lower.includes('action') || lower.includes('recommend') || lower.includes('remediat') || lower.includes('mitigat')) {
        return { icon: ShieldCheck, color: 'text-accent', border: 'border-l-accent bg-accent/5' }
    }
    if (lower.includes('limitation') || lower.includes('data limitation') || lower.includes('note') || lower.includes('caveat')) {
        return { icon: Info, color: 'text-text-tertiary', border: 'border-l-text-tertiary bg-surface-3/30' }
    }
    return { icon: ChevronRight, color: 'text-accent', border: 'border-l-accent bg-accent/5' }
}

function parseMetricLine(line: string) {
    // Matches e.g. "• RAM Usage: 4.8 GB / 8.0 GB (60.0%)"
    // or "• Status: Normal"
    const cleaned = line.replace(/^[•\-\*]\s*/, '').trim()
    const colonIdx = cleaned.indexOf(':')
    if (colonIdx === -1) return null

    const key = cleaned.slice(0, colonIdx).replace(/\*\*/g, '').trim()
    const val = cleaned.slice(colonIdx + 1).replace(/\*\*/g, '').trim()
    if (!key || !val) return null

    const valLower = val.toLowerCase()
    let badgeType: 'success' | 'warning' | 'danger' | 'info' = 'info'
    if (valLower.includes('safe') || valLower.includes('normal') || valLower.includes('secure') || valLower.includes('verified') || valLower.includes('0 threats') || valLower.includes('clean')) {
        badgeType = 'success'
    } else if (valLower.includes('high') || valLower.includes('critical') || valLower.includes('danger') || valLower.includes('malware') || valLower.includes('threat detected')) {
        badgeType = 'danger'
    } else if (valLower.includes('medium') || valLower.includes('warning') || valLower.includes('caution') || valLower.includes('elevated') || valLower.includes('unverified')) {
        badgeType = 'warning'
    }

    return { key, val, badgeType }
}

export function MarkdownContent({ content }: { content: string }) {
    // Process markdown line by line or by blocks
    const lines = content.split('\n')
    const blocks: React.ReactNode[] = []
    let i = 0

    while (i < lines.length) {
        const line = lines[i]

        // Code block ```lang ... ```
        if (line.trim().startsWith('```')) {
            const lang = line.trim().slice(3).trim()
            const codeLines: string[] = []
            i++
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(lines[i])
                i++
            }
            const codeContent = codeLines.join('\n')
            blocks.push(
                <div key={`code-${i}`} className="my-3 rounded-xl border border-border bg-base/80 overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-surface-3/80 border-b border-border text-2xs text-text-tertiary">
                        <span className="flex items-center gap-1.5 font-mono uppercase">
                            <Terminal className="w-3 h-3 text-accent" />
                            {lang || 'code'}
                        </span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(codeContent)
                                toast.success('Code copied to clipboard')
                            }}
                            className="hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer"
                        >
                            <Copy className="w-2.5 h-2.5" /> Copy
                        </button>
                    </div>
                    <pre className="p-3 font-mono text-[12.5px] text-text-primary overflow-x-auto leading-relaxed">
                        {codeContent}
                    </pre>
                </div>
            )
            i++
            continue
        }

        // Heading 3: "### Heading"
        if (line.trim().startsWith('### ')) {
            const title = line.trim().slice(4).replace(/\*\*/g, '').trim()
            const meta = getSectionMeta(title)
            const Icon = meta.icon
            blocks.push(
                <div key={`h3-${i}`} className={`mt-4 mb-2 pl-3 py-1.5 border-l-2 ${meta.border} rounded-r-lg`}>
                    <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${meta.color} shrink-0`} />
                        <h4 className="text-[13.5px] font-bold text-text-primary tracking-wide">
                            {title}
                        </h4>
                    </div>
                </div>
            )
            i++
            continue
        }

        // Heading 4: "#### Subheading"
        if (line.trim().startsWith('#### ')) {
            const title = line.trim().slice(5).replace(/\*\*/g, '').trim()
            blocks.push(
                <h5 key={`h4-${i}`} className="mt-3 mb-1.5 text-[13px] font-semibold text-text-primary flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {title}
                </h5>
            )
            i++
            continue
        }

        // Bullet list item
        if (/^[•\-\*]\s+/.test(line.trim())) {
            const metric = parseMetricLine(line)
            if (metric) {
                // Render as structured metric row
                const badgeClasses = {
                    success: 'text-success bg-success-soft border border-success/20',
                    warning: 'text-warning bg-warning-soft border border-warning/20',
                    danger: 'text-danger bg-danger-soft border border-danger/20',
                    info: 'text-accent bg-accent-soft border border-accent/20'
                }[metric.badgeType]

                blocks.push(
                    <div key={`metric-${i}`} className="flex items-center justify-between gap-3 py-1 px-2.5 my-1 rounded-lg bg-surface-2/60 border border-border/50 hover:border-border transition-colors">
                        <span className="text-[12.5px] text-text-secondary font-medium">
                            {metric.key}
                        </span>
                        <span className={`font-mono text-[11.5px] font-semibold px-2 py-0.5 rounded-md ${badgeClasses}`}>
                            {metric.val}
                        </span>
                    </div>
                )
            } else {
                blocks.push(
                    <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-1 pl-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                        <div className="text-[13.5px] leading-relaxed text-text-primary">
                            {renderInlineFormatting(line.replace(/^[•\-\*]\s+/, ''))}
                        </div>
                    </div>
                )
            }
            i++
            continue
        }

        // Numbered list item: "1. text"
        const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/)
        if (numMatch) {
            const num = numMatch[1]
            const text = numMatch[2]
            blocks.push(
                <div key={`num-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-accent/10 border border-accent/20 text-accent font-mono text-[11px] font-bold mt-0.5">
                        {num}
                    </span>
                    <div className="text-[13.5px] leading-relaxed text-text-primary flex-1">
                        {renderInlineFormatting(text)}
                    </div>
                </div>
            )
            i++
            continue
        }

        // Empty line
        if (line.trim() === '') {
            blocks.push(<div key={`empty-${i}`} className="h-2" />)
            i++
            continue
        }

        // Regular paragraph text
        blocks.push(
            <p key={`p-${i}`} className="text-[13.5px] leading-relaxed text-text-primary my-1">
                {renderInlineFormatting(line)}
            </p>
        )
        i++
    }

    return <div className="space-y-0.5">{blocks}</div>
}

export function ChatMessage({ message, isLatest, onRegenerate, onFeedback }: ChatMessageProps) {
    const user = useAuthStore((s) => s.user)
    const [copied, setCopied] = useState(false)
    const isAssistant = message.role === 'assistant'

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content)
        setCopied(true)
        toast.success('Response copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
    }

    if (isAssistant) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex gap-3 items-start group"
            >
                <div className="w-8 h-8 rounded-full bg-accent-soft text-accent border border-border flex-shrink-0 flex items-center justify-center mt-0.5 shadow-xs">
                    <BrainCircuit className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 max-w-[88%] sm:max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[11.5px] font-semibold text-text-primary tracking-wide">
                            RootX-AI
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-surface-3 text-text-tertiary">
                            Guardian Engine
                        </span>
                    </div>

                    <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-surface-2 border border-border font-sans shadow-xs transition-colors">
                        <MarkdownContent content={message.content} />

                        {message.isStreaming && message.content === '' && (
                            <div className="flex gap-1.5 py-2" aria-label="RootX-AI is analyzing">
                                {[0, 1, 2].map((idx) => (
                                    <span
                                        key={idx}
                                        className="w-2 h-2 rounded-full bg-accent animate-bounce"
                                        style={{ animationDelay: `${idx * 0.15}s` }}
                                    />
                                ))}
                            </div>
                        )}

                        {message.isStreaming && message.content !== '' && (
                            <span className="inline-block w-1.5 h-3.5 bg-accent animate-pulse ml-1 align-middle rounded-xs" />
                        )}
                    </div>

                    {/* Action Bar beneath assistant message */}
                    {!message.isStreaming && message.content !== '' && (
                        <div className="flex items-center justify-between mt-1.5 px-1">
                            <span className="text-[11px] text-text-tertiary">
                                {formatTime(message.timestamp)}
                            </span>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={handleCopy}
                                    title="Copy response"
                                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-3 transition-colors cursor-pointer"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>

                                {isLatest && onRegenerate && (
                                    <button
                                        onClick={() => onRegenerate(message.id)}
                                        title="Regenerate response"
                                        className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-3 transition-colors cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                {onFeedback && (
                                    <>
                                        <button
                                            onClick={() => onFeedback(message.id, 'like')}
                                            title="Helpful response"
                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                message.feedback === 'like'
                                                    ? 'text-accent bg-accent/10'
                                                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-3'
                                            }`}
                                        >
                                            <ThumbsUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => onFeedback(message.id, 'dislike')}
                                            title="Inaccurate response"
                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                message.feedback === 'dislike'
                                                    ? 'text-danger bg-danger/10'
                                                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-3'
                                            }`}
                                        >
                                            <ThumbsDown className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        )
    }

    // User Message
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex gap-3 items-start justify-end group"
        >
            <div className="max-w-[85%] sm:max-w-[75%] min-w-0">
                <div className="flex items-center justify-end gap-2 mb-1 px-1">
                    <span className="text-[11.5px] font-semibold text-text-tertiary">
                        You
                    </span>
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-accent-soft border border-accent-soft-strong shadow-xs">
                    <p className="font-sans text-[13.5px] text-text-primary leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                    </p>
                </div>
                <p className="text-[11px] text-text-tertiary mt-1 px-1 text-right">
                    {formatTime(message.timestamp)}
                </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-accent text-white flex-shrink-0 flex items-center justify-center mt-0.5 shadow-xs font-bold text-[12px]">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
        </motion.div>
    )
}
