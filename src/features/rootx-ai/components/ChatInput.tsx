import { useRef, useEffect, useId } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/shared/Button'

interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSend: (text: string) => void
    isLoading: boolean
}

export function ChatInput({ value, onChange, onSend, isLoading }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const inputId = useId()

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
            <label htmlFor={inputId} className="sr-only">
                Ask RootX-AI a question
            </label>
            <div className="flex gap-2 items-end bg-surface-1 border border-border rounded-2xl p-2 pl-4 shadow-xs transition-all duration-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-soft-strong">
                <textarea
                    id={inputId}
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your phone..."
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none outline-none resize-none font-sans text-[14px] text-text-primary placeholder:text-text-tertiary leading-relaxed py-2 disabled:opacity-50"
                    style={{ maxHeight: '120px' }}
                />
                <Button
                    variant="primary"
                    size="icon"
                    aria-label="Send message"
                    onClick={() => value.trim() && !isLoading && onSend(value)}
                    disabled={!value.trim() || isLoading}
                    isLoading={isLoading}
                    className="rounded-xl shrink-0"
                >
                    {!isLoading && <Send className="w-4 h-4" />}
                </Button>
            </div>
            <p className="font-sans text-[11px] text-text-tertiary text-center mt-2">
                RootX-AI uses your device data to give personalized answers
            </p>
        </div>
    )
}
