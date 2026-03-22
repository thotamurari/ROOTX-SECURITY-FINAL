import { useState, useEffect, useRef } from 'react'
import { Radio } from 'lucide-react'

interface ThreatItem {
    id: number
    level: string
    color: string
    msg: string
    time: string
}

const THREAT_FEED: ThreatItem[] = [
    { id: 1, level: 'CRITICAL', color: '#FF3366', msg: 'Phishing URL detected — evil.com', time: '2m ago' },
    { id: 2, level: 'HIGH', color: '#FF8C00', msg: 'Malware hash found — 8 vendors flagged', time: '5m ago' },
    { id: 3, level: 'MEDIUM', color: '#00F5FF', msg: 'Suspicious domain registered today', time: '12m ago' },
    { id: 4, level: 'HIGH', color: '#FF8C00', msg: 'APK with BIND_DEVICE_ADMIN detected', time: '18m ago' },
    { id: 5, level: 'CRITICAL', color: '#FF3366', msg: 'SMS scam campaign — 34 reports', time: '25m ago' },
    { id: 6, level: 'LOW', color: '#00FF88', msg: 'Clean scan — testfire.net safe', time: '31m ago' },
    { id: 7, level: 'HIGH', color: '#FF8C00', msg: 'Trojan dropper in APK — 12 flags', time: '38m ago' },
    { id: 8, level: 'MEDIUM', color: '#00F5FF', msg: 'Unauthorized background location access', time: '44m ago' },
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
        <div className="rounded-[16px] bg-[rgba(13,13,20,0.75)] backdrop-blur-[20px] border border-[#2A2A40] overflow-hidden transition-all hover:border-[rgba(255,51,102,0.15)]">
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#FF3366]" style={{ filter: 'drop-shadow(0 0 6px #FF3366)' }} />
                <h3 className="text-[15px] font-sans font-semibold text-[#F0F0FF]">Threat Intelligence</h3>
                <div className="w-2 h-2 rounded-full bg-[#FF3366] ml-1 animate-[live-pulse_1.5s_ease-in-out_infinite]" style={{ boxShadow: '0 0 8px #FF3366' }} />
                <span className="text-[10px] font-mono font-semibold text-[#FF3366] uppercase tracking-wider ml-0.5">LIVE</span>
            </div>

            <div
                ref={scrollRef}
                className="h-[200px] sm:h-[220px] md:h-[240px] overflow-hidden"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                <div className="divide-y divide-[#1E1E30]">
                    {/* Duplicate items for seamless scrolling */}
                    {[...THREAT_FEED, ...THREAT_FEED].map((item, i) => (
                        <div
                            key={`${item.id}-${i}`}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                        >
                            {/* Level badge */}
                            <span
                                className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider text-center min-w-[60px]"
                                style={{
                                    color: item.color,
                                    backgroundColor: `${item.color}15`,
                                    border: `1px solid ${item.color}33`,
                                }}
                            >
                                {item.level}
                            </span>

                            {/* Message */}
                            <p className="flex-1 text-[12px] font-sans text-[#F0F0FF] truncate">{item.msg}</p>

                            {/* Time */}
                            <span className="shrink-0 text-[10px] font-mono text-[#44445A]">{item.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
