import { motion } from 'framer-motion'
import { AlertTriangle, Bot, Shield, CheckCircle, Info, AlertOctagon, Sparkles, Clock, Timer, ShieldAlert, WifiOff, Search } from 'lucide-react'
import type { ScanResult, SourceConsulted } from '@/types/api'
import { Card } from '@/components/shared/Card'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { VendorReport } from './VendorReport'
import { MultiToolScannerCard } from './MultiToolScannerCard'

interface Props {
    result: ScanResult
}

/**
 * Threat-level thresholds are unchanged from the original implementation —
 * only the colors were re-pointed at the semantic design tokens so the report
 * themes correctly in light and dark mode.
 */
const getThreatLevel = (score: number, tierOverride?: string) => {
    if (tierOverride === 'unverified') return { badge: 'unverified', stroke: 'var(--warning)', text: 'text-warning' }
    if (score >= 86) return { badge: 'critical', stroke: 'var(--danger)', text: 'text-danger' }
    if (score >= 61) return { badge: 'danger', stroke: 'var(--warning)', text: 'text-warning' }
    if (score >= 31) return { badge: 'caution', stroke: 'var(--info)', text: 'text-info' }
    return { badge: 'safe', stroke: 'var(--success)', text: 'text-success' }
}

const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 } as Record<string, number>

const SEVERITY_STYLES: Record<string, string> = {
    critical: 'bg-danger-soft text-danger',
    high: 'bg-warning-soft text-warning',
    medium: 'bg-info-soft text-info',
    low: 'bg-success-soft text-success',
    info: 'bg-surface-2 text-text-tertiary',
}

function SeverityIcon({ severity }: { severity: string }) {
    if (severity === 'critical') return <AlertOctagon className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />
    if (severity === 'high') return <AlertTriangle className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />
    if (severity === 'medium') return <Info className="w-4 h-4 text-info shrink-0" aria-hidden="true" />
    if (severity === 'low') return <CheckCircle className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
    return <Info className="w-4 h-4 text-text-tertiary shrink-0" aria-hidden="true" />
}

