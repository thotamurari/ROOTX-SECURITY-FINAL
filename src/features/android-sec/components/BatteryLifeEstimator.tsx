import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Battery, Zap, AlertTriangle, AlertCircle } from 'lucide-react'
import type { BatteryEstimator } from '@/types/api'

interface Props {
    data: BatteryEstimator
}

export function BatteryLifeEstimator({ data }: Props) {
    const [simulatedLevel, setSimulatedLevel] = useState(data.currentPercent)

    // Recalculate hours when level changes
    const calculatedScenarios = data.scenarios.map(scen => {
        const hoursRaw = simulatedLevel / scen.drainPerHour
        const hours = Math.floor(hoursRaw)
        const minutes = Math.floor((hoursRaw - hours) * 60)
        
        const shutdownTime = new Date()
        shutdownTime.setHours(shutdownTime.getHours() + hours)
        shutdownTime.setMinutes(shutdownTime.getMinutes() + minutes)
        
        return {
            ...scen,
            hoursRemaining: hours,
            minutesRemaining: minutes,
            shutdownTime: shutdownTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: hours >= 8 ? 'great' : hours >= 4 ? 'good' : hours >= 2 ? 'low' : 'critical'
        }
    })

    const getStatusColor = (status: string) => {
        if (status === 'great') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
        if (status === 'good') return 'text-cyan bg-cyan/10 border-cyan/20'
        if (status === 'low') return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20'
    }

    const getFillColor = (level: number) => {
        if (level > 40) return '#10b981' // emerald
        if (level > 15) return '#f59e0b' // amber
        return '#f43f5e' // rose
    }

    return (
        <motion.div className="rounded-[16px] bg-[linear-gradient(135deg,rgba(8,11,20,0.9)_0%,rgba(13,17,23,0.95)_100%)] border border-[rgba(0,255,255,0.2)] shadow-[0_4px_30px_rgba(0,0,0,0.5)] p-6 col-span-1 md:col-span-2 lg:col-span-3">
            <h2 className="text-[20px] font-orbitron font-bold text-white mb-6 flex items-center gap-3" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
                <Battery className="w-6 h-6 text-[#00FF7F]" style={{ filter: 'drop-shadow(0 0 8px #00FF7F)' }} />
                Battery Life Estimator
            </h2>

            {/* Top Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8 p-6 bg-[rgba(0,255,255,0.02)] rounded-[16px] border border-[rgba(0,255,255,0.1)]">
                <div className="flex items-center gap-6">
                    <div className="relative flex items-center justify-center w-24 h-24">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}>
                            <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                            <circle cx="48" cy="48" r="44" fill="none" stroke={getFillColor(simulatedLevel)} strokeWidth="8" strokeDasharray="276" strokeDashoffset={276 - (276 * simulatedLevel) / 100} strokeLinecap="round" className="transition-all duration-300" />
                        </svg>
                        <span className="text-[28px] font-orbitron font-black text-white drop-shadow-[0_0_10px_currentColor]" style={{ color: getFillColor(simulatedLevel) }}>
                            {simulatedLevel}%
                        </span>
                    </div>
                    <div>
                        <p className="text-[13px] font-mono text-[#B0BEC5] flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-[#FFE000]" /> Drain Rate: <span className="text-white font-bold">{data.drainRate}% / hr (Current Usage)</span></p>
                        <p className="text-[13px] font-mono text-[#B0BEC5] flex items-center gap-2"><AlertCircle className="w-4 h-4 text-[#00FFFF]" /> Temp: <span className="text-white font-bold">{data.temperature}°C — Normal</span></p>
                    </div>
                </div>

                <div className="flex-1 w-full max-w-md">
                    <label className="text-[14px] font-sans font-bold text-[#00FFFF] mb-3 flex justify-between drop-shadow-[0_0_8px_#00FFFF]">
                        <span>Simulate battery level:</span>
                        <span className="text-[12px] text-white font-mono bg-[#080B14] px-2 py-0.5 rounded border border-[rgba(0,255,255,0.2)]">{simulatedLevel}%</span>
                    </label>
                    <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={simulatedLevel}
                        onChange={(e) => setSimulatedLevel(Number(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-border outline-none transition-all accent-cyan"
                        style={{
                            background: `linear-gradient(to right, ${getFillColor(simulatedLevel)} 0%, ${getFillColor(simulatedLevel)} ${simulatedLevel}%, #2A2A40 ${simulatedLevel}%, #2A2A40 100%)`
                        }}
                    />
                </div>
            </div>

            {/* Grid SCenarios */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {calculatedScenarios.map((scen, idx) => (
                    <div key={idx} className={`p-4 rounded-[12px] border flex flex-col items-center text-center transition-colors ${getStatusColor(scen.status)} bg-opacity-10 backdrop-blur-sm`}>
                        <div className="text-[28px] mb-3 drop-shadow-[0_0_10px_currentColor]">{scen.icon}</div>
                        <h4 className="text-[13px] font-sans font-bold mb-3 border-b border-current/20 pb-2 w-full truncate text-white">{scen.label}</h4>
                        <div className="text-[24px] font-orbitron font-bold mb-2 tracking-tight text-white" style={{ textShadow: '0 0 10px currentColor' }}>
                            {scen.hoursRemaining}h {scen.minutesRemaining}m
                        </div>
                        <p className="text-[10px] font-mono text-[#B0BEC5] uppercase font-bold tracking-[2px] opacity-80 mb-3 truncate">
                            Off at {scen.shutdownTime}
                        </p>
                        <div className="w-full h-1.5 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                            <div className="h-full bg-current rounded-full shadow-[0_0_8px_currentColor]" style={{ width: `${Math.min(100, scen.hoursRemaining * 10)}%` }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Table for Desktop, Cards for Mobile */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-surface-light/50 text-xs uppercase text-text-muted font-ui">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Usage Type</th>
                            <th className="px-4 py-3 font-semibold">Drain/Hr</th>
                            <th className="px-4 py-3 font-semibold">Duration</th>
                            <th className="px-4 py-3 font-semibold">Shuts Off At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-[#060608]/50">
                        {calculatedScenarios.map((scen, idx) => (
                            <tr key={idx} className="hover:bg-surface-light/30 transition-colors">
                                <td className="px-4 py-3 font-medium text-text-primary flex items-center gap-2"><span className="text-lg">{scen.icon}</span> {scen.label}</td>
                                <td className="px-4 py-3 text-text-secondary font-mono bg-surface-light/20">{scen.drainPerHour}%/hr</td>
                                <td className="px-4 py-3 font-medium text-text-primary">{scen.hoursRemaining}h {scen.minutesRemaining}m</td>
                                <td className="px-4 py-3 text-text-muted">{scen.shutdownTime} <span className="text-[10px] bg-cyan/10 text-cyan px-1.5 py-0.5 rounded ml-1">{scen.shutdownDate}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tips Section */}
            {data.drainRate > 15 ? (
                <div className="mt-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-rose-500 mb-1">🔴 High drain detected!</h4>
                        <p className="text-sm text-text-secondary">Close Instagram and TikTok to extend battery by 3-4 hours.</p>
                    </div>
                </div>
            ) : simulatedLevel < 20 && (
                <div className="mt-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-500 mb-1">⚡ Low battery warning!</h4>
                        <p className="text-sm text-text-secondary">Enable Battery Saver mode immediately. Limited time remaining.</p>
                    </div>
                </div>
            )}
        </motion.div>
    )
}
