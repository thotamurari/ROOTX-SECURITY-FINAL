import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Link2, ScanLine, FileCheck2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/shared/Button'

interface Props {
    onScanUrl: (url: string) => void
    onScanFile: (file: File) => void
    onScanMessage?: (message: string) => void
    activeTab: 'url' | 'file' | 'message' | 'social'
}

export function ScanDropZone({ onScanUrl, onScanFile, onScanMessage, activeTab }: Props) {
    const [urlInput, setUrlInput] = useState('')
    const [isDragging, setIsDragging] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null)

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)
            const file = e.dataTransfer.files[0]
            if (file) {
                setFileName(file.name)
                onScanFile(file)
            }
        },
        [onScanFile]
    )

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) {
                setFileName(file.name)
                onScanFile(file)
            }
        },
        [onScanFile]
    )

    const handleUrlSubmit = () => {
        if (!urlInput.trim()) return
        // Auto-prepend https:// if no protocol
        let url = urlInput.trim()
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url
        }
        onScanUrl(url)
    }

    const openFilePicker = () => document.getElementById('file-input')?.click()

    return (
        <div className="space-y-4">
            {/* URL Input */}
            {activeTab === 'url' && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                >
                    <label htmlFor="scan-url-input" className="sr-only">
                        URL to scan
                    </label>
                    <div className="relative">
                        <Link2
                            aria-hidden="true"
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
                        />
                        <input
                            id="scan-url-input"
                            type="url"
                            inputMode="url"
                            autoComplete="url"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                            placeholder="https://example.com/suspicious-link"
                            className="input-field h-12 pl-10"
                        />
                    </div>
                    <Button
                        size="lg"
                        fullWidth
                        onClick={handleUrlSubmit}
                        disabled={!urlInput.trim()}
                        leftIcon={<ScanLine className="w-4 h-4" />}
                    >
                        Scan URL with 4 Tools
                    </Button>

                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                        {[
                            { name: 'VirusTotal (70+ Engines)', color: 'text-text-secondary bg-surface-2 border-border' },
                            { name: 'urlscan.io', color: 'text-text-secondary bg-surface-2 border-border' },
                            { name: 'Google Safe Browsing', color: 'text-text-secondary bg-surface-2 border-border' },
                            { name: 'Sucuri SiteCheck', color: 'text-text-secondary bg-surface-2 border-border' },
                        ].map((t) => (
                            <span
                                key={t.name}
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${t.color}`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                {t.name}
                            </span>
                        ))}
                    </div>

                    <p className="text-[12px] text-text-tertiary text-center">
                        Queries all 4 major security intelligence engines simultaneously.
                    </p>
                </motion.div>
            )}

            {/* File Input */}
            {activeTab === 'file' && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                >
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Upload a file to scan. Drop a file here, or activate to browse your device."
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={openFilePicker}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                openFilePicker()
                            }
                        }}
                        className={`border-2 border-dashed rounded-2xl px-5 py-10 sm:py-12 text-center transition-colors duration-200 cursor-pointer outline-none ${
                            isDragging
                                ? 'border-accent bg-accent-soft'
                                : 'border-border-strong bg-surface-2/50 hover:border-accent hover:bg-accent-soft'
                        }`}
                    >
                        <motion.span
                            animate={isDragging ? { scale: 1.06 } : { scale: 1 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                            className={`mx-auto mb-4 flex w-14 h-14 items-center justify-center rounded-2xl ${
                                fileName && !isDragging
                                    ? 'bg-success-soft text-success'
                                    : 'bg-accent-soft text-accent'
                            }`}
                        >
                            {fileName && !isDragging ? (
                                <FileCheck2 className="w-6 h-6" aria-hidden="true" />
                            ) : (
                                <Upload className="w-6 h-6" aria-hidden="true" />
                            )}
                        </motion.span>

                        <p className="text-[14.5px] font-semibold text-text-primary break-all px-2">
                            {fileName ? fileName : isDragging ? 'Release to scan' : 'Drop a file to scan'}
                        </p>
                        <p className="text-[12.5px] text-text-secondary mt-1">
                            or use the button below to browse your device
                        </p>
                        <p className="text-[11.5px] text-text-tertiary mt-3">
                            APK, PDF or EXE &middot; up to 50 MB
                        </p>

                        <label htmlFor="file-input" className="sr-only">
                            Choose a file to scan
                        </label>
                        <input
                            id="file-input"
                            type="file"
                            className="sr-only"
                            onChange={handleFileSelect}
                        />
                    </div>

                    <Button
                        size="lg"
                        fullWidth
                        variant="secondary"
                        onClick={(e) => {
                            e.stopPropagation()
                            openFilePicker()
                        }}
                        leftIcon={<FolderOpen className="w-4 h-4" />}
                    >
                        Browse files
                    </Button>
                </motion.div>
            )}
        </div>
    )
}