function SeverityBadge({ severity }: { severity: string }) {
    return (
        <span
            className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold uppercase tracking-wide shrink-0 ${
                SEVERITY_STYLES[severity] || SEVERITY_STYLES.info
            }`}
        >
            {severity}
        </span>
    )
}

const RING_SIZE = 112
const RING_RADIUS = 50
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function ThreatReportCard({ result }: Props) {
    const isUnverified = result.threatLevel === 'unverified' || result.verificationTier === 'unverified'
    const threat = getThreatLevel(result.riskScore, isUnverified ? 'unverified' : undefined)

    // Sort indicators by severity (critical first)
    const sortedIndicators = [...result.indicators].sort(
        (a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
    )

    const sourcesConsulted = result.aiAnalysis?.sourcesConsulted

    return (
        <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* ── Summary ── */}
            <Card padding="lg">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Score ring */}
                    <div
                        className="relative shrink-0"
                        style={{ width: RING_SIZE, height: RING_SIZE }}
                        role="img"
                        aria-label={`Risk score ${result.riskScore} out of 100`}
                    >
                        <svg
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full -rotate-90"
                            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                        >
                            <circle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={RING_RADIUS}
                                fill="none"
                                stroke="var(--border-default)"
                                strokeWidth="7"
                            />
                            <motion.circle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={RING_RADIUS}
                                fill="none"
                                stroke={threat.stroke}
                                strokeWidth="7"
                                strokeLinecap="round"
                                strokeDasharray={RING_CIRCUMFERENCE}
                                initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                                animate={{
                                    strokeDashoffset:
                                        RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * result.riskScore) / 100,
                                }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-[32px] leading-none font-bold tabular-nums ${threat.text}`}>
                                {result.riskScore}
                            </span>
                            <span className="text-[10.5px] text-text-tertiary uppercase tracking-wider mt-1">
                                Risk score
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left space-y-3">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                            <h3 className="text-[17px] font-bold text-text-primary capitalize tracking-tight">
                                {result.scanType} scan report
                            </h3>
                            <RiskBadge level={threat.badge} />
                        </div>

                        <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 max-w-full">
                            <p className="text-[12.5px] font-mono text-text-secondary break-all line-clamp-3">
                                {result.input}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* ── Verification Tier Banner ── */}
            {result.analysisMethod === 'local_heuristic' && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }}
                >
                    <Card padding="sm" className={`border-l-4 ${
                        isUnverified
                            ? 'border-l-warning bg-warning-soft/30'
                            : result.verificationTier === 'verified_safe'
                                ? 'border-l-success bg-success-soft/30'
                                : 'border-l-danger bg-danger-soft/30'
                    }`}>
                        <div className="flex items-start gap-3">
                            {isUnverified ? (
                                <WifiOff className="w-5 h-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                            ) : result.verificationTier === 'verified_safe' ? (
                                <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
                            ) : (
                                <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
                            )}
                            <div>
                                <p className={`text-[13px] font-semibold ${
                                    isUnverified ? 'text-warning' : result.verificationTier === 'verified_safe' ? 'text-success' : 'text-danger'
                                }`}>
                                    {isUnverified
                                        ? '⚠️ Unverified — Offline scan with limited data'
                                        : result.verificationTier === 'verified_safe'
                                            ? '✅ Verified Safe — Known legitimate domain'
                                            : '🚫 High Risk — Threat indicators detected'}
                                </p>
                                <p className="text-[12px] text-text-secondary mt-0.5">
                                    {isUnverified
                                        ? 'No external security APIs were queried. Connect to the RootX backend for real-time multi-engine verification before trusting this link.'
                                        : result.verificationTier === 'verified_safe'
                                            ? 'This domain is in the RootX verified registry. Standard security hygiene still applies.'
                                            : 'Local heuristic analysis found risk indicators. Avoid entering credentials or downloading files.'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* ── Sources Consulted ── */}
            {sourcesConsulted && sourcesConsulted.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.15 }}
                >
                    <Card padding="md">
                        <div className="flex items-center gap-2 mb-3">
                            <Search className="w-4 h-4 text-accent" aria-hidden="true" />
                            <h4 className="text-[13.5px] font-semibold text-text-primary">Sources consulted</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {sourcesConsulted.map((source, i) => (
                                <div
                                    key={`${source.name}-${i}`}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
                                        source.status === 'clean'
                                            ? 'bg-success-soft/40 border-success/20'
                                            : source.status === 'flagged'
                                                ? 'bg-danger-soft/40 border-danger/20'
                                                : 'bg-surface-2 border-border'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                                        source.status === 'clean' ? 'bg-success'
                                            : source.status === 'flagged' ? 'bg-danger'
                                                : 'bg-text-tertiary'
                                    }`} aria-hidden="true" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[12px] font-semibold text-text-primary truncate">
                                            {source.name}
                                        </p>
                                        <p className="text-[11px] text-text-secondary truncate">
                                            {source.detail}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                        source.status === 'clean' ? 'bg-success-soft text-success'
                                            : source.status === 'flagged' ? 'bg-danger-soft text-danger'
                                                : 'bg-surface-3 text-text-tertiary'
                                    }`}>
                                        {source.status === 'clean' ? '✅ Clean'
                                            : source.status === 'flagged' ? '🚫 Flagged'
                                                : '— N/A'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* ── 4-Tool URL Security Matrix (VirusTotal, urlscan.io, Google Safe Browsing, Sucuri SiteCheck) ── */}
            {result.scanType === 'url' && result.aiAnalysis?.toolsBreakdown && (
                <MultiToolScannerCard
                    tools={result.aiAnalysis.toolsBreakdown}
                    url={result.input}
                    riskScore={result.riskScore}
                />
            )}

            {/* ── Multi-vendor detection report (URL scans with real VirusTotal data) ── */}
            {result.aiAnalysis?.vendors && result.aiAnalysis.vendors.length > 0 && result.aiAnalysis.detectionStats && (
                <VendorReport
                    vendors={result.aiAnalysis.vendors}
                    stats={result.aiAnalysis.detectionStats}
                    domain={result.aiAnalysis.domain}
                    resolvedIp={result.aiAnalysis.resolvedIp}
                    scannedAtUtc={result.aiAnalysis.scannedAtUtc}
                />
            )}

            {/* ── Threat indicators ── */}
            {sortedIndicators.length > 0 && (
                <Card padding="md">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-accent" aria-hidden="true" />
                        <h4 className="text-[13.5px] font-semibold text-text-primary">Threat indicators</h4>
                        <span className="ml-auto text-[11.5px] font-semibold text-text-secondary bg-surface-2 border border-border px-2 py-0.5 rounded-md">
                            {sortedIndicators.length}
                        </span>
                    </div>
                    <ul className="divide-y divide-border">
                        {sortedIndicators.map((indicator, idx) => (
                            <motion.li
                                key={`${indicator.name}-${idx}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.4) }}
                                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                            >
                                <span className="mt-0.5">
                                    <SeverityIcon severity={indicator.severity} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[13.5px] font-semibold text-text-primary">
                                            {indicator.name}
                                        </span>
                                        <SeverityBadge severity={indicator.severity} />
                                    </div>
                                    <p className="text-[12.5px] text-text-secondary mt-1 leading-relaxed">
                                        {indicator.description}
                                    </p>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                </Card>
            )}

            {/* ── AI analysis ── */}
            <Card padding="md">
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <h4 className="text-[13.5px] font-semibold text-text-primary">RootX AI analysis</h4>
                </div>

                {result.aiAnalysis ? (
                    <div className="space-y-4">
                        <p className="text-[13.5px] text-text-secondary leading-relaxed">
                            {result.aiAnalysis.summary}
                        </p>

                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[11.5px] text-text-tertiary uppercase tracking-wider font-semibold">
                                Confidence
                            </span>
                            <div
                                className="h-1.5 w-28 bg-surface-3 rounded-full overflow-hidden"
                                role="progressbar"
                                aria-valuenow={result.aiAnalysis.confidence}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="AI analysis confidence"
                            >
                                <motion.div
                                    className="h-full rounded-full bg-accent"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.aiAnalysis.confidence}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                />
                            </div>
                            <span className="text-[12.5px] font-semibold text-accent tabular-nums">
                                {result.aiAnalysis.confidence}%
                            </span>
                        </div>

                        {result.aiAnalysis.details && result.aiAnalysis.details.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider">
                                    Analysis details
                                </p>
                                <ul className="space-y-1.5">
                                    {result.aiAnalysis.details.map((detail, i) => (
                                        <li
                                            key={i}
                                            className="text-[12.5px] text-text-secondary flex items-start gap-2.5 leading-relaxed"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="w-1.5 h-1.5 rounded-full bg-accent/60 mt-[7px] shrink-0"
                                            />
                                            <span>{detail}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result.aiAnalysis.recommendation && (
                            <div className="rounded-xl border border-warning/25 bg-warning-soft p-4 flex items-start gap-3">
                                <Sparkles className="w-4 h-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                                <div>
                                    <p className="text-[11.5px] font-semibold text-warning uppercase tracking-wider mb-1">
                                        Recommendation
                                    </p>
                                    <p className="text-[13px] text-text-secondary leading-relaxed">
                                        {result.aiAnalysis.recommendation}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-[13px] text-text-tertiary flex items-center gap-3" aria-live="polite">
                        <span
                            aria-hidden="true"
                            className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"
                        />
                        Analysis in progress...
                    </p>
                )}
            </Card>

            {/* ── Recommended actions ── */}
            {result.recommendations && result.recommendations.length > 0 && (
                <Card padding="md">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-success" aria-hidden="true" />
                        <h4 className="text-[13.5px] font-semibold text-text-primary">Recommended actions</h4>
                    </div>
                    <ol className="space-y-2">
                        {result.recommendations.map((rec, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.3) }}
                                className="flex items-start gap-3 p-3 rounded-xl bg-surface-2 border border-border"
                            >
                                <span className="w-6 h-6 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0 text-[11.5px] font-bold">
                                    {i + 1}
                                </span>
                                <p className="text-[13px] text-text-secondary leading-relaxed">{rec}</p>
                            </motion.li>
                        ))}
                    </ol>
                </Card>
            )}

            {/* ── Footer metadata ── */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11.5px] text-text-tertiary px-1">
                <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    Scanned {new Date(result.scannedAt).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" aria-hidden="true" />
                    {(result.scanDuration / 1000).toFixed(1)}s
                </span>
            </div>
        </motion.div>
    )
}
