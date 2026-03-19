import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRiskScore } from '@/hooks/useRiskScore'

interface Props {
    score: number
    size?: number
}

export function RiskScoreMeter({ score, size = 240 }: Props) {
    const risk = useRiskScore(score)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

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
        ctx.strokeStyle = '#1E1E30'
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
        ctx.shadowBlur = 15
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
            ctx.strokeStyle = i * 10 <= score ? risk.color + '80' : '#2A2A40'
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
    }, [score, size, risk.color])

    return (
        <div className="flex flex-col items-center">
            <canvas
                ref={canvasRef}
                style={{ width: size, height: size * 0.65 }}
            />
            <motion.div
                className="text-center -mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <p className="text-4xl font-display font-bold" style={{ color: risk.color }}>
                    {score}
                </p>
                <p className="text-sm font-body text-text-muted">{risk.label}</p>
            </motion.div>
        </div>
    )
}
