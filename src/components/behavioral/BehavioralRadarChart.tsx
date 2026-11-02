import { useEffect, useRef } from 'react'
import type { BehaviorProfile } from '@/types/api'
import { useSettingsStore } from '@/stores/settingsStore'

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

/**
 * Canvas can't resolve `var(--token)` the way SVG/CSS can, so we read the
 * design-system custom properties off <html> at draw time. This keeps the
 * radar on the same semantic palette as the rest of the app and makes it
 * re-theme correctly when the user flips between light and dark.
 */
function readToken(name: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return value || fallback
}

export function BehavioralRadarChart({ profile, size = 320 }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    // Redraw trigger only — the theme flag drives which token values we read.
    const darkMode = useSettingsStore((s) => s.darkMode)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const gridColor = readToken('--border-default', 'rgba(255,255,255,0.10)')
        const axisColor = readToken('--border-subtle', 'rgba(255,255,255,0.06)')
        const labelColor = readToken('--text-tertiary', '#6B7280')
        const baselineColor = readToken('--accent', '#3b82f6')
        const todayColor = readToken('--danger', '#f5473d')

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
            ctx.strokeStyle = gridColor
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
            ctx.strokeStyle = axisColor
            ctx.lineWidth = 0.5
            ctx.stroke()

            // Label
            const lx = cx + Math.cos(angle) * (maxR + 18)
            const ly = cy + Math.sin(angle) * (maxR + 18)
            ctx.font = '600 10px Inter, -apple-system, sans-serif'
            ctx.fillStyle = labelColor
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
        drawArea(profile.baseline, baselineColor, baselineColor, 0.15)
        // Today
        drawArea(profile.today, todayColor, todayColor, 0.2)
    }, [profile, size, darkMode])

    // Screen-reader alternative to the canvas: the same numbers as plain text.
    const summary = KEYS.map(
        (key, i) => `${LABELS[i]}: baseline ${profile.baseline[key]}, today ${profile.today[key]}`
    ).join('; ')

    return (
        <div className="flex flex-col items-center w-full">
            {/* Responsive: the canvas keeps its square drawing space but scales
                down to the container on narrow viewports instead of forcing a
                fixed pixel width. */}
            <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Behavioral radar chart comparing baseline and today across eight signals. ${summary}.`}
                className="w-full h-auto"
                style={{ maxWidth: size, aspectRatio: '1 / 1' }}
            />

            <ul className="flex items-center justify-center gap-5 mt-4 flex-wrap">
                <li className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                    <span className="text-[12px] text-text-secondary">Baseline</span>
                </li>
                <li className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-danger shrink-0" aria-hidden="true" />
                    <span className="text-[12px] text-text-secondary">Today</span>
                </li>
            </ul>
        </div>
    )
}
