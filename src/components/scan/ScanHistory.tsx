import { useRiskScore } from '@/hooks/useRiskScore'
import { Clock } from 'lucide-react'
import type { ScanResult } from '@/types/api'
import { EmptyState } from '@/components/shared/EmptyState'
import { Scan } from 'lucide-react'

interface Props {
    items: ScanResult[]
    onSelect?: (id: string) => void
}

function HistoryRow({ item, onSelect }: { item: ScanResult; onSelect?: (id: string) => void }) {
    const risk = useRiskScore(item.riskScore)
    const RiskIcon = risk.icon

    return (
        <tr
            onClick={() => onSelect?.(item.id)}
            className="border-b border-[rgba(0,255,255,0.1)] hover:bg-[rgba(0,255,255,0.05)] cursor-pointer transition-colors"
        >
            <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                    <RiskIcon className="w-4 h-4 flex-shrink-0 drop-shadow-[0_0_8px_currentColor]" style={{ color: risk.color }} />
                    <span className="text-[14px] font-mono text-white truncate max-w-[200px]">{item.input}</span>
                </div>
            </td>
            <td className="py-3 px-4">
                <span className="text-[12px] font-mono text-[#B0BEC5] font-bold uppercase tracking-wider">{item.scanType}</span>
            </td>
            <td className="py-3 px-4">
                <span className="text-[14px] font-orbitron font-bold" style={{ color: risk.color, textShadow: '0 0 10px currentColor' }}>{item.riskScore}</span>
            </td>
            <td className="py-3 px-4">
                <span className={risk.badgeClass}>{risk.label}</span>
            </td>
            <td className="py-3 px-4">
                <span className="text-[12px] font-mono text-[#607D8B] flex items-center gap-1.5 uppercase tracking-wide">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.scannedAt).toLocaleDateString()}
                </span>
            </td>
        </tr>
    )
}

export function ScanHistory({ items, onSelect }: Props) {
    if (!items.length) {
        return <EmptyState icon={Scan} title="No scan history" message="Your scan results will appear here." />
    }

    return (
        <div className="rounded-[16px] bg-[linear-gradient(135deg,rgba(17,24,39,0.95)_0%,rgba(13,17,23,0.90)_100%)] border border-[rgba(0,255,255,0.1)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-[20px]">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[rgba(0,255,255,0.2)] bg-[rgba(0,255,255,0.02)]">
                            {['Input', 'Type', 'Score', 'Level', 'Date'].map((header) => (
                                <th key={header} className="text-left py-4 px-4 text-[12px] font-orbitron font-bold text-[#00FFFF] uppercase tracking-[2px]" style={{ textShadow: '0 0 10px rgba(0,255,255,0.3)' }}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <HistoryRow key={item.id} item={item} onSelect={onSelect} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
