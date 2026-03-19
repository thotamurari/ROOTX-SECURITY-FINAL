import { useMemo } from 'react'
import { Shield, AlertTriangle, ShieldAlert, ShieldX } from 'lucide-react'

type RiskInfo = {
    color: string
    label: string
    icon: typeof Shield
    bgClass: string
    glowClass: string
    badgeClass: string
}

export function useRiskScore(score: number): RiskInfo {
    return useMemo(() => {
        if (score <= 30) {
            return {
                color: '#00FF88',
                label: 'SAFE',
                icon: Shield,
                bgClass: 'bg-risk-safe/10',
                glowClass: 'glow-green',
                badgeClass: 'badge-safe',
            }
        }
        if (score <= 60) {
            return {
                color: '#00F5FF',
                label: 'CAUTION',
                icon: AlertTriangle,
                bgClass: 'bg-risk-caution/10',
                glowClass: 'glow-cyan',
                badgeClass: 'badge-caution',
            }
        }
        if (score <= 85) {
            return {
                color: '#FF8C00',
                label: 'DANGER',
                icon: ShieldAlert,
                bgClass: 'bg-risk-danger/10',
                glowClass: 'glow-orange',
                badgeClass: 'badge-danger',
            }
        }
        return {
            color: '#FF3366',
            label: 'CRITICAL',
            icon: ShieldX,
            bgClass: 'bg-risk-critical/10',
            glowClass: 'glow-red',
            badgeClass: 'badge-critical',
        }
    }, [score])
}
