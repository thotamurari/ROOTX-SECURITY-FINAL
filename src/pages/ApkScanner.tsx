import { ShieldCheck } from 'lucide-react'
import { ApkScanner as ApkScannerPanel } from '@/features/scan/components/ApkScanner'
import { PageHeader } from '@/components/shared/PageHeader'

/**
 * Formerly "Behavioral DNA" — renamed to APK Scanner to match what this
 * page actually does (analyze APKs/installed apps for security risk).
 * Route: /apk-scanner (see src/App.tsx). /behavioral-dna still works and
 * redirects here for anyone with an old link or bookmark.
 */
export default function ApkScanner() {
    return (
        <div className="pb-24 lg:pb-8">
            <PageHeader
                title="APK Scanner"
                description="Scan installed apps and uploaded APK files for permissions, certificate issues and security risk"
                icon={<ShieldCheck className="w-5 h-5" />}
            />
            <ApkScannerPanel />
        </div>
    )
}
