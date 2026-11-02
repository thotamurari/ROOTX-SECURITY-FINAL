const QUICK_PROMPTS = [
    { icon: '🎮', text: 'Can I install BGMI on my phone?' },
    { icon: '🐢', text: 'Why is my phone slow?' },
    { icon: '🗑️', text: 'Which apps should I delete?' },
    { icon: '🏦', text: 'Is my phone safe for banking?' },
    { icon: '🔋', text: 'How to improve battery life?' },
    { icon: '💾', text: 'What is using most storage?' },
    { icon: '🛡️', text: 'Are my app permissions safe?' },
    { icon: '📱', text: 'Should I update my Android?' },
]

export function QuickPrompts({ onSelect }: { onSelect: (text: string) => void }) {
    return (
        <div className="px-4 pb-3 max-w-3xl mx-auto w-full">
            <p className="font-sans text-[11.5px] font-medium text-text-tertiary mb-2 ml-1 uppercase tracking-wide">
                Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.slice(0, 4).map((p) => (
                    <button
                        key={p.text}
                        onClick={() => onSelect(p.text)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-surface-2 hover:bg-surface-3 hover:border-border-strong text-text-secondary hover:text-text-primary transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                    >
                        <span className="text-[13px] leading-none" aria-hidden="true">
                            {p.icon}
                        </span>
                        <span className="font-sans text-[12.5px] leading-none whitespace-nowrap">{p.text}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
