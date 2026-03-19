import { motion } from 'framer-motion'
import { ThreatLevelRing } from '@/components/dashboard/ThreatLevelRing'
import { LiveStatsBar } from '@/components/dashboard/LiveStatsBar'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { QuickScanFAB } from '@/components/dashboard/QuickScanFAB'
import { WorldThreatMapMini } from '@/components/dashboard/WorldThreatMapMini'
import { ThreatIntelFeed } from '@/components/dashboard/ThreatIntelFeed'
import { useBehavioralDNA } from '@/hooks/useBehavioralDNA'
import { useScan } from '@/hooks/useScan'
import { useTrackerMap } from '@/hooks/useTrackerMap'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function Dashboard() {
    const { profile, isLoadingProfile } = useBehavioralDNA()
    const { history, isLoadingHistory } = useScan()
    const { connections } = useTrackerMap()

    const scans = history?.data ?? []
    const todayScans = scans.filter(
        (s) => new Date(s.scannedAt).toDateString() === new Date().toDateString()
    )

    if (isLoadingProfile && isLoadingHistory) {
        return <LoadingSpinner size="lg" text="Loading dashboard..." />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-[32px] font-orbitron font-extrabold text-white" style={{ textShadow: '0 0 30px rgba(0, 255, 255, 0.3)' }}>Dashboard</h1>
                <p className="text-[14px] text-[#B0BEC5] font-mono mt-1">Your security overview at a glance</p>
            </motion.div>

            {/* Top section: Ring + Stats */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <motion.div
                    className="p-6 flex flex-col items-center justify-center rounded-[16px]
                               bg-[linear-gradient(135deg,rgba(0,255,255,0.08)_0%,rgba(17,24,39,0.95)_100%)]
                               border border-cyan/25 shadow-[0_0_40px_rgba(0,255,255,0.08),inset_0_0_40px_rgba(0,255,255,0.03)]"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <p className="text-[11px] text-cyan font-mono font-semibold uppercase tracking-[3px] mb-4">Threat Level</p>
                    <ThreatLevelRing score={profile?.anomalyScore ?? 15} />
                </motion.div>

                <div className="flex-1 w-full space-y-4">
                    <LiveStatsBar
                        scansToday={todayScans.length}
                        threatsBlocked={todayScans.filter((s) => s.threatLevel === 'danger' || s.threatLevel === 'critical').length}
                        safeOpens={todayScans.filter((s) => s.threatLevel === 'safe').length}
                        activeMonitors={3}
                    />

                    {/* Mini map + Threat feed */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <WorldThreatMapMini connections={connections} />
                        <ThreatIntelFeed />
                    </div>
                </div>
            </div>

            {/* Activity Feed */}
            <RecentActivityFeed items={scans} />

            {/* FAB */}
            <QuickScanFAB />
        </div>
    )
}
