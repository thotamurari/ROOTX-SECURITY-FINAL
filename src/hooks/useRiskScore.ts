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
                color: '#34C759', // Apple Green
                label: 'SECURE',
                icon: Shield,
                bgClass: 'bg-[#34C759]/10',
                glowClass: 'glow-green',
                badgeClass: 'badge-safe',
            }
        }
        if (score <= 60) {
            return {
                color: '#FFCC00', // Apple Yellow
                label: 'ALERT',
                icon: AlertTriangle,
                bgClass: 'bg-[#FFCC00]/10',
                glowClass: 'glow-yellow',
                badgeClass: 'badge-caution',
            }
        }
        if (score <= 85) {
            return {
                color: '#FF9500', // Apple Orange
                label: 'THREAT',
                icon: ShieldAlert,
                bgClass: 'bg-[#FF9500]/10',
                glowClass: 'glow-orange',
                badgeClass: 'badge-danger',
            }
        }
        return {
            color: '#FF3B30', // Apple Red (Vanguard Red)
            label: 'CRITICAL',
            icon: ShieldX,
            bgClass: 'bg-[#FF3B30]/10',
            glowClass: 'glow-red',
            badgeClass: 'badge-critical',
        }
    }, [score])
}

