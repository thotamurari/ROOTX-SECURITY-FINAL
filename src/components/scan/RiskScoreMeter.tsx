import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRiskScore } from '@/hooks/useRiskScore'

interface Props {
    score: number
    size?: number
}

/** Reads a CSS custom property off <html> so the canvas matches the active theme. */
function cssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return value || fallback
}

export function RiskScoreMeter({ score, size = 240 }: Props) {
    const risk = useRiskScore(score)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    // Bumped whenever the theme class on <html> changes so the canvas repaints
    // with the light/dark token values instead of stale colors.
    const [themeVersion, setThemeVersion] = useState(0)

    useEffect(() => {
        const observer = new MutationObserver(() => setThemeVersion((v) => v + 1))
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const trackColor = cssVar('--bg-surface-3', '#22252b')
        const tickIdleColor = cssVar('--border-strong', 'rgba(255,255,255,0.16)')

        const dpr = window.devicePixelRatio || 1
        canvas.width = size * dpr
        canvas.height = (size * 0.65) * dpr
        ctx.scale(dpr, dpr)

        const cx = size / 2
        const cy = size * 0.55
        const radius = size * 0.4
        const startAngle = Math.PI
        const endAngle = 2 * Math.PI

        // Background arc
        ctx.beginPath()
        ctx.arc(cx, cy, radius, startAngle, endAngle)
        ctx.strokeStyle = trackColor
        ctx.lineWidth = 12
        ctx.lineCap = 'round'
        ctx.stroke()

        // Score arc
        const scoreAngle = startAngle + (score / 100) * Math.PI
        ctx.beginPath()
        ctx.arc(cx, cy, radius, startAngle, scoreAngle)
        ctx.strokeStyle = risk.color
        ctx.lineWidth = 12
        ctx.lineCap = 'round'
        ctx.shadowColor = risk.color
        ctx.shadowBlur = 8
        ctx.stroke()
        ctx.shadowBlur = 0

        // Tick marks
        for (let i = 0; i <= 10; i++) {
            const angle = startAngle + (i / 10) * Math.PI
            const x1 = cx + Math.cos(angle) * (radius + 10)
            const y1 = cy + Math.sin(angle) * (radius + 10)
            const x2 = cx + Math.cos(angle) * (radius + 16)
            const y2 = cy + Math.sin(angle) * (radius + 16)
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.strokeStyle = i * 10 <= score ? risk.color + '80' : tickIdleColor
            ctx.lineWidth = 1.5
            ctx.stroke()
        }

        // Needle
        const needleAngle = startAngle + (score / 100) * Math.PI
        const needleLength = radius - 20
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(
            cx + Math.cos(needleAngle) * needleLength,
            cy + Math.sin(needleAngle) * needleLength
        )
        ctx.strokeStyle = risk.color
        ctx.lineWidth = 2
        ctx.stroke()

        // Center dot
        ctx.beginPath()
        ctx.arc(cx, cy, 4, 0, Math.PI * 2)
        ctx.fillStyle = risk.color
        ctx.fill()
    }, [score, size, risk.color, themeVersion])

    return (
        <div className="flex flex-col items-center max-w-full">
            <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Risk score ${score} out of 100 — ${risk.label}`}
                className="max-w-full"
                style={{ width: size, height: size * 0.65 }}
            />
            <motion.div
                className="text-center -mt-2"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
            >
                <p className="text-[34px] leading-none font-bold tabular-nums" style={{ color: risk.color }}>
                    {score}
                </p>
                <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mt-1.5">
                    {risk.label}
                </p>
            </motion.div>
        </div>
    )
}
