import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ShieldCheck, AlertTriangle, ShieldAlert, Skull, Bot } from 'lucide-react'
import type { ApkScanResult } from '../types/apk.types'
import { RiskBadge } from '@/components/shared/RiskBadge'

interface Props {
    result: ApkScanResult
    index: number
}

// APK risk levels use "risky" where the shared RiskBadge uses "danger" —
// map between the two so severity colors stay consistent app-wide.
const levelConfig = {
    safe: { icon: ShieldCheck, tone: 'bg-success-soft text-success', score: 'text-success', badge: 'safe' },
    caution: { icon: AlertTriangle, tone: 'bg-warning-soft text-warning', score: 'text-warning', badge: 'caution' },
    risky: { icon: ShieldAlert, tone: 'bg-danger-soft text-danger', score: 'text-danger', badge: 'danger' },
    critical: { icon: Skull, tone: 'bg-danger-soft text-danger', score: 'text-danger', badge: 'critical' },
}

export function ApkResultCard({ result, index }: Props) {
    const [expanded, setExpanded] = useState(false)
    const cfg = levelConfig[result.riskLevel]
    const panelId = `apk-result-panel-${result.id}`

    return (
        <motion.div
            className="bg-surface-1 border border-border rounded-2xl shadow-xs overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.3 }}
        >
            {/* Main row */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-controls={panelId}
                className="w-full text-left p-4 flex items-start gap-3 sm:gap-4 hover:bg-surface-2 transition-colors"
            >
                {/* Risk icon */}
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.tone}`}>
                    <cfg.icon className="w-5 h-5" aria-hidden="true" />
                </span>

                {/* App info */}
                <span className="flex-1 min-w-0 block">
                    <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14.5px] font-semibold text-text-primary truncate">
                            {result.appName}
                        </span>
                        <span className="text-[11.5px] font-mono text-text-tertiary">v{result.version}</span>
                        <RiskBadge level={cfg.badge} size="sm" />
                    </span>
                    <span className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[12px] text-text-secondary">
                        <span>
                            Risk <span className={`font-semibold tabular-nums ${cfg.score}`}>{result.riskScore}</span>
                            <span className="text-text-tertiary">/100</span>
                        </span>
                        <span>
                            {result.permissions.length} perms
                            {result.dangerousPermissions.length > 0 && (
                                <span className="text-danger"> ({result.dangerousPermissions.length} dangerous)</span>
                            )}
                        </span>
                        <span>
                            VT:{' '}
                            {result.virusTotalResult ? (
                                result.virusTotalResult.malicious > 0 ? (
                                    <span className="text-danger">{result.virusTotalResult.malicious} flagged</span>
                                ) : (
                                    <span className="text-success">Clean</span>
                                )
                            ) : (
                                <span className="text-text-tertiary">N/A</span>
                            )}
                        </span>
                        <span>{result.apkSize} MB</span>
                        <span className="hidden sm:inline">Last used {result.lastUsed}</span>
                    </span>
                </span>

                {/* Expand toggle */}
                <span className="shrink-0 w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center">
                    <ChevronDown
                        className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
                            expanded ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                    />
                </span>
            </button>

            {/* Expanded AI Analysis */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        id={panelId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden border-t border-border bg-surface-2/60"
                    >
                        <div className="p-4 sm:p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4" aria-hidden="true" />
                                </span>
                                <h5 className="text-[13.5px] font-semibold text-text-primary">
                                    AI security analysis
                                </h5>
                            </div>

                            {/* Summary */}
                            <p className="text-[13px] text-text-secondary leading-relaxed border-l-2 border-accent/50 pl-3.5">
                                {result.aiAnalysis.summary}
                            </p>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                {/* Threats */}
                                <div className="p-3.5 rounded-xl bg-danger-soft border border-danger/20">
                                    <p className="text-[11px] font-semibold text-danger uppercase tracking-wider mb-2">
                                        Threats found
                                    </p>
                                    {result.aiAnalysis.threats.length > 0 ? (
                                        <ul className="space-y-1 text-[12.5px] text-text-secondary">
                                            {result.aiAnalysis.threats.map((t, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span aria-hidden="true">·</span>
                                                    <span>{t}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-[12.5px] text-success">None detected</p>
                                    )}
                                </div>

                                {/* Suspicious */}
                                <div className="p-3.5 rounded-xl bg-warning-soft border border-warning/20">
                                    <p className="text-[11px] font-semibold text-warning uppercase tracking-wider mb-2">
                                        Suspicious patterns
                                    </p>
                                    {result.aiAnalysis.suspiciousPatterns.length > 0 ? (
                                        <ul className="space-y-1 text-[12.5px] text-text-secondary">
                                            {result.aiAnalysis.suspiciousPatterns.map((s, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span aria-hidden="true">·</span>
                                                    <span>{s}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-[12.5px] text-success">None detected</p>
                                    )}
                                </div>

                                {/* Recommendation */}
                                <div className="p-3.5 rounded-xl bg-accent-soft border border-accent/20">
                                    <p className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-2">
                                        Recommendation
                                    </p>
                                    <p className="text-[12.5px] text-text-secondary leading-relaxed">
                                        {result.aiAnalysis.recommendation}
                                    </p>
                                    <p className="mt-2 text-[11.5px] text-text-tertiary">
                                        Confidence{' '}
                                        <span className="text-accent font-semibold tabular-nums">
                                            {result.aiAnalysis.confidence}%
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Dangerous permissions list */}
                            {result.dangerousPermissions.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                                        Dangerous permissions
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {result.dangerousPermissions.map((p) => (
                                            <span
                                                key={p}
                                                className="px-2 py-1 rounded-md text-[11px] font-mono text-danger bg-danger-soft border border-danger/20"
                                            >
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
