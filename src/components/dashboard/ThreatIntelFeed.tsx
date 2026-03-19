import { motion } from 'framer-motion'
import { AlertTriangle, Radio } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getSocket } from '@/services/socket'
import type { ThreatDetectedEvent } from '@/types/api'

export function ThreatIntelFeed() {
    const [threats, setThreats] = useState<ThreatDetectedEvent[]>([])

    useEffect(() => {
        const socket = getSocket()
        const onThreat = (data: ThreatDetectedEvent) => {
            setThreats((prev) => [data, ...prev].slice(0, 20))
        }
        socket.on('threat:detected', onThreat)
        return () => {
            socket.off('threat:detected', onThreat)
        }
    }, [])

    return (
        <div className="p-4 rounded-[16px] bg-[linear-gradient(135deg,rgba(17,24,39,0.95)_0%,rgba(13,17,23,0.90)_100%)] backdrop-blur-[20px] border border-bright-red/20 shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden">
            <h3 className="text-[16px] font-sans font-bold text-white mb-3 flex items-center gap-2">
                <Radio className="w-5 h-5 text-bright-red drop-shadow-[0_0_8px_#FF1744]" />
                <span style={{ textShadow: '0 0 10px rgba(255,23,68,0.3)' }}>Threat Intelligence</span>
                <div 
                    className="w-2 h-2 rounded-full bg-bright-red animate-blink ml-1" 
                    style={{ boxShadow: '0 0 8px #FF1744' }} 
                />
            </h3>

            {threats.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-[#607D8B] text-[12px] font-mono">No threats detected. Monitoring...</p>
                </div>
            ) : (
                <div className="relative h-[200px] overflow-hidden group">
                    <div className="space-y-2 absolute inset-x-0 group-hover:[animation-play-state:paused] animate-scroll-up">
                        {/* Duplicate the array to create an infinite scroll illusion */}
                        {[...threats, ...threats].map((threat, i) => {
                            let severityStyle = { border: '', bg: '', text: '', badgeBg: '', badgeText: '', iconShadow: '' }
                            if (threat.type === 'anomaly') {
                                severityStyle = { border: 'border-l-[3px] border-l-[#FF1744] border-t-transparent border-r-transparent border-b-transparent', bg: 'bg-[rgba(255,23,68,0.06)]', text: 'text-[#FFCDD2]', badgeBg: 'bg-[#FF1744]', badgeText: 'text-white', iconShadow: 'drop-shadow-[0_0_8px_#FF1744]' }
                            } else if (threat.type === 'url') {
                                severityStyle = { border: 'border-l-[3px] border-l-[#FF6B00] border-y-transparent border-r-transparent', bg: 'bg-[rgba(255,107,0,0.06)]', text: 'text-[#FFE0B2]', badgeBg: 'bg-[#FF6B00]', badgeText: 'text-white', iconShadow: 'drop-shadow-[0_0_8px_#FF6B00]' }
                            } else if (threat.type === 'file') {
                                severityStyle = { border: 'border-l-[3px] border-l-[#FFE000] border-y-transparent border-r-transparent', bg: 'bg-[rgba(255,224,0,0.06)]', text: 'text-[#FFF9C4]', badgeBg: 'bg-[#FFE000]', badgeText: 'text-[#080B14]', iconShadow: 'drop-shadow-[0_0_8px_#FFE000]' }
                            } else {
                                severityStyle = { border: 'border-l-[3px] border-l-[#00FFFF] border-y-transparent border-r-transparent', bg: 'bg-[rgba(0,255,255,0.04)]', text: 'text-[#B2EBF2]', badgeBg: 'bg-[#00FFFF]', badgeText: 'text-[#080B14]', iconShadow: 'drop-shadow-[0_0_8px_#00FFFF]' }
                            }

                            return (
                                <div
                                    key={`${threat.id}-${i}`}
                                    className={`flex items-start gap-3 p-3 rounded-r-[8px] border border-transparent ${severityStyle.border} ${severityStyle.bg}`}
                                >
                                    <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${severityStyle.badgeBg.replace('bg-', 'text-')} ${severityStyle.iconShadow}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] uppercase ${severityStyle.badgeBg} ${severityStyle.badgeText}`}>
                                                {threat.type === 'anomaly' ? 'CRITICAL' : threat.type === 'url' ? 'HIGH' : threat.type === 'file' ? 'MEDIUM' : 'INFO'}
                                            </span>
                                        </div>
                                        <p className={`text-[13px] font-mono leading-snug break-words ${severityStyle.text}`}>{threat.message}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
