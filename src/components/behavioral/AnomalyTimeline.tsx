import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import type { BehaviorAnomaly } from '@/types/api'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/shared/Card'
import { Activity } from 'lucide-react'

interface Props {
    anomalies: BehaviorAnomaly[]
}

export function AnomalyTimeline({ anomalies }: Props) {
    if (!anomalies.length) {
        return <EmptyState icon={Activity} title="No anomalies" message="Your behavior is normal." />
    }

    const data = anomalies.map((a) => ({
        time: new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        score: a.score,
        severity: a.severity,
    }))

    const peak = data.reduce((max, d) => (d.score > max.score ? d : max), data[0]!)

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
        >
            <Card padding="sm" className="w-full">
                <CardHeader className="mb-3">
                    <div className="min-w-0">
                        <CardTitle>Anomaly Timeline</CardTitle>
                        <CardDescription>
                            {data.length} {data.length === 1 ? 'anomaly' : 'anomalies'} recorded
                        </CardDescription>
                    </div>
                    <span className="inline-flex items-center gap-1.5 shrink-0 rounded-md bg-warning-soft px-2 py-1 text-[11px] font-semibold text-warning">
                        <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                        Peak {peak.score}
                    </span>
                </CardHeader>

                {/* Chart colors are driven by the design-system CSS variables so the
                    graph re-themes automatically in light/dark mode. Recharts passes
                    these straight through as SVG presentation attributes. */}
                <div className="w-full" role="img" aria-label={`Anomaly score over time. ${data.length} data points, peaking at ${peak.score} out of 100 at ${peak.time}.`}>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                            <defs>
                                <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.28} />
                                    <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                            <XAxis
                                dataKey="time"
                                stroke="var(--border-default)"
                                tickLine={false}
                                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                            />
                            <YAxis
                                stroke="var(--border-default)"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                            />
                            <Tooltip
                                cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                                contentStyle={{
                                    backgroundColor: 'var(--bg-surface-2)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: '12px',
                                    boxShadow: 'var(--shadow-md)',
                                    fontSize: '12px',
                                    color: 'var(--text-primary)',
                                }}
                                labelStyle={{ color: 'var(--text-secondary)', fontSize: '11px' }}
                                itemStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="var(--warning)"
                                fill="url(#anomalyGradient)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </motion.div>
    )
}
