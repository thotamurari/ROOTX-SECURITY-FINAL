import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, ThumbsUp, ThumbsDown, CheckCircle, X, AlertTriangle } from 'lucide-react'
import { useCommunityFeed } from '@/hooks/useCommunityFeed'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import type { CommunityReport, Severity } from '@/types/api'

const severityColors: Record<Severity, string> = {
    low: 'badge-safe',
    medium: 'badge-caution',
    high: 'badge-danger',
    critical: 'badge-critical',
}

function ReportCard({
    report,
    onVote,
}: {
    report: CommunityReport
    onVote: (id: string, vote: 'up' | 'down') => void
}) {
    return (
        <motion.div
            className="glass-card-hover p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-start justify-between mb-2">
                <div>
                    <p className="text-sm font-ui font-semibold text-text-primary">{report.threatType}</p>
                    <p className="text-xs font-body text-text-muted mt-0.5 truncate max-w-[200px]">
                        Hash: {report.inputHash}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={severityColors[report.severity]}>{report.severity.toUpperCase()}</span>
                    {report.verified && (
                        <CheckCircle className="w-4 h-4 text-neon-green" />
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1 text-xs font-body text-text-muted">
                    <Users className="w-3 h-3" />
                    {report.reportedBy} reports
                    <span className="mx-1">•</span>
                    Trust: <span className="text-cyan">{report.trustScore}%</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onVote(report.id, 'up')}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-body text-neon-green hover:bg-neon-green/10 transition-colors"
                    >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {report.upvotes}
                    </button>
                    <button
                        onClick={() => onVote(report.id, 'down')}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-body text-neon-red hover:bg-neon-red/10 transition-colors"
                    >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        {report.downvotes}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

function SubmitThreatModal({
    onClose,
    onSubmit,
    isSubmitting,
}: {
    onClose: () => void
    onSubmit: (data: { inputHash: string; threatType: string; severity: Severity; description: string }) => void
    isSubmitting: boolean
}) {
    const [form, setForm] = useState({
        inputHash: '',
        threatType: '',
        severity: 'medium' as Severity,
        description: '',
    })

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                className="relative glass-card p-6 max-w-md w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
                    <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-display font-bold text-text-primary mb-4">Report Threat</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-ui text-text-secondary mb-1">URL / Hash</label>
                        <input
                            value={form.inputHash}
                            onChange={(e) => setForm({ ...form, inputHash: e.target.value })}
                            className="input-field"
                            placeholder="URL or file hash"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-ui text-text-secondary mb-1">Threat Type</label>
                        <input
                            value={form.threatType}
                            onChange={(e) => setForm({ ...form, threatType: e.target.value })}
                            className="input-field"
                            placeholder="e.g. Phishing, Malware, Scam"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-ui text-text-secondary mb-1">Severity</label>
                        <select
                            value={form.severity}
                            onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}
                            className="input-field"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-ui text-text-secondary mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="input-field resize-none"
                            rows={3}
                            placeholder="Describe the threat..."
                        />
                    </div>
                    <button
                        onClick={() => onSubmit(form)}
                        disabled={!form.inputHash || !form.threatType || isSubmitting}
                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default function Community() {
    const { feed, isLoading, vote, submitReport, isSubmitting } = useCommunityFeed()
    const [showModal, setShowModal] = useState(false)

    if (isLoading) {
        return <LoadingSpinner size="lg" text="Loading community feed..." />
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-3">
                            <Users className="w-7 h-7 text-cyan" />
                            Community Trust Feed
                        </h1>
                        <p className="text-sm text-text-secondary font-body mt-1">
                            Crowd-sourced threat intelligence from the SafeOpen community
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Report
                    </button>
                </div>
            </motion.div>

            {feed.length === 0 ? (
                <EmptyState
                    icon={AlertTriangle}
                    title="No reports yet"
                    message="Be the first to report a threat to the community."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feed.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onVote={(id, v) => vote({ reportId: id, vote: v })}
                        />
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <SubmitThreatModal
                        onClose={() => setShowModal(false)}
                        onSubmit={(data) => {
                            submitReport(data)
                            setShowModal(false)
                        }}
                        isSubmitting={isSubmitting}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
