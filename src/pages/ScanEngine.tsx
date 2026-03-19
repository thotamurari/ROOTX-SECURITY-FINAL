import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { ScanDropZone } from '@/components/scan/ScanDropZone'
import { ScanProgressVisualizer } from '@/components/scan/ScanProgressVisualizer'
import { ThreatReportCard } from '@/components/scan/ThreatReportCard'
import { ScanHistory } from '@/components/scan/ScanHistory'
import { useScan } from '@/hooks/useScan'
import { Scan } from 'lucide-react'

export default function ScanEngine() {
    const [searchParams] = useSearchParams()
    const activeTab = (searchParams.get('type') as 'url' | 'file' | 'message') || undefined
    const {
        progress,
        stage,
        isScanning,
        currentResult,
        scanUrl,
        scanFile,
        scanMessage,
        history,
    } = useScan()

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-[32px] font-orbitron font-extrabold text-white flex items-center gap-3" style={{ textShadow: '0 0 30px rgba(0, 255, 255, 0.4)' }}>
                    <Scan className="w-8 h-8 text-cyan drop-shadow-[0_0_12px_#00FFFF]" />
                    Scan Engine
                </h1>
                <p className="text-[14px] text-[#B0BEC5] font-mono mt-1 tracking-wide">
                    Analyze URLs, files, and messages for threats
                </p>
            </motion.div>

            <ScanDropZone
                onScanUrl={(url) => scanUrl({ url })}
                onScanFile={scanFile}
                onScanMessage={scanMessage}
                activeTab={activeTab}
            />

            {isScanning && <ScanProgressVisualizer progress={progress} stage={stage} />}

            {currentResult && <ThreatReportCard result={currentResult} />}

            <div>
                <h2 className="text-lg font-display font-bold text-text-primary mb-4">Scan History</h2>
                <ScanHistory items={history?.data ?? []} />
            </div>
        </div>
    )
}
