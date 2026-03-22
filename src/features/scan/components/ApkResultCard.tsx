import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, ShieldAlert, Skull, Bot } from 'lucide-react'
import type { ApkScanResult } from '../types/apk.types'

interface Props {
    result: ApkScanResult
    index: number
}

const levelConfig = {
    safe:     { color: '#00FF7F', icon: ShieldCheck, label: 'SAFE',     bg: 'rgba(0,255,127,0.08)' },
    caution:  { color: '#FFE000', icon: AlertTriangle, label: 'CAUTION', bg: 'rgba(255,224,0,0.08)' },
    risky:    { color: '#FF1744', icon: ShieldAlert, label: 'RISKY',    bg: 'rgba(255,23,68,0.08)' },
    critical: { color: '#FF1744', icon: Skull,       label: 'CRITICAL', bg: 'rgba(255,23,68,0.12)' },
}

export function ApkResultCard({ result, index }: Props) {
    const [expanded, setExpanded] = useState(false)
    const cfg = levelConfig[result.riskLevel]

    return (
        <motion.div
            className="rounded-[14px] border overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${cfg.bg} 0%, rgba(8,11,20,0.95) 100%)`,
                borderColor: `${cfg.color}33`,
            }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35 }}
        >
            {/* Main row */}
            <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                {/* Risk icon */}
                <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: `${cfg.color}1A`, boxShadow: `0 0 12px ${cfg.color}33` }}
                >
                    <cfg.icon className="w-5 h-5" style={{ color: cfg.color, filter: `drop-shadow(0 0 6px ${cfg.color})` }} />
                </div>

                {/* App info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-[15px] font-sans font-bold text-white truncate">{result.appName}</h4>
                        <span className="text-[11px] font-mono text-[#607D8B]">v{result.version}</span>
                        <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border"
                            style={{
                                color: cfg.color,
                                borderColor: `${cfg.color}55`,
                                background: `${cfg.color}1A`,
                                textShadow: `0 0 8px ${cfg.color}`,
                            }}
                        >
                            {cfg.label}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[12px] font-mono text-[#B0BEC5]">
                        <span>Risk: <span className="text-white font-bold" style={{ color: cfg.color }}>{result.riskScore}/100</span></span>
                        <span>Perms: {result.permissions.length} (<span className="text-[#FF1744]">{result.dangerousPermissions.length} dangerous</span>)</span>
                        <span>VT: {result.virusTotalResult ? (result.virusTotalResult.malicious > 0 ? <span className="text-[#FF1744]">{result.virusTotalResult.malicious} flagged</span> : <span className="text-[#00FF7F]">Clean</span>) : <span className="text-[#607D8B]">N/A</span>}</span>
                        <span>{result.apkSize}MB</span>
                        <span className="hidden sm:inline">Last: {result.lastUsed}</span>
                    </div>
                </div>

                {/* Expand toggle */}
                <div className="shrink-0 p-1.5 rounded-md bg-[rgba(255,255,255,0.05)]">
                    {expanded ? <ChevronUp className="w-4 h-4 text-[#B0BEC5]" /> : <ChevronDown className="w-4 h-4 text-[#607D8B]" />}
                </div>
            </div>

            {/* Expanded AI Analysis */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t"
                        style={{ borderColor: `${cfg.color}22` }}
                    >
                        <div className="p-5 space-y-4 bg-[rgba(0,0,0,0.2)]">
                            <div className="flex items-center gap-2 text-[14px] font-sans font-bold text-[#00FFFF]">
                                <Bot className="w-5 h-5" style={{ filter: 'drop-shadow(0 0 6px #00FFFF)' }} />
                                AI Security Analysis
                            </div>

                            {/* Summary */}
                            <p className="text-[13px] font-mono text-white leading-relaxed border-l-2 border-[#00FFFF] pl-4" style={{ borderColor: `${cfg.color}88` }}>
                                {result.aiAnalysis.summary}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px] font-mono">
                                {/* Threats */}
                                <div className="p-3 rounded-[10px] bg-[rgba(255,23,68,0.05)] border border-[rgba(255,23,68,0.15)]">
                                    <p className="text-[#FF1744] font-bold mb-1.5 uppercase tracking-wider text-[10px]">Threats Found</p>
                                    {result.aiAnalysis.threats.length > 0 ? (
                                        <ul className="space-y-1 text-[#B0BEC5]">
                                            {result.aiAnalysis.threats.map((t, i) => <li key={i}>• {t}</li>)}
                                        </ul>
                                    ) : (
                                        <p className="text-[#00FF7F]">None detected</p>
                                    )}
                                </div>

                                {/* Suspicious */}
                                <div className="p-3 rounded-[10px] bg-[rgba(255,224,0,0.05)] border border-[rgba(255,224,0,0.15)]">
                                    <p className="text-[#FFE000] font-bold mb-1.5 uppercase tracking-wider text-[10px]">Suspicious Patterns</p>
                                    {result.aiAnalysis.suspiciousPatterns.length > 0 ? (
                                        <ul className="space-y-1 text-[#B0BEC5]">
                                            {result.aiAnalysis.suspiciousPatterns.map((s, i) => <li key={i}>• {s}</li>)}
                                        </ul>
                                    ) : (
                                        <p className="text-[#00FF7F]">None detected</p>
                                    )}
                                </div>

                                {/* Recommendation */}
                                <div className="p-3 rounded-[10px] bg-[rgba(0,255,255,0.05)] border border-[rgba(0,255,255,0.15)]">
                                    <p className="text-[#00FFFF] font-bold mb-1.5 uppercase tracking-wider text-[10px]">Recommendation</p>
                                    <p className="text-white">{result.aiAnalysis.recommendation}</p>
                                    <div className="mt-2 text-[#607D8B]">
                                        Confidence: <span className="text-[#00FFFF] font-bold">{result.aiAnalysis.confidence}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Dangerous permissions list */}
                            {result.dangerousPermissions.length > 0 && (
                                <div className="pt-2">
                                    <p className="text-[10px] font-mono text-[#607D8B] uppercase tracking-wider mb-2">Dangerous Permissions</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {result.dangerousPermissions.map((p) => (
                                            <span key={p} className="px-2 py-0.5 rounded text-[10px] font-mono text-[#FF1744] bg-[rgba(255,23,68,0.1)] border border-[rgba(255,23,68,0.2)]">
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
