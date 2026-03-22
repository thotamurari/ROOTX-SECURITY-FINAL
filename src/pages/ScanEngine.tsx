import { useState } from 'react'
import { motion } from 'framer-motion'
import { ScanDropZone } from '@/components/scan/ScanDropZone'
import { ScanProgressVisualizer } from '@/components/scan/ScanProgressVisualizer'
import { ThreatReportCard } from '@/components/scan/ThreatReportCard'
import { SocialEngineeringScanner } from '@/features/scan/components/SocialEngineeringScanner'
import { useScan } from '@/hooks/useScan'
import { ScanLine, Link2, FileSearch, ShieldAlert } from 'lucide-react'

type TabId = 'url' | 'file' | 'social'

const TABS = [
    { id: 'url' as const, label: 'URL', icon: Link2 },
    { id: 'file' as const, label: 'File', icon: FileSearch },
    { id: 'social' as const, label: 'Social', icon: ShieldAlert },
]

export default function ScanEngine() {
    const [activeTab, setActiveTab] = useState<TabId>('url')
    const {
        progress,
        stage,
        isScanning,
        currentResult,
        scanUrl,
        scanFile,
    } = useScan()

    return (
        <div className="space-y-6">
            {/* Header row with tabs in top-right */}
            <motion.div
                className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Left: Page title */}
                <div>
                    <div className="flex items-center gap-3">
                        <ScanLine className="text-[#00F5FF]" size={28} style={{ filter: 'drop-shadow(0 0 8px #00F5FF)' }} />
                        <h1 className="font-orbitron text-[22px] sm:text-[26px] lg:text-[30px] font-bold text-[#F0F0FF]" style={{ letterSpacing: '-0.02em' }}>
                            Scan Engine
                        </h1>
                    </div>
                    <p className="font-mono text-[13px] text-[#8888AA] mt-1 tracking-wide">Analyze URLs, files, and social engineering threats</p>
                </div>

                {/* Right: Tab switcher — pill design */}
                <div className="flex items-center gap-1 bg-[#13131F] border border-[#2A2A40] rounded-xl p-1 self-start">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-3 py-2 rounded-lg
                                font-sans text-sm font-medium
                                transition-all duration-200 whitespace-nowrap
                                ${
                                    activeTab === tab.id
                                        ? 'bg-[#00F5FF] text-[#060608] shadow-lg shadow-[rgba(0,245,255,0.2)]'
                                        : 'text-[#8888AA] hover:text-[#F0F0FF] hover:bg-[#1A1A2E]'
                                }
                            `}
                        >
                            <tab.icon size={14} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Tab content */}
            {activeTab === 'social' ? (
                <SocialEngineeringScanner />
            ) : (
                <>
                    <ScanDropZone onScanUrl={(url) => scanUrl({ url })} onScanFile={scanFile} activeTab={activeTab} />
                    {isScanning && <ScanProgressVisualizer progress={progress} stage={stage} />}
                    {currentResult && <ThreatReportCard result={currentResult} />}
                </>
            )}
        </div>
    )
}
