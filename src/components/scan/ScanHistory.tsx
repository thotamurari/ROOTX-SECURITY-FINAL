import { useRiskScore } from '@/hooks/useRiskScore'
import { Clock, ChevronRight } from 'lucide-react'
import type { ScanResult } from '@/types/api'
import { EmptyState } from '@/components/shared/EmptyState'
import { RiskBadge, getRiskLevel } from '@/components/shared/RiskBadge'
import { Scan } from 'lucide-react'

interface Props {
    items: ScanResult[]
    onSelect?: (id: string) => void
}

const COLUMNS = ['Input', 'Type', 'Score', 'Level', 'Date']

/** Desktop table row. */
function HistoryRow({ item, onSelect }: { item: ScanResult; onSelect?: (id: string) => void }) {
    const risk = useRiskScore(item.riskScore)
    const RiskIcon = risk.icon
    const interactive = Boolean(onSelect)

    return (
        <tr
            onClick={() => onSelect?.(item.id)}
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? 'button' : undefined}
            aria-label={interactive ? `Open scan result for ${item.input}` : undefined}
            onKeyDown={(e) => {
                if (interactive && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onSelect?.(item.id)
                }
            }}
            className={`border-b border-border last:border-0 transition-colors ${
                interactive ? 'cursor-pointer hover:bg-surface-2' : ''
            }`}
        >
            <td className="py-3 px-4">
                <div className="flex items-center gap-3 min-w-0">
                    <RiskIcon className="w-4 h-4 shrink-0" style={{ color: risk.color }} aria-hidden="true" />
                    <span className="text-[13px] font-mono text-text-primary truncate max-w-[220px]">
                        {item.input}
                    </span>
                </div>
            </td>
            <td className="py-3 px-4">
                <span className="text-[12px] font-medium text-text-secondary capitalize">{item.scanType}</span>
            </td>
            <td className="py-3 px-4">
                <span className="text-[13.5px] font-bold tabular-nums" style={{ color: risk.color }}>
                    {item.riskScore}
                </span>
            </td>
            <td className="py-3 px-4">
                <RiskBadge level={getRiskLevel(item.riskScore)} size="sm" />
            </td>
            <td className="py-3 px-4">
                <span className="text-[12px] text-text-tertiary inline-flex items-center gap-1.5 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {new Date(item.scannedAt).toLocaleDateString()}
                </span>
            </td>
        </tr>
    )
}

/** Mobile stacked card — same data, no horizontal scrolling. */
function HistoryCard({ item, onSelect }: { item: ScanResult; onSelect?: (id: string) => void }) {
    const risk = useRiskScore(item.riskScore)
    const RiskIcon = risk.icon
    const interactive = Boolean(onSelect)

    const content = (
        <>
            <div className="flex items-start gap-3 min-w-0">
                <RiskIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: risk.color }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-mono text-text-primary break-all line-clamp-2">{item.input}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11.5px] text-text-tertiary">
                        <span className="capitalize">{item.scanType}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {new Date(item.scannedAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                {interactive && (
                    <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" aria-hidden="true" />
                )}
            </div>
            <div className="flex items-center gap-2 mt-3">
                <RiskBadge level={getRiskLevel(item.riskScore)} size="sm" />
                <span className="text-[12.5px] font-bold tabular-nums ml-auto" style={{ color: risk.color }}>
                    {item.riskScore}
                    <span className="text-text-tertiary font-normal">/100</span>
                </span>
            </div>
        </>
    )

    if (!interactive) {
        return <li className="p-4 border-b border-border last:border-0">{content}</li>
    }

    return (
        <li className="border-b border-border last:border-0">
            <button
                type="button"
                onClick={() => onSelect?.(item.id)}
                aria-label={`Open scan result for ${item.input}`}
                className="w-full text-left p-4 min-h-[44px] hover:bg-surface-2 transition-colors"
            >
                {content}
            </button>
        </li>
    )
}

export function ScanHistory({ items, onSelect }: Props) {
    if (!items.length) {
        return <EmptyState icon={Scan} title="No scan history" message="Your scan results will appear here." />
    }

    return (
        <div className="bg-surface-1 border border-border rounded-2xl shadow-xs overflow-hidden">
            {/* Mobile: stacked cards */}
            <ul className="sm:hidden">
                {items.map((item) => (
                    <HistoryCard key={item.id} item={item} onSelect={onSelect} />
                ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                    <caption className="sr-only">Scan history</caption>
                    <thead>
                        <tr className="border-b border-border bg-surface-2">
                            {COLUMNS.map((header) => (
                                <th
                                    key={header}
                                    scope="col"
                                    className="text-left py-3 px-4 text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider"
                                >
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
