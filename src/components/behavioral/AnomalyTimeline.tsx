import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import type { BehaviorAnomaly } from '@/types/api'
import { EmptyState } from '@/components/shared/EmptyState'
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

    return (
        <div className="glass-card p-4">
            <h3 className="text-sm font-ui font-semibold text-text-secondary mb-4">Anomaly Timeline</h3>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#FF8C00" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E1E30" />
                    <XAxis
                        dataKey="time"
                        stroke="#44445A"
                        tick={{ fill: '#8888AA', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                    />
                    <YAxis
                        stroke="#44445A"
                        tick={{ fill: '#8888AA', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#13131F',
                            border: '1px solid #2A2A40',
                            borderRadius: '12px',
                            fontFamily: 'IBM Plex Mono',
                            fontSize: '12px',
                            color: '#F0F0FF',
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#FF8C00"
                        fill="url(#anomalyGradient)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
