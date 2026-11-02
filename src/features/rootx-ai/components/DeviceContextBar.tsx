import { Smartphone, Battery, HardDrive, ShieldAlert, Activity } from 'lucide-react'

const chips = [
    { icon: Smartphone, label: 'Samsung A52', tone: 'text-accent' },
    { icon: Battery, label: '84% health', tone: 'text-success' },
    { icon: HardDrive, label: '30GB free', tone: 'text-text-tertiary' },
    { icon: ShieldAlert, label: '4 risky apps', tone: 'text-warning' },
    { icon: Activity, label: '12 background', tone: 'text-danger' },
]

export function DeviceContextBar() {
    return (
        <div
            className="flex items-center gap-2 px-4 py-2 overflow-x-auto bg-surface-1 border-b border-border"
            style={{ scrollbarWidth: 'none' }}
            aria-label="Device context"
        >
            {chips.map((chip) => {
                const Icon = chip.icon
                return (
                    <div
                        key={chip.label}
                        className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-full bg-surface-2 border border-border"
                    >
                        <Icon className={`w-3 h-3 ${chip.tone}`} aria-hidden="true" />
                        <span className="font-sans text-[11.5px] text-text-secondary whitespace-nowrap">
                            {chip.label}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
