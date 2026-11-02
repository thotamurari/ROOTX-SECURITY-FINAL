import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    History,
    Search,
    Trash2,
    RotateCw,
    ExternalLink,
    Filter,
    Shield,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    WifiOff,
    FileText,
    Globe,
    MessageSquare,
    ChevronDown,
    Calendar,
    ArrowRight,
    Cloud,
    CloudCheck,
    RefreshCw
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useScanHistoryStore, type ScanHistoryItem } from '@/stores/scanHistoryStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { ThreatReportCard } from '@/components/scan/ThreatReportCard'
import { useScan } from '@/hooks/useScan'

export default function ScanHistory() {
    const navigate = useNavigate()
    const { history, removeScan, clearHistory, syncWithFirebase, isLoadingCloud } = useScanHistoryStore()
    const { scanUrl, isScanning } = useScan()

    useEffect(() => {
        syncWithFirebase()
    }, [syncWithFirebase])

    const [searchQuery, setSearchQuery] = useState('')
    const [selectedType, setSelectedType] = useState<string>('all')
    const [selectedVerdict, setSelectedVerdict] = useState<string>('all')
    const [expandedItem, setExpandedItem] = useState<string | null>(null)
    const [rescanningId, setRescanningId] = useState<string | null>(null)

    const filteredItems = history.filter((item) => {
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            const matchInput = item.input.toLowerCase().includes(q)
            const matchThreat = item.threatType?.toLowerCase().includes(q) || false
            if (!matchInput && !matchThreat) return false
        }
        if (selectedType !== 'all' && item.scanType !== selectedType) return false
        if (selectedVerdict !== 'all') {
            if (selectedVerdict === 'unverified') {
                if (item.threatLevel !== 'unverified' && item.verificationTier !== 'unverified') return false
            } else if (selectedVerdict === 'safe') {
                if (item.threatLevel !== 'safe' || item.verificationTier === 'unverified') return false
            } else if (selectedVerdict === 'risky') {
                if (item.threatLevel !== 'caution' && item.threatLevel !== 'danger' && item.threatLevel !== 'critical') return false
            }
        }
        return true
    })

    const handleRescan = async (item: ScanHistoryItem, e: React.MouseEvent) => {
        e.stopPropagation()
        setRescanningId(item.id)
        if (item.scanType === 'url') {
            await scanUrl({ url: item.input })
            setRescanningId(null)
            navigate('/scan')
        } else {
            // For files/messages, navigate to scan page with notification
            navigate('/scan')
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'url': return <Globe className="w-4 h-4 text-accent" />
            case 'file':
            case 'apk': return <FileText className="w-4 h-4 text-info" />
            case 'message': return <MessageSquare className="w-4 h-4 text-warning" />
            default: return <Shield className="w-4 h-4 text-text-tertiary" />
        }
    }

    return (
        <div className="pb-12 max-w-5xl mx-auto space-y-6">
            <PageHeader
                title="Scan History & Logs"
                description="Review past security audits, re-scan suspicious targets, and inspect threat reports"
                icon={<History className="w-5 h-5" aria-hidden="true" />}
                actions={
                    history.length > 0 ? (
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={clearHistory}
                        >
                            Clear All Logs
                        </Button>
                    ) : undefined
                }
            />

            {/* Filter & Search Bar */}
            <Card padding="md" className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Search by URL, file name, or threat type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {/* Type filter */}
                        <div className="flex items-center bg-surface-2 p-1 rounded-xl border border-border text-[12px]">
                            {['all', 'url', 'file', 'message'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setSelectedType(t)}
                                    className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                                        selectedType === t
                                            ? 'bg-surface-1 text-text-primary shadow-xs border border-border'
                                            : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Verdict filter */}
                        <div className="flex items-center bg-surface-2 p-1 rounded-xl border border-border text-[12px]">
                            {[
                                { id: 'all', label: 'All Verdicts' },
                                { id: 'safe', label: 'Verified Safe' },
                                { id: 'unverified', label: 'Unverified' },
                                { id: 'risky', label: 'Risky / Flagged' },
                            ].map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => setSelectedVerdict(v.id)}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                        selectedVerdict === v.id
                                            ? 'bg-surface-1 text-text-primary shadow-xs border border-border'
                                            : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* History List */}
            {filteredItems.length === 0 ? (
                <Card padding="lg" className="text-center py-16">
                    <span className="w-14 h-14 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                        <History className="w-7 h-7" />
                    </span>
                    <h3 className="text-[16px] font-semibold text-text-primary mb-1">
                        {history.length === 0 ? 'No scans recorded yet' : 'No matching scan logs'}
                    </h3>
                    <p className="text-[13px] text-text-secondary max-w-sm mx-auto mb-5">
                        {history.length === 0
                            ? 'Run a scan from the Scan Engine to test links, files, and messages for threats.'
                            : 'Try adjusting your search query or filter settings.'}
                    </p>
                    {history.length === 0 && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => navigate('/scan')}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                            Open Scan Engine
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredItems.map((item) => {
                        const isExpanded = expandedItem === item.id
                        const isUnverified = item.threatLevel === 'unverified' || item.verificationTier === 'unverified'
                        const isSafe = item.threatLevel === 'safe' && !isUnverified
                        const isRisky = !isSafe && !isUnverified

                        return (
                            <motion.div
                                key={item.id}
                                layout
                                className={`rounded-2xl border transition-all overflow-hidden ${
                                    isExpanded ? 'bg-surface-1 shadow-md border-border-strong' : 'bg-surface-1/80 border-border hover:border-border-strong'
                                }`}
                            >
                                <div
                                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                                >
                                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                            isSafe
                                                ? 'bg-success-soft text-success border-success/25'
                                                : isUnverified
                                                    ? 'bg-warning-soft text-warning border-warning/25'
                                                    : 'bg-danger-soft text-danger border-danger/25'
                                        }`}>
                                            {getTypeIcon(item.scanType)}
                                        </span>

                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-[13.5px] font-semibold text-text-primary truncate max-w-md">
                                                    {item.input}
                                                </span>
                                                <RiskBadge
                                                    level={isUnverified ? 'unverified' : item.threatLevel}
                                                    score={item.riskScore}
                                                    size="sm"
                                                />
                                                {item.verificationTier === 'verified_safe' && (
                                                    <span className="text-[10px] font-semibold text-success bg-success-soft px-2 py-0.5 rounded-full border border-success/20">
                                                        ✅ Verified Safe
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 text-[11.5px] text-text-tertiary flex-wrap">
                                                <span className="capitalize">{item.scanType} scan</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(item.scannedAt).toLocaleString()}
                                                </span>
                                                {item.threatType && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-text-secondary">{item.threatType}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                        {item.scanType === 'url' && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                leftIcon={<RotateCw className={`w-3.5 h-3.5 ${rescanningId === item.id ? 'animate-spin' : ''}`} />}
                                                onClick={(e) => handleRescan(item, e)}
                                                disabled={rescanningId === item.id || isScanning}
                                            >
                                                Re-scan
                                            </Button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeScan(item.id)
                                            }}
                                            aria-label="Delete scan log"
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-danger hover:bg-danger-soft transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {/* Expanded Full Threat Report */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="border-t border-border p-4 sm:p-6 bg-surface-2/40"
                                        >
                                            <ThreatReportCard result={item.result} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
