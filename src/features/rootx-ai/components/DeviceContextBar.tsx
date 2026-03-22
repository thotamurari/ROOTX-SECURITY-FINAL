import { Smartphone, Battery, HardDrive, ShieldAlert, Activity } from 'lucide-react'

const chips = [
    { icon: Smartphone, label: 'Samsung A52', color: '#00F5FF' },
    { icon: Battery, label: '84% health', color: '#00FF88' },
    { icon: HardDrive, label: '30GB free', color: '#8888AA' },
    { icon: ShieldAlert, label: '4 risky apps', color: '#FF8C00' },
    { icon: Activity, label: '12 background', color: '#FF3366' },
]

export function DeviceContextBar() {
    return (
        <div
            className="flex items-center gap-3 px-4 py-2.5 overflow-x-auto bg-[#0D0D14] border-b border-[#1E1E30]"
            style={{ scrollbarWidth: 'none' }}
        >
            {chips.map((chip) => (
                <div key={chip.label} className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: chip.color }} />
                    <span className="font-sans text-[11px] text-[#8888AA] whitespace-nowrap">{chip.label}</span>
                </div>
            ))}
        </div>
    )
}
