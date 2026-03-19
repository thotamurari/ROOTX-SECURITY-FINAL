import { motion } from 'framer-motion'
import { AlertTriangle, Bot, Shield, Users, ChevronDown, ChevronUp, CheckCircle, Info } from 'lucide-react'
import { useState } from 'react'
import type { ScanResult } from '@/types/api'

interface Props {
    result: ScanResult
}

const getThreatLevel = (score: number) => {
    if (score >= 86) return { label: 'CRITICAL', color: 'text-[#FF1744]' }
    if (score >= 61) return { label: 'DANGEROUS', color: 'text-[#FF6B00]' }  
    if (score >= 31) return { label: 'CAUTION', color: 'text-[#FFE000]' }
    return { label: 'SAFE', color: 'text-[#00FF7F]' }
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
    title: string
    icon: any
    children: React.ReactNode
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="border-t border-border pt-4">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full text-left mb-3"
            >
                <span className="flex items-center gap-2 text-sm font-ui font-semibold text-text-secondary">
                    <Icon className="w-4 h-4" />
                    {title}
                </span>
                {open ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </button>
            {open && children}
        </div>
    )
}

function SeverityIcon({ severity }: { severity: string }) {
    if (severity === 'critical' || severity === 'high') return <AlertTriangle className="w-4 h-4 text-[#FF1744] shrink-0" />
    if (severity === 'medium') return <Info className="w-4 h-4 text-[#FFE000] shrink-0" />
    if (severity === 'low') return <CheckCircle className="w-4 h-4 text-[#00FF7F] shrink-0" />
    return <Info className="w-4 h-4 text-[#B0BEC5] shrink-0" />
}

