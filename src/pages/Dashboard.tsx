import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ThreatLevelRing } from '@/components/dashboard/ThreatLevelRing'
import { LiveStatsBar } from '@/components/dashboard/LiveStatsBar'
import { QuickScanFAB } from '@/components/dashboard/QuickScanFAB'
import { WorldThreatMapMini } from '@/components/dashboard/WorldThreatMapMini'
import { ThreatIntelFeed } from '@/components/dashboard/ThreatIntelFeed'
import { useBehavioralDNA } from '@/hooks/useBehavioralDNA'
import { useScan } from '@/hooks/useScan'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Smartphone, Shield, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function DashboardHeader() {
    const [time, setTime] = useState(new Date())
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(t)
    }, [])

    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
                    <span className="font-mono text-xs text-[#00FF88] tracking-[0.3em] uppercase">System Online</span>
                </div>
                <h1 className="font-orbitron text-2xl sm:text-3xl lg:text-4xl font-black text-[#F0F0FF]" style={{ letterSpacing: '-0.02em' }}>
                    Security Command Center
                </h1>
                <p className="font-mono text-xs text-[#8888AA] mt-1">Real-time threat monitoring · SafeOpen Guardian</p>
            </div>
            <div className="text-right hidden md:block">
                <p className="font-orbitron text-2xl font-bold text-[#00F5FF]">
                    {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                <p className="font-mono text-xs text-[#8888AA]">
                    {time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
            </div>
        </div>
    )
}

function DeviceSecurityStatus() {
    const navigate = useNavigate()
    const checks = [
        { label: 'APK Scanner', status: 'clean', detail: '20 apps scanned' },
        { label: 'Risky Apps', status: 'warning', detail: '4 flagged' },
        { label: 'Permissions', status: 'warning', detail: '23 dangerous' },
        { label: 'Battery Health', status: 'clean', detail: '84% health' },
        { label: 'Storage', status: 'warning', detail: '76% full' },
        { label: 'Network Security', status: 'clean', detail: 'No threats' },
    ]

    return (
        <div className="glass-card p-4 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <Smartphone size={15} className="text-[#00F5FF]" />
                <span className="font-orbitron text-sm font-semibold text-[#F0F0FF]">Device Status</span>
                <button onClick={() => navigate('/android-sec')} className="ml-auto font-sans text-[10px] text-[#00F5FF] hover:underline">
                    View full →
                </button>
            </div>
            <div className="space-y-2 flex-1">
                {checks.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1E1E30] last:border-0">
                        <span className="font-sans text-xs text-[#8888AA]">{c.label}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[#44445A]">{c.detail}</span>
                            {c.status === 'clean' ? (
                                <CheckCircle2 size={12} className="text-[#00FF88]" />
                            ) : (
                                <Shield size={12} className="text-[#FF8C00]" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function Dashboard() {
    const { profile, isLoadingProfile } = useBehavioralDNA()
    const { history, isLoadingHistory } = useScan()

    const scans = history?.data ?? []
    const todayScans = scans.filter((s) => new Date(s.scannedAt).toDateString() === new Date().toDateString())

    if (isLoadingProfile && isLoadingHistory) {
        return <LoadingSpinner size="lg" text="Loading dashboard..." />
    }

    return (
        <div className="space-y-6">
            <DashboardHeader />

            {/* Top section: Ring + Stats */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Threat Ring Card */}
                <motion.div
                    className="w-full lg:w-auto flex-shrink-0 glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {/* Background grid */}
                    <div
                        className="absolute inset-0 opacity-5"
                        style={{
                            backgroundImage: `linear-gradient(rgba(0,245,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.5) 1px, transparent 1px)`,
                            backgroundSize: '20px 20px',
                        }}
                    />
                    <p className="text-[10px] text-[#8888AA] font-mono font-semibold uppercase tracking-[3px] mb-4 z-10">Threat Level</p>
                    <div className="z-10">
                        <ThreatLevelRing score={profile?.anomalyScore ?? 15} size={180} />
                    </div>
                    <div className="flex items-center gap-2 mt-3 z-10">
                        <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
                        <span className="font-mono text-xs text-[#00FF88]">Monitoring active</span>
                    </div>
                </motion.div>

                {/* Stats */}
                <div className="flex-1 w-full space-y-4">
                    <LiveStatsBar
                        scansToday={todayScans.length}
                        threatsBlocked={todayScans.filter((s) => s.threatLevel === 'danger' || s.threatLevel === 'critical').length}
                        safeOpens={todayScans.filter((s) => s.threatLevel === 'safe').length}
                        activeMonitors={3}
                    />

                    {/* Map + Feed side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <WorldThreatMapMini />
                        <ThreatIntelFeed />
                    </div>
                </div>
            </div>

            {/* Device Security Status — replaces RecentActivity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DeviceSecurityStatus />
                <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield size={15} className="text-[#FF8C00]" />
                        <span className="font-orbitron text-sm font-semibold text-[#F0F0FF]">Security Summary</span>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Total Scans', value: scans.length.toString(), color: '#00F5FF' },
                            { label: 'Today', value: todayScans.length.toString(), color: '#00FF88' },
                            {
                                label: 'Threats Detected',
                                value: scans.filter((s) => s.threatLevel === 'danger' || s.threatLevel === 'critical').length.toString(),
                                color: '#FF3366',
                            },
                            { label: 'Clean', value: scans.filter((s) => s.threatLevel === 'safe').length.toString(), color: '#00FF88' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-[#1E1E30] last:border-0">
                                <span className="font-sans text-xs text-[#8888AA]">{item.label}</span>
                                <span className="font-orbitron text-lg font-bold" style={{ color: item.color }}>
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAB */}
            <QuickScanFAB />
        </div>
    )
}
