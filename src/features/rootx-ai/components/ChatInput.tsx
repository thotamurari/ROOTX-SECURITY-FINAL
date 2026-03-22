import { useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSend: (text: string) => void
    isLoading: boolean
}

export function ChatInput({ value, onChange, onSend, isLoading }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (value.trim() && !isLoading) onSend(value)
        }
    }

    // Auto resize textarea
    useEffect(() => {
        const ta = textareaRef.current
        if (ta) {
            ta.style.height = 'auto'
            ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
        }
    }, [value])

    return (
        <div className="px-4 pb-4 pt-2 max-w-3xl mx-auto w-full">
            <div className="flex gap-3 items-end bg-[#0D0D14] border border-[#2A2A40] rounded-2xl p-3 focus-within:border-[rgba(123,97,255,0.5)] transition-colors duration-200">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your phone..."
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none outline-none resize-none font-sans text-sm text-[#F0F0FF] placeholder-[#44445A] leading-relaxed disabled:opacity-50"
                    style={{ maxHeight: '120px' }}
                />
                <button
                    onClick={() => value.trim() && !isLoading && onSend(value)}
                    disabled={!value.trim() || isLoading}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 bg-[#7B61FF] text-white hover:bg-[#6B51EF] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
            </div>
            <p className="font-sans text-[10px] text-[#44445A] text-center mt-2">
                RootX-AI uses your device data to give personalized answers
            </p>
        </div>
    )
}
