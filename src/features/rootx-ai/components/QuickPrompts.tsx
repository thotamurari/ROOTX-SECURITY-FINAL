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
            <p className="font-sans text-xs text-[#44445A] mb-2 ml-1">Suggested questions</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUICK_PROMPTS.slice(0, 4).map((p) => (
                    <button
                        key={p.text}
                        onClick={() => onSelect(p.text)}
                        className="text-left p-3 rounded-xl border border-[#2A2A40] bg-[#0D0D14] hover:border-[rgba(123,97,255,0.5)] hover:bg-[rgba(123,97,255,0.05)] transition-all duration-200 group"
                    >
                        <span className="text-base mb-1 block">{p.icon}</span>
                        <span className="font-sans text-xs text-[#8888AA] group-hover:text-[#F0F0FF] leading-tight line-clamp-2">
                            {p.text}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}
