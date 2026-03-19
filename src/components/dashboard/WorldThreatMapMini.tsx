import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import type { TrackerConnection } from '@/types/api'

interface Props {
    connections: TrackerConnection[]
}

export function WorldThreatMapMini({ connections }: Props) {
    return (
        <div className="p-4 rounded-[16px] bg-[linear-gradient(135deg,rgba(17,24,39,0.95)_0%,rgba(13,17,23,0.90)_100%)] backdrop-blur-[20px] border border-cyan/20 shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative overflow-hidden">
            <h3 className="text-[16px] font-sans font-bold text-white mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan drop-shadow-[0_0_8px_#00FFFF]" />
                Global Threat Map
            </h3>

            {/* Simplified mini-map visualization */}
            <div className="relative h-40 rounded-[12px] bg-[#0A0F1E] border border-transparent overflow-hidden">
                {/* Grid lines */}
                <div 
                    className="absolute inset-0 opacity-100" 
                    style={{
                        backgroundImage: 'linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }} 
                />

                {/* Simplified world outline */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet">
                    {/* Basic continent outlines as circles/ellipses */}
                    <ellipse cx="90" cy="70" rx="30" ry="20" fill="rgba(0,255,255,0.03)" stroke="rgba(0,255,255,0.15)" strokeWidth="1" />
                    <ellipse cx="170" cy="65" rx="40" ry="30" fill="rgba(0,255,255,0.03)" stroke="rgba(0,255,255,0.15)" strokeWidth="1" />
                    <ellipse cx="280" cy="80" rx="35" ry="25" fill="rgba(0,255,255,0.03)" stroke="rgba(0,255,255,0.15)" strokeWidth="1" />
                    <ellipse cx="170" cy="120" rx="20" ry="15" fill="rgba(0,255,255,0.03)" stroke="rgba(0,255,255,0.15)" strokeWidth="1" />

                    {/* Connection dots */}
                    {connections.slice(0, 20).map((conn, i) => {
                        const x = ((conn.longitude + 180) / 360) * 360
                        const y = ((90 - conn.latitude) / 180) * 180
                        return (
                            <g key={conn.id}>
                                <motion.circle
                                    cx={x}
                                    cy={y}
                                    r="3.5"
                                    className={conn.isFlagged ? 'animate-pulse-red' : 'animate-pulse-green'}
                                    fill={conn.isFlagged ? '#FF1744' : '#00FF7F'}
                                    initial={{ opacity: 0, r: 0 }}
                                    animate={{
                                        opacity: [0.6, 1, 0.6],
                                        r: [2, 3.5, 2],
                                    }}
                                    transition={{
                                        delay: i * 0.1,
                                        duration: 2,
                                        repeat: Infinity,
                                    }}
                                />
                                {conn.isFlagged && (
                                    <path 
                                        d={`M 170 65 Q ${(170 + x) / 2} ${(65 + y) / 2 - 20} ${x} ${y}`} 
                                        fill="none" 
                                        stroke="rgba(0,255,255,0.4)" 
                                        strokeWidth="1" 
                                        strokeDasharray="4,4" 
                                        className="animate-[dash_2s_linear_infinite]" 
                                    />
                                )}
                            </g>
                        )
                    })}
                </svg>

                {/* Stats overlay */}
                <div className="absolute bottom-2 left-3 right-3 flex justify-between">
                    <span className="text-[11px] font-mono text-[#B0BEC5] tracking-wide">
                        {connections.length} connections
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#FF1744] tracking-wide" style={{ textShadow: '0 0 10px rgba(255,23,68,0.5)' }}>
                        {connections.filter((c) => c.isFlagged).length} flagged
                    </span>
                </div>
            </div>
        </div>
    )
}
