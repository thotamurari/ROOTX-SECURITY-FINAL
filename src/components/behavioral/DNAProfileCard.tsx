import { motion } from 'framer-motion'
import { useRiskScore } from '@/hooks/useRiskScore'
import { Fingerprint, AlertTriangle, ShieldCheck } from 'lucide-react'
import type { BehaviorProfile } from '@/types/api'
import { Card } from '@/components/shared/Card'

interface Props {
    profile: BehaviorProfile
}

/**
 * useRiskScore still owns the thresholds — this map only re-expresses the
 * tone it returns as design-system tokens so the card themes correctly in
 * light and dark instead of being pinned to fixed hex values.
 */
const TONE_BY_LABEL: Record<string, { color: string; soft: string; text: string }> = {
    SECURE: { color: 'var(--success)', soft: 'bg-success-soft', text: 'text-success' },
    ALERT: { color: 'var(--warning)', soft: 'bg-warning-soft', text: 'text-warning' },
    THREAT: { color: 'var(--warning)', soft: 'bg-warning-soft', text: 'text-warning' },
    CRITICAL: { color: 'var(--danger)', soft: 'bg-danger-soft', text: 'text-danger' },
}

export function DNAProfileCard({ profile }: Props) {
    const risk = useRiskScore(profile.anomalyScore)
    const tone = TONE_BY_LABEL[risk.label] ?? TONE_BY_LABEL.SECURE!
    const isAnomalous = profile.anomalyScore > 60

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
        >
            <Card padding="lg" className="w-full">
                <div className="flex items-center gap-4 mb-5 min-w-0">
                    <span
                        className={`w-12 h-12 rounded-2xl ${tone.soft} flex items-center justify-center shrink-0`}
                        aria-hidden="true"
                    >
                        <Fingerprint className="w-6 h-6" style={{ color: tone.color }} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-[16px] font-semibold text-text-primary tracking-tight">
                            Behavioral DNA
                        </h3>
                        <p className="text-[12px] text-text-tertiary mt-0.5 truncate">
                            Updated {new Date(profile.lastUpdated).toLocaleString()}
                        </p>
                    </div>
                    <span
                        className={`ml-auto shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-md ${tone.soft} ${tone.text}`}
                    >
                        {risk.label}
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-surface-2 border border-border">
                    <div className="text-center sm:text-left shrink-0">
                        <p
                            className="text-[32px] leading-none font-bold tabular-nums"
                            style={{ color: tone.color }}
                        >
                            {profile.anomalyScore}
                        </p>
                        <p className="text-[11px] text-text-tertiary mt-1.5 uppercase tracking-wide">
                            Anomaly Score
                        </p>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div
                            className="h-2 bg-surface-3 rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuenow={profile.anomalyScore}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Anomaly score"
                        >
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: tone.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${profile.anomalyScore}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-[11px] text-text-tertiary">Normal</span>
                            <span className="text-[11px] text-text-tertiary">Anomalous</span>
                        </div>
                    </div>
                </div>

                <div
                    className={`mt-4 p-3.5 rounded-xl flex items-start gap-3 ${isAnomalous
                        ? 'bg-warning-soft border border-warning/20'
                        : 'bg-success-soft border border-success/20'
                        }`}
                >
                    <span className={`shrink-0 mt-0.5 ${isAnomalous ? 'text-warning' : 'text-success'}`} aria-hidden="true">
                        {isAnomalous ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </span>
                    <p className={`text-[13px] leading-relaxed ${isAnomalous ? 'text-warning' : 'text-success'}`}>
                        {isAnomalous
                            ? 'Unusual behavior patterns detected. Review the radar chart for details.'
                            : 'Your behavior patterns are within normal range.'}
                    </p>
                </div>
            </Card>
        </motion.div>
    )
}
