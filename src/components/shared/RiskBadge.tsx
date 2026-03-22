interface RiskBadgeProps {
    level: string
    score?: number
    size?: 'sm' | 'md'
}

interface RiskConfig {
    label: string
    bg: string
    color: string
    border: string
    animation?: string
}

const RISK_CONFIG: Record<string, RiskConfig> = {
    safe:     { label: 'SAFE',     bg: 'rgba(0,255,136,0.1)',   color: '#00FF88', border: 'rgba(0,255,136,0.3)' },
    caution:  { label: 'CAUTION',  bg: 'rgba(0,245,255,0.1)',   color: '#00F5FF', border: 'rgba(0,245,255,0.3)' },
    danger:   { label: 'DANGER',   bg: 'rgba(255,140,0,0.1)',   color: '#FF8C00', border: 'rgba(255,140,0,0.3)' },
    critical: { label: 'CRITICAL', bg: 'rgba(255,51,102,0.12)', color: '#FF3366', border: 'rgba(255,51,102,0.5)', animation: 'pulse 1.5s infinite' },
}

const DEFAULT_CONFIG: RiskConfig = { label: 'SAFE', bg: 'rgba(0,255,136,0.1)', color: '#00FF88', border: 'rgba(0,255,136,0.3)' }

export function RiskBadge({ level, score, size = 'md' }: RiskBadgeProps) {
    const config = RISK_CONFIG[level] || DEFAULT_CONFIG

    return (
        <span
            style={{
                background: config.bg,
                color: config.color,
                border: `1px solid ${config.border}`,
                animation: config.animation,
                padding: size === 'sm' ? '2px 8px' : '4px 12px',
                borderRadius: '6px',
                fontSize: size === 'sm' ? '10px' : '11px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 600,
                letterSpacing: '0.1em',
                whiteSpace: 'nowrap' as const,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
            }}
        >
            {config.label}
            {score !== undefined && (
                <span style={{ opacity: 0.7 }}>{score}</span>
            )}
        </span>
    )
}

export function getRiskColor(score: number): string {
    if (score >= 80) return '#FF3366'
    if (score >= 55) return '#FF8C00'
    if (score >= 25) return '#00F5FF'
    return '#00FF88'
}

export function getRiskLevel(score: number): string {
    if (score >= 80) return 'critical'
    if (score >= 55) return 'danger'
    if (score >= 25) return 'caution'
    return 'safe'
}
