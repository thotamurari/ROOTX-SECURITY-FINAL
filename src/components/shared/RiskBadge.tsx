interface RiskBadgeProps {
    level: string
    score?: number
    size?: 'sm' | 'md'
}

interface RiskConfig {
    label: string
    bgVar: string
    colorVar: string
}

// Mapped onto the shared design-system tokens (--success/--info/--warning/--danger)
// so risk colors stay consistent with the rest of the app and automatically
// adapt between light and dark themes.
const RISK_CONFIG: Record<string, RiskConfig> = {
    safe:       { label: 'SAFE',       bgVar: 'var(--success-soft)', colorVar: 'var(--success)' },
    unverified: { label: 'UNVERIFIED', bgVar: 'var(--warning-soft)', colorVar: 'var(--warning)' },
    caution:    { label: 'CAUTION',    bgVar: 'var(--info-soft)',    colorVar: 'var(--info)' },
    danger:     { label: 'DANGER',     bgVar: 'var(--warning-soft)', colorVar: 'var(--warning)' },
    critical:   { label: 'CRITICAL',   bgVar: 'var(--danger-soft)',  colorVar: 'var(--danger)' },
}

const DEFAULT_CONFIG: RiskConfig = RISK_CONFIG.safe!

export function RiskBadge({ level, score, size = 'md' }: RiskBadgeProps) {
    const config = RISK_CONFIG[level] || DEFAULT_CONFIG
    const isCritical = level === 'critical'

    return (
        <span
            className={isCritical ? 'animate-pulse' : undefined}
            style={{
                background: config.bgVar,
                color: config.colorVar,
                border: `1px solid ${config.colorVar}`,
                borderColor: config.colorVar,
                opacity: 1,
                padding: size === 'sm' ? '2px 8px' : '4px 12px',
                borderRadius: '6px',
                fontSize: size === 'sm' ? '10px' : '11px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 600,
                letterSpacing: '0.08em',
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
    if (score >= 80) return 'var(--danger)'
    if (score >= 55) return 'var(--warning)'
    if (score >= 25) return 'var(--info)'
    return 'var(--success)'
}

export function getRiskLevel(score: number): string {
    if (score >= 80) return 'critical'
    if (score >= 55) return 'danger'
    if (score >= 25) return 'caution'
    return 'safe'
}