function SeverityBadge({ severity }: { severity: string }) {
    const colors = {
        low: 'bg-[rgba(0,255,127,0.1)] text-[#00FF7F] border-[rgba(0,255,127,0.2)]',
        medium: 'bg-[rgba(255,224,0,0.1)] text-[#FFE000] border-[rgba(255,224,0,0.2)]',
        high: 'bg-[rgba(255,107,0,0.1)] text-[#FF6B00] border-[rgba(255,107,0,0.2)]',
        critical: 'bg-[rgba(255,23,68,0.1)] text-[#FF1744] border-[rgba(255,23,68,0.2)]',
        info: 'bg-[rgba(0,255,255,0.05)] text-[#B0BEC5] border-[rgba(0,255,255,0.1)]'
    } as any
    return (
        <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-bold ${colors[severity] || colors.info}`}>
            {severity}
        </span>
    )
}

export function ThreatReportCard({ result }: Props) {
    const threat = getThreatLevel(result.riskScore)

    return (
        <motion.div
            className="p-6 space-y-6 max-w-2xl mx-auto rounded-[16px] bg-[linear-gradient(135deg,rgba(17,24,39,0.95)_0%,rgba(13,17,23,0.90)_100%)] border border-cyan/20 shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header matches user requested layout visually */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-border pb-6">
                
                {/* Score Circular visualization */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                    <svg className="absolute inset-0 w-full h-full -rotate-90" style={{ filter: 'drop-shadow(0 0 12px currentColor)' }}>
                        <circle
                            cx="56"
                            cy="56"
                            r="52"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className={threat.color}
                            strokeDasharray="326.72"
                            strokeDashoffset={326.72 - (326.72 * result.riskScore) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="text-center">
                        <span className={`text-[36px] font-orbitron font-black leading-none ${threat.color}`} style={{ textShadow: `0 0 20px currentColor` }}>{result.riskScore}</span>
                        <span className="text-[10px] font-mono text-[#B0BEC5] uppercase tracking-[3px] mt-1 block">Score</span>
                    </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-3">
                    <h3 className="text-[24px] font-orbitron font-bold text-white capitalize truncate" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>{result.scanType} Scan Result</h3>
                    <div className="bg-[rgba(0,255,255,0.05)] border border-cyan/20 px-4 py-2 rounded-lg inline-block max-w-full">
                        <p className="text-[13px] font-mono text-white truncate">{result.input}</p>
                    </div>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                        <span className={`px-4 py-1.5 bg-[#080B14] rounded-full text-[12px] font-bold tracking-[2px] uppercase border border-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex items-center gap-2 ${threat.color}`}>
                            {threat.label === 'CRITICAL' && <div className="w-2 h-2 rounded-full bg-[#FF1744] animate-pulse" style={{ boxShadow: '0 0 8px #FF1744' }} />}
                            {threat.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Indicators matching user exact mapping */}
            {result.indicators.length > 0 && (
                <div className="space-y-0">
                    <h4 className="text-[14px] font-sans font-bold text-white mb-3 pl-1">Threat Indicators</h4>
                    {result.indicators.map(indicator => (
                        <div key={indicator.name} className="flex items-center gap-4 py-3 border-b border-[rgba(0,255,255,0.1)] last:border-0 hover:bg-[rgba(0,255,255,0.05)] px-3 rounded-[8px] transition-colors">
                            <SeverityIcon severity={indicator.severity} />
                            <div className="flex-1 min-w-0">
                                <span className="text-[14px] font-mono text-white font-medium block truncate">{indicator.name}</span>
                                <p className="text-[#B0BEC5] text-[12px] font-sans truncate mt-0.5">{indicator.description}</p>
                            </div>
                            <SeverityBadge severity={indicator.severity} />
                        </div>
                    ))}
                </div>
            )}

            {/* AI Analysis Mapping matching user exact layout mapping */}
            <div className="bg-[rgba(0,255,255,0.05)] border border-[rgba(0,255,255,0.2)] rounded-[12px] p-5 relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,255,255,0.02)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(0,255,255,0.1)] blur-[40px] rounded-full" />
                <h3 className="flex items-center gap-2 text-[14px] font-sans font-bold text-[#00FFFF] mb-4" style={{ textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>
                    <Bot className="w-4 h-4" /> AI Analysis
                </h3>
                
                {result.aiAnalysis ? (
                    <div className="space-y-4 relative z-10">
                        <p className="text-sm text-text-primary leading-relaxed font-body">
                            {result.aiAnalysis.summary}
                        </p>
                        
                        <div className="flex items-center gap-3 bg-surface-light/50 py-1.5 px-3 rounded-lg w-max border border-border/50">
                            <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Confidence</span>
                            <div className="w-24 h-1.5 bg-surface rounded-full overflow-hidden">
                                <div className="h-full bg-cyan rounded-full" style={{ width: `${result.aiAnalysis.confidence}%` }} />
                            </div>
                            <span className="text-xs text-cyan font-bold">{result.aiAnalysis.confidence}%</span>
                        </div>
                        
                        {result.aiAnalysis.details && result.aiAnalysis.details.length > 0 && (
                            <ul className="space-y-2">
                                {result.aiAnalysis.details.map((detail, i) => (
                                    <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-cyan/50 rounded-full mt-1 shrink-0" />
                                        <span>{detail}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        
                        {result.aiAnalysis.recommendation && (
                            <div className="pt-2">
                                <div className="bg-[rgba(0,0,0,0.2)] border border-[rgba(0,255,255,0.1)] rounded-[8px] p-3 text-[13px] text-[#B2EBF2] font-mono flex items-start gap-2 leading-relaxed">
                                    <span className="text-[#FFE000] drop-shadow-[0_0_4px_#FFE000]">⚡</span> 
                                    {result.aiAnalysis.recommendation}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-[13px] text-[#B0BEC5] italic flex items-center gap-3 font-mono">
                        <div className="w-4 h-4 border-2 border-[#00FFFF] border-t-transparent rounded-full animate-spin drop-shadow-[0_0_8px_#00FFFF]" />
                        Analysis in progress...
                    </p>
                )}
            </div>
            
            <div className="flex items-center justify-between text-[11px] font-mono text-[#607D8B] border-t border-[rgba(0,255,255,0.1)] pt-4 px-2 uppercase tracking-[2px]">
                <span>Scanned: {new Date(result.scannedAt).toLocaleString()}</span>
                <span>Duration: {(result.scanDuration / 1000).toFixed(1)}s</span>
            </div>
        </motion.div>
    )
}
