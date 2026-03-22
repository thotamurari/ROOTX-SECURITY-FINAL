import { Shield } from 'lucide-react'
import { ApkScanner } from '@/features/scan/components/ApkScanner'

const BehavioralDNA = () => {
    return (
        <div className="p-4 sm:p-6 min-h-screen bg-[#060608]">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <Shield size={24} className="text-[#00F5FF]" />
                    <h1 className="font-orbitron text-2xl font-bold text-[#F0F0FF]">
                        APK Security Scanner
                    </h1>
                </div>
                <p className="font-mono text-xs text-[#8888AA] ml-9">
                    Scan all installed apps for threats, permissions and vulnerabilities
                </p>
            </div>
            <ApkScanner />
        </div>
    )
}

export default BehavioralDNA
