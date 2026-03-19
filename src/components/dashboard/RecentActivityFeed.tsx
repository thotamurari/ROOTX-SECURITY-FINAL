import { motion } from 'framer-motion'
import { useRiskScore } from '@/hooks/useRiskScore'
import { Clock, ExternalLink } from 'lucide-react'
import type { ScanResult } from '@/types/api'
import { EmptyState } from '@/components/shared/EmptyState'
import { Scan } from 'lucide-react'

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
            className="flex items-center gap-4 p-[14px] px-4 rounded-[12px] group cursor-pointer relative overflow-hidden transition-all duration-200"
            style={{
                background: 'rgba(17, 24, 39, 0.8)',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ 
                x: 4, 
                backgroundColor: 'rgba(0, 255, 255, 0.04)',
                borderColor: 'rgba(0, 255, 255, 0.15)' 
            }}
            transition={{ delay: index * 0.05 }}
        >
            {/* Left colored border */}
            <div 
                className="absolute left-0 top-0 bottom-0 w-1" 
                style={{ backgroundColor: risk.color, boxShadow: `0 0 10px ${risk.color}` }} 
            />

            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${risk.color}1A` }}>
                <RiskIcon className="w-5 h-5 drop-shadow-md" style={{ color: risk.color, filter: `drop-shadow(0 0 4px ${risk.color})` }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[14px] font-mono font-medium text-white truncate">{item.input}</p>
                <div className="flex items-center gap-3 mt-1.5">
                    <span className={risk.badgeClass}>{risk.label}</span>
                    <span className="text-[12px] text-[#607D8B] font-mono flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {timeAgo(item.scannedAt)}
                    </span>
                </div>
            </div>
            <ExternalLink className="w-5 h-5 text-[#607D8B] opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    )
}

export function RecentActivityFeed({ items }: Props) {
    if (!items.length) {
        return <EmptyState icon={Scan} title="No scans yet" message="Start scanning to see activity here." />
    }

    return (
        <div className="p-5 rounded-[16px] bg-[linear-gradient(135deg,rgba(17,24,39,0.95)_0%,rgba(13,17,23,0.90)_100%)] backdrop-blur-[20px] border border-cyan/15 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="mb-4">
                <h3 className="text-[20px] font-sans font-bold text-white leading-none">Recent Activity</h3>
                <div className="w-10 h-[3px] bg-cyan rounded-[2px] shadow-[0_0_8px_#00FFFF] mt-1" />
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 select-none">
                {items.slice(0, 5).map((item, i) => (
                    <ActivityItem key={item.id} item={item} index={i} />
                ))}
            </div>
        </div>
    )
}
