import { useState, useEffect, useRef } from 'react'
import { Radio } from 'lucide-react'
import { Card } from '@/components/shared/Card'

type ThreatLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

interface ThreatItem {
    id: number
    level: ThreatLevel
    msg: string
    time: string
}

/** Level → semantic token classes (themes correctly in light and dark).
 *  Soft background + token text only — Tailwind v3 can't apply alpha
 *  modifiers to `var()`-based colors, so no `/25` borders here. */
const LEVEL_STYLES: Record<ThreatLevel, string> = {
    CRITICAL: 'bg-danger-soft text-danger',
    HIGH: 'bg-warning-soft text-warning',
    MEDIUM: 'bg-info-soft text-info',
    LOW: 'bg-success-soft text-success',
}

const THREAT_FEED: ThreatItem[] = [
    { id: 1, level: 'CRITICAL', msg: 'Phishing URL detected — evil.com', time: '2m ago' },
    { id: 2, level: 'HIGH', msg: 'Malware hash found — 8 vendors flagged', time: '5m ago' },
    { id: 3, level: 'MEDIUM', msg: 'Suspicious domain registered today', time: '12m ago' },
    { id: 4, level: 'HIGH', msg: 'APK with BIND_DEVICE_ADMIN detected', time: '18m ago' },
    { id: 5, level: 'CRITICAL', msg: 'SMS scam campaign — 34 reports', time: '25m ago' },
    { id: 6, level: 'LOW', msg: 'Clean scan — testfire.net safe', time: '31m ago' },
    { id: 7, level: 'HIGH', msg: 'Trojan dropper in APK — 12 flags', time: '38m ago' },
    { id: 8, level: 'MEDIUM', msg: 'Unauthorized background location access', time: '44m ago' },
]

export function ThreatIntelFeed() {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [paused, setPaused] = useState(false)

    // Auto-scroll
    useEffect(() => {
        const el = scrollRef.current
        if (!el || paused) return

        const interval = setInterval(() => {
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
                el.scrollTop = 0
            } else {
                el.scrollTop += 1
            }
        }, 40)

        return () => clearInterval(interval)
    }, [paused])

    return (
        <Card padding="none" className="overflow-hidden h-full flex flex-col">
            <div className="flex items-center gap-2 px-5 pt-4 pb-3">
                <span className="w-7 h-7 rounded-lg bg-danger-soft text-danger flex items-center justify-center shrink-0" aria-hidden="true">
                    <Radio className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-[14px] font-semibold text-text-primary tracking-tight flex-1 min-w-0 truncate">
                    Threat Intelligence
                </h3>
                <span className="flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" aria-hidden="true" />
                    <span className="text-[10px] font-semibold text-danger uppercase tracking-[0.14em]">Live</span>
                </span>
            </div>

            <div
                ref={scrollRef}
                className="h-[200px] sm:h-[220px] md:h-[240px] overflow-hidden border-t border-border"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
            >
                <ul className="divide-y divide-border">
                    {/* Duplicate items for seamless scrolling */}
                    {[...THREAT_FEED, ...THREAT_FEED].map((item, i) => (
                        <li
                            key={`${item.id}-${i}`}
                            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
                        >
                            {/* Level badge */}
                            <span
                                className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.1em] text-center min-w-[64px] ${LEVEL_STYLES[item.level]}`}
                            >
                                {item.level}
                            </span>

                            {/* Message */}
                            <p className="flex-1 min-w-0 text-[12.5px] text-text-primary truncate">{item.msg}</p>

                            {/* Time */}
                            <span className="shrink-0 text-[11px] text-text-tertiary tabular-nums">{item.time}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    )
}
