import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquareWarning, Send, AlertTriangle, ShieldAlert, Eye } from 'lucide-react'
import { useScan } from '@/hooks/useScan'
import { ScanProgressVisualizer } from '@/components/scan/ScanProgressVisualizer'
import type { ScanResult } from '@/types/api'

function AnalysisResultPanel({ result }: { result: ScanResult }) {
    const tactics = result.aiAnalysis?.details ?? []

    // Parse tactic scores from details
    const urgencyScore = parseInt(tactics.find((t) => t.toLowerCase().includes('urgency'))?.match(/\d+/)?.[0] ?? '0')
    const fearScore = parseInt(tactics.find((t) => t.toLowerCase().includes('fear'))?.match(/\d+/)?.[0] ?? '0')
    const authorityScore = parseInt(tactics.find((t) => t.toLowerCase().includes('authority'))?.match(/\d+/)?.[0] ?? '0')

    const scores = [
        { label: 'Urgency', score: urgencyScore || 25, icon: AlertTriangle, color: '#FF8C00' },
        { label: 'Fear', score: fearScore || 15, icon: ShieldAlert, color: '#FF3366' },
        { label: 'Authority', score: authorityScore || 10, icon: Eye, color: '#00F5FF' },
    ]

    return (
        <motion.div
            className="glass-card p-6 space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h3 className="text-lg font-display font-bold text-text-primary">Analysis Result</h3>

            {/* Summary */}
            {result.aiAnalysis && (
                <p className="text-sm font-body text-text-secondary">{result.aiAnalysis.summary}</p>
            )}

            {/* Tactic Scores */}
            <div className="grid grid-cols-3 gap-3">
                {scores.map((s) => (
                    <div key={s.label} className="p-4 rounded-xl bg-surface border border-border text-center">
                        <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
                        <p className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.score}</p>
                        <p className="text-[10px] font-body text-text-muted mt-1">{s.label} Score</p>
                    </div>
                ))}
            </div>

            {/* Annotated message */}
            <div className="p-4 rounded-xl bg-surface border border-border">
                <p className="text-xs font-body text-text-muted mb-2 uppercase tracking-wider">Analyzed Message</p>
                <p className="text-sm font-body text-text-primary leading-relaxed whitespace-pre-wrap">{result.input}</p>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
                <div>
                    <p className="text-xs font-body text-text-muted mb-2 uppercase tracking-wider">Recommendations</p>
                    <ul className="space-y-1.5">
                        {result.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm font-body text-text-secondary">
                                <span className="text-neon-green mt-0.5">✓</span>
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    )
}

export default function SocialShield() {
    const [message, setMessage] = useState('')
    const { isScanning, progress, stage, currentResult, scanMessage } = useScan()

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-3">
                    <MessageSquareWarning className="w-7 h-7 text-neon-orange" />
                    Social Engineering Shield
                </h1>
                <p className="text-sm text-text-secondary font-body mt-1">
                    Detect manipulation tactics in messages, emails, and SMS
                </p>
            </motion.div>

            {/* Input */}
            <div className="glass-card p-6 space-y-4">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Paste a suspicious message here... We'll analyze it for social engineering tactics like urgency, fear, impersonation, and authority manipulation."
                    rows={6}
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
    )
}
