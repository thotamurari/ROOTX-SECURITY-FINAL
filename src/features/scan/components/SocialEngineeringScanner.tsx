import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, AlertTriangle, ShieldAlert, Eye, MessageSquareWarning } from 'lucide-react'
import { useScan } from '@/hooks/useScan'
import { ScanProgressVisualizer } from '@/components/scan/ScanProgressVisualizer'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import type { ScanResult } from '@/types/api'

const TACTIC_TONES = {
    warning: { wrap: 'bg-warning-soft text-warning', value: 'text-warning' },
    danger: { wrap: 'bg-danger-soft text-danger', value: 'text-danger' },
    info: { wrap: 'bg-info-soft text-info', value: 'text-info' },
}

function AnalysisResultPanel({ result }: { result: ScanResult }) {
    const tactics = result.aiAnalysis?.details ?? []

    const urgencyScore = parseInt(tactics.find((t) => t.toLowerCase().includes('urgency'))?.match(/\d+/)?.[0] ?? '0')
    const fearScore = parseInt(tactics.find((t) => t.toLowerCase().includes('fear'))?.match(/\d+/)?.[0] ?? '0')
    const authorityScore = parseInt(tactics.find((t) => t.toLowerCase().includes('authority'))?.match(/\d+/)?.[0] ?? '0')

    const scores = [
        { label: 'Urgency', score: urgencyScore || 25, icon: AlertTriangle, tone: 'warning' as const },
        { label: 'Fear', score: fearScore || 15, icon: ShieldAlert, tone: 'danger' as const },
        { label: 'Authority', score: authorityScore || 10, icon: Eye, tone: 'info' as const },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card padding="lg" className="space-y-5">
                <h3 className="text-[15px] font-semibold text-text-primary tracking-tight">Analysis result</h3>

                {result.aiAnalysis && (
                    <p className="text-[13.5px] text-text-secondary leading-relaxed">{result.aiAnalysis.summary}</p>
                )}

                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {scores.map((s, i) => {
                        const tone = TACTIC_TONES[s.tone]
                        return (
                            <motion.div
                                key={s.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: i * 0.06 }}
                                className="p-3 sm:p-4 rounded-xl bg-surface-2 border border-border text-center"
                            >
                                <span className={`w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center ${tone.wrap}`}>
                                    <s.icon className="w-4 h-4" aria-hidden="true" />
                                </span>
                                <p className={`text-[22px] leading-none font-bold tabular-nums ${tone.value}`}>
                                    {s.score}
                                </p>
                                <p className="text-[11px] text-text-tertiary mt-1.5 uppercase tracking-wider">
                                    {s.label}
                                </p>
                            </motion.div>
                        )
                    })}
                </div>

                <div className="p-4 rounded-xl bg-surface-2 border border-border">
                    <p className="text-[11px] text-text-tertiary mb-2 uppercase tracking-wider font-semibold">
                        Analyzed message
                    </p>
                    <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap break-words">
                        {result.input}
                    </p>
                </div>

                {result.recommendations.length > 0 && (
                    <div>
                        <p className="text-[11px] text-text-tertiary mb-2 uppercase tracking-wider font-semibold">
                            Recommendations
                        </p>
                        <ul className="space-y-2">
                            {result.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-[13px] text-text-secondary leading-relaxed">
                                    <span className="w-4 h-4 rounded-full bg-success-soft text-success flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5" aria-hidden="true">
                                        &#10003;
                                    </span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Card>
        </motion.div>
    )
}

export function SocialEngineeringScanner() {
    const [message, setMessage] = useState('')
    const { isScanning, progress, stage, currentResult, scanMessage } = useScan()

    return (
        <div className="space-y-5">
            <Card padding="lg">
                <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 rounded-xl bg-warning-soft text-warning flex items-center justify-center shrink-0">
                        <MessageSquareWarning className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-[15px] font-semibold text-text-primary tracking-tight">
                            Social engineering analyzer
                        </h3>
                        <p className="text-[12.5px] text-text-secondary mt-0.5">
                            Spot urgency, fear and authority manipulation
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label htmlFor="social-message-input" className="sr-only">
                        Message to analyze
                    </label>
                    <textarea
                        id="social-message-input"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Paste a suspicious SMS, WhatsApp, email or social media message here..."
                        rows={5}
                        className="input-field resize-none leading-relaxed"
                    />
                    <Button
                        size="lg"
                        fullWidth
                        onClick={() => message && scanMessage(message)}
                        disabled={!message || isScanning}
                        isLoading={isScanning}
                        leftIcon={<Send className="w-4 h-4" />}
                    >
                        Analyze message
                    </Button>
                </div>
            </Card>

            {isScanning && (
                <Card padding="lg">
                    <ScanProgressVisualizer progress={progress} stage={stage} />
                </Card>
            )}

            {currentResult && <AnalysisResultPanel result={currentResult} />}
        </div>
    )
}
