import { motion } from 'framer-motion'
import { useRiskScore } from '@/hooks/useRiskScore'
import { Fingerprint } from 'lucide-react'
import type { BehaviorProfile } from '@/types/api'

interface Props {
    profile: BehaviorProfile
}

export function DNAProfileCard({ profile }: Props) {
    const risk = useRiskScore(profile.anomalyScore)

    return (
        <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl ${risk.bgClass} flex items-center justify-center`}>
                    <Fingerprint className="w-7 h-7" style={{ color: risk.color }} />
                </div>
                <div>
                    <h3 className="text-lg font-display font-bold text-text-primary">Behavioral DNA</h3>
                    <p className="text-xs font-body text-text-muted">
                        Last updated: {new Date(profile.lastUpdated).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border">
                <div className="text-center">
                    <p className="text-3xl font-display font-bold" style={{ color: risk.color }}>
                        {profile.anomalyScore}
                    </p>
                    <p className="text-xs font-body text-text-muted mt-1">Anomaly Score</p>
                </div>
                <div className="flex-1">
                    <div className="h-2 bg-primary rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: risk.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${profile.anomalyScore}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px] font-body text-neon-green">Normal</span>
                        <span className="text-[10px] font-body text-neon-red">Anomalous</span>
                    </div>
                </div>
            </div>

            <div className={`mt-4 p-3 rounded-xl border ${profile.anomalyScore > 60
                    ? 'border-neon-orange/20 bg-neon-orange/5'
                    : 'border-neon-green/20 bg-neon-green/5'
                }`}>
                <p className={`text-sm font-body ${profile.anomalyScore > 60 ? 'text-neon-orange' : 'text-neon-green'}`}>
                    {profile.anomalyScore > 60
                        ? '⚠️ Unusual behavior patterns detected. Review the radar chart for details.'
                        : '✅ Your behavior patterns are within normal range.'}
                </p>
            </div>
        </motion.div>
    )
}
