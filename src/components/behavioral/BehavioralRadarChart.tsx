import { useEffect, useRef } from 'react'
import type { BehaviorProfile } from '@/types/api'

interface Props {
    profile: BehaviorProfile
    size?: number
}

const LABELS = [
    'App Usage',
    'Location',
    'Network',
    'Time Pattern',
    'Permissions',
    'Contacts',
    'Camera',
    'Payments',
]

const KEYS: (keyof BehaviorProfile['baseline'])[] = [
    'appUsage',
    'locationVariance',
    'networkActivity',
    'timePattern',
    'permissionUsage',
    'contactAccess',
    'cameraUsage',
    'paymentActivity',
]

export function BehavioralRadarChart({ profile, size = 320 }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        canvas.width = size * dpr
        canvas.height = size * dpr
        ctx.scale(dpr, dpr)

        const cx = size / 2
        const cy = size / 2
        const maxR = size * 0.38
        const n = KEYS.length
        const step = (2 * Math.PI) / n

        ctx.clearRect(0, 0, size, size)

        // Grid circles
        for (let i = 1; i <= 5; i++) {
            const r = (i / 5) * maxR
            ctx.beginPath()
            for (let j = 0; j <= n; j++) {
                const angle = j * step - Math.PI / 2
                const x = cx + Math.cos(angle) * r
                const y = cy + Math.sin(angle) * r
                j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            }
            ctx.closePath()
            ctx.strokeStyle = '#1E1E30'
            ctx.lineWidth = 1
            ctx.stroke()
        }

        // Axis lines + labels
        for (let i = 0; i < n; i++) {
            const angle = i * step - Math.PI / 2
            const x = cx + Math.cos(angle) * maxR
            const y = cy + Math.sin(angle) * maxR
            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.lineTo(x, y)
            ctx.strokeStyle = '#1E1E3050'
            ctx.lineWidth = 0.5
            ctx.stroke()

            // Label
            const lx = cx + Math.cos(angle) * (maxR + 18)
            const ly = cy + Math.sin(angle) * (maxR + 18)
            ctx.font = '10px "DM Sans", sans-serif'
            ctx.fillStyle = '#8888AA'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(LABELS[i] ?? '', lx, ly)
        }

        // Draw area helper
        const drawArea = (
            data: BehaviorProfile['baseline'],
            fill: string,
            stroke: string,
            alpha: number
        ) => {
            ctx.beginPath()
            for (let i = 0; i < n; i++) {
                const angle = i * step - Math.PI / 2
                const key = KEYS[i]!
                const val = (data[key] / 100) * maxR
                const x = cx + Math.cos(angle) * val
                const y = cy + Math.sin(angle) * val
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            }
            ctx.closePath()
            ctx.globalAlpha = alpha
            ctx.fillStyle = fill
            ctx.fill()
            ctx.globalAlpha = 1
            ctx.strokeStyle = stroke
            ctx.lineWidth = 2
            ctx.stroke()

            // Data points
            for (let i = 0; i < n; i++) {
                const angle = i * step - Math.PI / 2
                const key = KEYS[i]!
                const val = (data[key] / 100) * maxR
                const x = cx + Math.cos(angle) * val
                const y = cy + Math.sin(angle) * val
                ctx.beginPath()
                ctx.arc(x, y, 3, 0, Math.PI * 2)
                ctx.fillStyle = stroke
                ctx.fill()
            }
        }

        // Baseline
        drawArea(profile.baseline, '#00F5FF15', '#00F5FF', 0.15)
        // Today
        drawArea(profile.today, '#FF336620', '#FF3366', 0.2)
    }, [profile, size])

    return (
        <div className="flex flex-col items-center">
            <canvas ref={canvasRef} style={{ width: size, height: size }} />
            <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan" />
                    <span className="text-xs font-body text-text-secondary">Baseline</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-neon-red" />
                    <span className="text-xs font-body text-text-secondary">Today</span>
                </div>
            </div>
        </div>
    )
}
