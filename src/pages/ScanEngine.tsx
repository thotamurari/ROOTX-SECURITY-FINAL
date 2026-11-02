import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanDropZone } from '@/components/scan/ScanDropZone'
import { ScanProgressVisualizer } from '@/components/scan/ScanProgressVisualizer'
import { ThreatReportCard } from '@/components/scan/ThreatReportCard'
import { SocialEngineeringScanner } from '@/features/scan/components/SocialEngineeringScanner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { useScan } from '@/hooks/useScan'
import {
    Link2,
    FileSearch,
    ShieldAlert,
    Zap,
    ShieldCheck,
    Lightbulb,
    RotateCcw,
    AlertCircle,
    Search,
    History,
    Shield,
    ArrowRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useScanHistoryStore } from '@/stores/scanHistoryStore'

type TabId = 'url' | 'file' | 'social'

const TABS = [
    { id: 'url' as const, label: 'URL Scan', short: 'URL', icon: Link2, desc: 'Analyze links for phishing and malicious redirects' },
    { id: 'file' as const, label: 'File Audit', short: 'File', icon: FileSearch, desc: 'Deep malware detection on APK, PDF and executables' },
    { id: 'social' as const, label: 'Social Intel', short: 'Social', icon: ShieldAlert, desc: 'Detect manipulation tactics in messages' },
]

const ADVISORIES = [
    { text: 'Avoid opening suspicious links received over SMS', icon: ShieldCheck, tone: 'success' as const },
    { text: 'Keep your system software up to date', icon: Zap, tone: 'warning' as const },
]

const TONE_CLASSES = {
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
}

export default function ScanEngine() {
    const navigate = useNavigate()
    const historyCount = useScanHistoryStore((s) => s.history.length)
    const [activeTab, setActiveTab] = useState<TabId>('url')
    const {
        progress,
        stage,
        isScanning,
        currentResult,
        error,
        scanUrl,
        scanFile,
        resetScan
    } = useScan()

    const activeMeta = TABS.find((t) => t.id === activeTab)

    return (
        <div className="pb-8 max-w-3xl mx-auto w-full">
            <PageHeader
                title="Scan Engine"
                description="Threat detection for links, files and messages"
                icon={<Search className="w-5 h-5" />}
                actions={
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<History className="w-4 h-4 text-accent" />}
                        onClick={() => navigate('/scan-history')}
                    >
                        History {historyCount > 0 && `(${historyCount})`}
                    </Button>
                }
            />

            {/* Device APK Scanner Quick Banner (Matching Android ScanEngineScreen) */}
            <div
                onClick={() => navigate('/apk-scanner')}
                className="bg-accent-soft/60 hover:bg-accent-soft/90 border border-accent/25 hover:border-accent/40 rounded-2xl p-3.5 mb-5 cursor-pointer transition-all flex items-center justify-between group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 shadow-xs">
                        <Shield className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-bold text-text-primary leading-tight group-hover:text-accent transition-colors">
                            Device APK Scanner
                        </h3>
                        <p className="text-[11px] text-text-secondary leading-snug">
                            Audit installed apps, uninstall risks &amp; inspect APKs
                        </p>
                    </div>
                </div>
                <ArrowRight className="w-4 h-4 text-accent shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Tab switcher */}
            <div
                role="tablist"
                aria-label="Scan type"
                className="bg-surface-2 border border-border rounded-2xl p-1 flex gap-1 mb-6"
            >
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            id={`scan-tab-${tab.id}`}
                            aria-selected={isActive}
                            aria-controls={`scan-panel-${tab.id}`}
                            onClick={() => {
                                setActiveTab(tab.id)
                                resetScan()
                            }}
                            className={`relative flex-1 flex items-center justify-center gap-2 min-h-[44px] px-2 sm:px-4 rounded-xl text-[13px] font-semibold transition-colors ${
                                isActive
                                    ? 'text-text-primary'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="scanTabIndicator"
                                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                    className="absolute inset-0 rounded-xl bg-surface-1 border border-border shadow-xs"
                                />
                            )}
                            <tab.icon className={`relative w-4 h-4 shrink-0 ${isActive ? 'text-accent' : ''}`} />
                            <span className="relative">
                                <span className="sm:hidden">{tab.short}</span>
                                <span className="hidden sm:inline">{tab.label}</span>
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    role="tabpanel"
                    id={`scan-panel-${activeTab}`}
                    aria-labelledby={`scan-tab-${activeTab}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                >
                    {activeTab === 'social' ? (
                        <SocialEngineeringScanner />
                    ) : (
                        <>
                            {!isScanning && !currentResult && (
                                <Card padding="lg">
                                    <div className="mb-6">
                                        <p className="text-[13.5px] text-text-secondary leading-relaxed">
                                            {activeMeta?.desc}
                                        </p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="relative flex w-2 h-2">
                                                <span className="absolute inline-flex w-full h-full rounded-full bg-success opacity-60 animate-ping" />
                                                <span className="relative inline-flex w-2 h-2 rounded-full bg-success" />
                                            </span>
                                            <span className="text-[12px] font-medium text-text-tertiary">
                                                Detection engine ready
                                            </span>
                                        </div>
                                    </div>

                                    <ScanDropZone
                                        onScanUrl={(url) => scanUrl({ url })}
                                        onScanFile={scanFile}
                                        activeTab={activeTab}
                                    />
                                </Card>
                            )}

                            {isScanning && (
                                <Card padding="lg">
                                    <ScanProgressVisualizer progress={progress} stage={stage} />
                                </Card>
                            )}

                            {error && !isScanning && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3"
                                >
                                    <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                                    <p className="text-[12.5px] text-text-secondary leading-relaxed">{error}</p>
                                </div>
                            )}

                            {currentResult && (
                                <div className="space-y-5">
                                    <ThreatReportCard result={currentResult} />
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        fullWidth
                                        onClick={resetScan}
                                        leftIcon={<RotateCcw className="w-4 h-4" />}
                                    >
                                        Start a new scan
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Advisories */}
            {!isScanning && (
                <section className="mt-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-text-tertiary" />
                        <h2 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">
                            Security advisories
                        </h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {ADVISORIES.map((advisory, i) => (
                            <motion.div
                                key={advisory.text}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: i * 0.06 }}
                            >
                                <Card padding="sm" className="flex items-center gap-3 h-full">
                                    <span
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TONE_CLASSES[advisory.tone]}`}
                                    >
                                        <advisory.icon className="w-4 h-4" />
                                    </span>
                                    <span className="text-[13px] text-text-secondary leading-snug">
                                        {advisory.text}
                                    </span>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
