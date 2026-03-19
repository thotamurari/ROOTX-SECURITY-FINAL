import { motion } from 'framer-motion'
import { Dna } from 'lucide-react'
import { BehavioralRadarChart } from '@/components/behavioral/BehavioralRadarChart'
import { AnomalyTimeline } from '@/components/behavioral/AnomalyTimeline'
import { BehaviorEventLog } from '@/components/behavioral/BehaviorEventLog'
import { DNAProfileCard } from '@/components/behavioral/DNAProfileCard'
import { useBehavioralDNA } from '@/hooks/useBehavioralDNA'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function BehavioralDNA() {
    const { profile, isLoadingProfile, anomalies, report, isLoadingReport } = useBehavioralDNA()

    if (isLoadingProfile) {
        return <LoadingSpinner size="lg" text="Loading behavioral data..." />
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-3">
                    <Dna className="w-7 h-7 text-cyan" />
                    Behavioral DNA
                </h1>
                <p className="text-sm text-text-secondary font-body mt-1">
                    Your digital behavior fingerprint and anomaly detection
                </p>
            </motion.div>

            {profile && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                        <BehavioralRadarChart profile={profile} />
                    </div>
                    <DNAProfileCard profile={profile} />
                </div>
            )}

            {anomalies && <AnomalyTimeline anomalies={anomalies} />}

            {!isLoadingReport && report && <BehaviorEventLog events={report} />}
        </div>
    )
}
