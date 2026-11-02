import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    Clock,
    ExternalLink,
    ScanLine,
    Shield,
    Globe,
    FileCode,
    AlertTriangle,
    CheckCircle,
    ChevronRight,
    History,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/shared/Card'
import type { ScanHistoryItem } from '@/stores/scanHistoryStore'

interface DashboardRecentActivityProps {
    items: ScanHistoryItem[]
}

function timeAgo(dateStr: string) {
    if (!dateStr) return 'Recently'
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 0) return 'Just now'
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

export function DashboardRecentActivity({ items }: DashboardRecentActivityProps) {
    const navigate = useNavigate()

    if (!items || items.length === 0) {
        return (
            <Card padding="md" className="flex flex-col items-center justify-center py-10 text-center">
                <span className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-text-tertiary mb-3">
                    <ScanLine className="w-6 h-6 text-accent" />
                </span>
                <CardTitle className="text-[16px]">No Security Sweeps Yet</CardTitle>
                <CardDescription className="max-w-sm mt-1">
                    Your real-time audit log is currently clean. Start by scanning any URL, APK file, or endpoint.
                </CardDescription>
                <button
                    type="button"
                    onClick={() => navigate('/scan')}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-accent text-white hover:bg-accent-hover transition-colors shadow-xs"
                >
                    <ScanLine className="w-4 h-4" />
                    Launch Security Scan
                </button>
            </Card>
        )
    }

    return (
        <Card padding="md">
            <CardHeader className="mb-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
                        <History className="w-4 h-4" />
                    </span>
                    <div>
                        <CardTitle className="text-[15px]">Recent Security Activity</CardTitle>
                        <CardDescription className="text-[12px]">Latest perimeter scans and synchronized audit logs</CardDescription>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/scan-history')}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:text-accent-hover transition-colors"
                >
                    View All ({items.length})
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </CardHeader>

            <div className="space-y-2.5">
                {items.slice(0, 5).map((scan, idx) => {
                    const isThreat = scan.riskScore >= 50 || scan.threatLevel === 'critical' || scan.threatLevel === 'high'
                    const isSafe = scan.riskScore < 30 || scan.threatLevel === 'safe'
                    const isApk = scan.scanType === 'apk' || (scan.input && scan.input.endsWith('.apk'))

                    const badgeTone = isThreat
                        ? 'bg-danger-soft text-danger border-danger/30'
                        : isSafe
                        ? 'bg-success-soft text-success border-success/30'
                        : 'bg-warning-soft text-warning border-warning/30'

                    const borderAccent = isThreat ? '#ef4444' : isSafe ? '#10b981' : '#f59e0b'

                    return (
                        <motion.div
                            key={scan.id || idx}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, duration: 0.2 }}
                            onClick={() => navigate('/scan-history')}
                            className="group relative flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-surface-2/70 hover:bg-surface-3 border border-border hover:border-accent/40 cursor-pointer transition-all duration-150"
                        >
                            {/* Left colored risk rail */}
                            <span
                                className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                                style={{ backgroundColor: borderAccent }}
                                aria-hidden="true"
                            />

                            <div className="flex items-center gap-3 min-w-0 pl-1.5">
                                <span
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border"
                                    style={{
                                        backgroundColor: `${borderAccent}15`,
                                        color: borderAccent,
                                    }}
                                >
                                    {isApk ? (
                                        <FileCode className="w-4 h-4" />
                                    ) : (
                                        <Globe className="w-4 h-4" />
                                    )}
                                </span>

                                <div className="min-w-0">
                                    <p className="text-[13px] font-mono font-semibold text-text-primary truncate max-w-[200px] sm:max-w-md">
                                        {scan.input}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {timeAgo(scan.scannedAt)}
                                        </span>
                                        <span className="text-text-tertiary">•</span>
                                        <span className="text-[11px] text-text-secondary uppercase font-mono">
                                            {scan.scanType || 'URL Sweep'}
                                        </span>
                                        {scan.syncedWithCloud && (
                                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-accent font-mono">
                                                • CLOUD SYNCED
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 ml-2">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${badgeTone}`}>
                                    {isThreat ? 'CRITICAL' : isSafe ? 'SAFE' : 'WARN'} {scan.riskScore}
                                </span>
                                <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </Card>
    )
}
