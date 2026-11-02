import { motion } from 'framer-motion'
import { useRiskScore } from '@/hooks/useRiskScore'
import { Clock, ExternalLink, Scan } from 'lucide-react'
import type { ScanResult } from '@/types/api'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/shared/Card'

interface Props {
    items: ScanResult[]
}

function ActivityItem({ item, index }: { item: ScanResult; index: number }) {
    const risk = useRiskScore(item.riskScore)
    const RiskIcon = risk.icon

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs}h ago`
        return `${Math.floor(hrs / 24)}d ago`
    }

    return (
        <motion.div
            className="group relative flex items-center gap-3 sm:gap-4 pl-4 pr-3 py-3 rounded-xl overflow-hidden bg-surface-2 border border-border transition-colors duration-200 hover:border-border-strong hover:bg-surface-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25, ease: 'easeOut' }}
        >
            {/* Risk accent rail */}
            <span
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: risk.color }}
                aria-hidden="true"
            />

            <span
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${risk.color}1A`, color: risk.color }}
                aria-hidden="true"
            >
                <RiskIcon className="w-[18px] h-[18px]" />
            </span>

            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-mono font-medium text-text-primary truncate">{item.input}</p>
                <div className="flex items-center gap-2.5 mt-1.5">
                    <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.1em]"
                        style={{
                            color: risk.color,
                            backgroundColor: `${risk.color}1A`,
                            border: `1px solid ${risk.color}33`,
                        }}
                    >
                        {risk.label}
                    </span>
                    <span className="text-[11.5px] text-text-tertiary flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        {timeAgo(item.scannedAt)}
                    </span>
                </div>
            </div>

            <ExternalLink
                className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                aria-hidden="true"
            />
        </motion.div>
    )
}

export function RecentActivityFeed({ items }: Props) {
    if (!items.length) {
        return (
            <Card padding="none">
                <EmptyState icon={Scan} title="No scans yet" message="Start scanning to see activity here." />
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="mb-4 items-start">
                <div className="min-w-0">
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest scan results</CardDescription>
                </div>
                <span className="text-[11px] font-medium text-text-tertiary shrink-0 tabular-nums">
                    {items.length} total
                </span>
            </CardHeader>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {items.slice(0, 5).map((item, i) => (
                    <ActivityItem key={item.id} item={item} index={i} />
                ))}
            </div>
        </Card>
    )
}
