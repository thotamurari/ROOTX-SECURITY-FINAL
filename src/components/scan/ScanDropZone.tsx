import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Link as LinkIcon, MessageSquare, FileUp } from 'lucide-react'

interface Props {
    onScanUrl: (url: string) => void
    onScanFile: (file: File) => void
    onScanMessage: (message: string) => void
    activeTab?: 'url' | 'file' | 'message'
}

export function ScanDropZone({ onScanUrl, onScanFile, onScanMessage, activeTab: initialTab }: Props) {
    const [tab, setTab] = useState<'url' | 'file' | 'message'>(initialTab ?? 'url')
    const [urlInput, setUrlInput] = useState('')
    const [messageInput, setMessageInput] = useState('')
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

    const tabs = [
        { key: 'url' as const, label: 'URL', icon: LinkIcon },
        { key: 'file' as const, label: 'File', icon: FileUp },
        { key: 'message' as const, label: 'Message', icon: MessageSquare },
    ]

    return (
        <div className="p-6 space-y-5 rounded-[16px] bg-[linear-gradient(180deg,rgba(17,24,39,0.9)_0%,rgba(8,11,20,0.95)_100%)] border border-[rgba(0,255,255,0.3)] shadow-[0_0_30px_rgba(0,255,255,0.05),inset_0_0_20px_rgba(0,255,255,0.02)]">
            {/* Tabs */}
            <div className="flex gap-2">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 text-[14px] font-mono font-bold transition-all
                            ${tab === t.key
                                ? 'bg-[rgba(0,255,255,0.1)] text-[#00FFFF] border-b-[2px] border-[#00FFFF] rounded-t-[8px]'
                                : 'text-[#607D8B] hover:text-[#B0BEC5] border-b-[2px] border-transparent hover:bg-white/5 rounded-t-[8px]'
                            }`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* URL Input */}
            {tab === 'url' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/suspicious-link"
                        className="input-field"
                    />
                    <button
                        onClick={() => urlInput && onScanUrl(urlInput)}
                        disabled={!urlInput}
                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Scan URL
                    </button>
                </motion.div>
            )}

            {tab === 'file' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-2 border-dashed rounded-[12px] p-8 text-center transition-all cursor-pointer 
                        ${isDragging ? 'border-[#00FFFF] bg-[rgba(0,255,255,0.05)] shadow-[inset_0_0_20px_rgba(0,255,255,0.1)]' : 'border-[#1A2236] hover:border-[rgba(0,255,255,0.3)]'
                        }`}
                    onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                >
                    <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-[#00FFFF] drop-shadow-[0_0_8px_#00FFFF]' : 'text-[#607D8B]'}`} />
                    <p className="text-[14px] font-mono text-white">
                        {fileName ? fileName : 'Drop a file here or click to browse'}
                    </p>
                    <p className="text-[12px] text-[#B0BEC5] font-mono mt-1">APK, PDF, EXE — max 50MB</p>
                    <input
                        id="file-input"
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </motion.div>
            )}

            {/* Message Input */}
            {tab === 'message' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Paste a suspicious message, email, or SMS content here..."
                        rows={5}
                        className="input-field resize-none"
                    />
                    <button
                        onClick={() => messageInput && onScanMessage(messageInput)}
                        disabled={!messageInput}
                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Analyze Message
                    </button>
                </motion.div>
            )}
        </div>
    )
}
