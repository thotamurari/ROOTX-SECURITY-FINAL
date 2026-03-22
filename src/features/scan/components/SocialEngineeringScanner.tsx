import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, AlertTriangle, ShieldAlert, Eye, MessageSquareWarning } from 'lucide-react'
import { useScan } from '@/hooks/useScan'
import { ScanProgressVisualizer } from '@/components/scan/ScanProgressVisualizer'
import type { ScanResult } from '@/types/api'
function AnalysisResultPanel({ result }: { result: ScanResult }) {
    const tactics = result.aiAnalysis?.details ?? []

    const urgencyScore = parseInt(tactics.find((t) => t.toLowerCase().includes('urgency'))?.match(/\d+/)?.[0] ?? '0')
    const fearScore = parseInt(tactics.find((t) => t.toLowerCase().includes('fear'))?.match(/\d+/)?.[0] ?? '0')
    const authorityScore = parseInt(tactics.find((t) => t.toLowerCase().includes('authority'))?.match(/\d+/)?.[0] ?? '0')

    const scores = [
        { label: 'Urgency', score: urgencyScore || 25, icon: AlertTriangle, color: '#FF6B00' },
        { label: 'Fear', score: fearScore || 15, icon: ShieldAlert, color: '#FF1744' },
        { label: 'Authority', score: authorityScore || 10, icon: Eye, color: '#00FFFF' },
    ]

    return (
        <motion.div
            className="rounded-[14px] bg-[linear-gradient(135deg,rgba(8,11,20,0.9)_0%,rgba(13,17,23,0.95)_100%)] border border-[rgba(0,255,255,0.15)] p-6 space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h3 className="text-[16px] font-sans font-bold text-white">Analysis Result</h3>

            {result.aiAnalysis && (
                <p className="text-[13px] font-mono text-[#B0BEC5]">{result.aiAnalysis.summary}</p>
            )}

            <div className="grid grid-cols-3 gap-3">
                {scores.map((s) => (
                    <div key={s.label} className="p-4 rounded-[12px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)] text-center">
                        <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color, filter: `drop-shadow(0 0 6px ${s.color})` }} />
                        <p className="text-[24px] font-orbitron font-bold" style={{ color: s.color, textShadow: `0 0 12px ${s.color}` }}>{s.score}</p>
                        <p className="text-[10px] font-mono text-[#607D8B] mt-1 uppercase tracking-wider">{s.label} Score</p>
                    </div>
                ))}
            </div>

            <div className="p-4 rounded-[12px] bg-[rgba(0,0,0,0.2)] border border-[rgba(0,255,255,0.1)]">
                <p className="text-[10px] font-mono text-[#607D8B] mb-2 uppercase tracking-wider">Analyzed Message</p>
                <p className="text-[13px] font-mono text-white leading-relaxed whitespace-pre-wrap">{result.input}</p>
            </div>

            {result.recommendations.length > 0 && (
                <div>
                    <p className="text-[10px] font-mono text-[#607D8B] mb-2 uppercase tracking-wider">Recommendations</p>
                    <ul className="space-y-1.5">
                        {result.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] font-mono text-[#B0BEC5]">
                                <span className="text-[#00FF7F] mt-0.5">✓</span>
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    )
}

export function SocialEngineeringScanner() {
    const [message, setMessage] = useState('')
    const { isScanning, progress, stage, currentResult, scanMessage } = useScan()

    return (
        <div className="space-y-8">
            {/* SUB-SECTION A: Message Analyzer */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <MessageSquareWarning className="w-6 h-6 text-[#FF6B00]" style={{ filter: 'drop-shadow(0 0 8px #FF6B00)' }} />
                    <h3 className="text-[18px] font-orbitron font-bold text-white" style={{ textShadow: '0 0 15px rgba(255,107,0,0.3)' }}>
                        Social Engineering Analyzer
                    </h3>
                </div>

                <div className="rounded-[16px] bg-[linear-gradient(135deg,rgba(8,11,20,0.9)_0%,rgba(13,17,23,0.95)_100%)] border border-[rgba(0,255,255,0.2)] shadow-[0_4px_30px_rgba(0,0,0,0.5)] p-6 space-y-4">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Detect manipulation tactics in SMS, WhatsApp, emails and social media messages"
                        rows={5}
                        className="input-field resize-none"
                    />
                    <motion.button
                        onClick={() => message && scanMessage(message)}
                        disabled={!message || isScanning}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <Send className="w-4 h-4" />
                        Analyze Message
                    </motion.button>
                </div>

                {isScanning && <ScanProgressVisualizer progress={progress} stage={stage} />}
                {currentResult && <AnalysisResultPanel result={currentResult} />}
            </div>
        </div>
    )
}
