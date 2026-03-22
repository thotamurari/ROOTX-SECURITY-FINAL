import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Link2, MessageSquare, FileUp, ScanLine, Loader2 } from 'lucide-react'

interface Props {
    onScanUrl: (url: string) => void
    onScanFile: (file: File) => void
    onScanMessage?: (message: string) => void
    activeTab: 'url' | 'file' | 'message' | 'social'
}

export function ScanDropZone({ onScanUrl, onScanFile, onScanMessage, activeTab }: Props) {
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

    return (
        <div className="glass-card p-6 space-y-4">
            {/* URL Input */}
            {activeTab === 'url' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <label className="font-sans text-sm text-[#8888AA] block">
                        Enter URL to scan
                    </label>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#44445A]" size={16} />
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && urlInput && onScanUrl(urlInput)}
                                placeholder="https://example.com/suspicious-link"
                                className="w-full h-12 pl-10 pr-4 bg-[#0D0D14] border border-[#2A2A40] rounded-xl text-[#F0F0FF] font-mono text-sm placeholder-[#44445A] focus:outline-none focus:border-[#00F5FF] focus:ring-1 focus:ring-[rgba(0,245,255,0.2)] transition-all duration-200"
                            />
                        </div>
                        <button
                            onClick={() => urlInput && onScanUrl(urlInput)}
                            disabled={!urlInput.trim()}
                            className="px-6 h-12 rounded-xl font-sans font-semibold text-sm bg-[#00F5FF] text-[#060608] hover:bg-[#00D4E0] hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                        >
                            <ScanLine size={16} />
                            Scan URL
                        </button>
                    </div>

                </motion.div>
            )}

            {/* File Input */}
            {activeTab === 'file' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-2 border-dashed rounded-[12px] p-8 text-center transition-all cursor-pointer
                        ${isDragging
                            ? 'border-[#00F5FF] bg-[rgba(0,245,255,0.05)] shadow-[inset_0_0_20px_rgba(0,245,255,0.1)]'
                            : 'border-[#2A2A40] hover:border-[rgba(0,245,255,0.3)]'
                        }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                >
                    <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-[#00F5FF]' : 'text-[#44445A]'}`} style={isDragging ? { filter: 'drop-shadow(0 0 8px #00F5FF)' } : {}} />
                    <p className="text-[14px] font-sans text-[#F0F0FF]">
                        {fileName ? fileName : 'Drop a file here or click to browse'}
                    </p>
                    <p className="text-[12px] text-[#8888AA] font-mono mt-1">APK, PDF, EXE — max 50MB</p>
                    <input id="file-input" type="file" className="hidden" onChange={handleFileSelect} />
                </motion.div>
            )}

            {/* Message Input */}
            {activeTab === 'message' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <label className="font-sans text-sm text-[#8888AA] block">
                        Paste suspicious message content
                    </label>
                    <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Paste a suspicious message, email, or SMS content here..."
                        rows={5}
                        className="w-full bg-[#0D0D14] border border-[#2A2A40] rounded-xl px-4 py-3 text-[#F0F0FF] font-mono text-sm placeholder-[#44445A] focus:outline-none focus:border-[#00F5FF] focus:ring-1 focus:ring-[rgba(0,245,255,0.2)] transition-all duration-200 resize-none"
                    />
                    <button
                        onClick={() => messageInput && onScanMessage?.(messageInput)}
                        disabled={!messageInput.trim()}
                        className="w-full px-6 h-12 rounded-xl font-sans font-semibold text-sm bg-[#00F5FF] text-[#060608] hover:bg-[#00D4E0] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <MessageSquare size={16} />
                        Analyze Message
                    </button>
                </motion.div>
            )}
        </div>
    )
}
