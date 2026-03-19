import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Smartphone,
    Battery,
    Cpu,
    HardDrive,
    ShieldAlert,
    ShieldCheck,
    Activity,
    AlertTriangle,
    Zap,
    Info,
    RefreshCw,
    SmartphoneCharging
} from 'lucide-react'
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts'

import { BatteryLifeEstimator } from '@/features/android-sec/components/BatteryLifeEstimator'
import { InstalledAppsPanel } from '@/features/android-sec/components/InstalledAppsPanel'
import { fetchInstalledApps, fetchBatteryEstimator } from '@/features/android-sec/utils/mockData'
import type { InstalledApp, BatteryEstimator } from '@/types/api'

// --- Mock API Fetchers ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const fetchHealthScore = async () => {
    await delay(600)
    return { score: 92, status: 'Healthy' }
}

const fetchDeviceInfo = async () => {
    await delay(500)
    return {
        model: 'Samsung Galaxy S24 Ultra',
        os: 'Android 14 (One UI 6.1)',
        rooted: false,
        encryption: 'Enabled (AES-256)',
        uptime: '24d 14h 32m'
    }
}

const fetchBatteryData = async () => {
    await delay(700)
    return [
        { time: '00:00', level: 100 },
        { time: '04:00', level: 92 },
        { time: '08:00', level: 85 },
        { time: '12:00', level: 68 },
        { time: '16:00', level: 45 },
        { time: '20:00', level: 25 },
    ]
}

const fetchPerformanceData = async () => {
    await delay(800)
    return Array.from({ length: 20 }).map((_, i) => ({
        time: `${i}s`,
        cpu: 20 + Math.random() * 40,
        ram: 40 + Math.random() * 20,
    }))
}

const fetchStorageData = async () => {
    await delay(600)
    return [
        { name: 'System', value: 25, color: '#00FFFF' },
        { name: 'Apps', value: 45, color: '#FF00FF' },
        { name: 'Media', value: 120, color: '#00FF7F' },
        { name: 'Documents', value: 15, color: '#FFE000' },
        { name: 'Free', value: 307, color: 'rgba(255,255,255,0.1)' },
    ]
}

const fetchAppRisks = async () => {
    await delay(900)
    return [
        { name: 'Unknown Flashlight app', risk: 'High', reason: 'Camera & Contact permissions', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { name: 'Weather Widget', risk: 'Medium', reason: 'Background location tracking', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { name: 'WhatsApp', risk: 'Low', reason: 'Standard messaging permissions', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    ]
}

const fetchSuggestions = async () => {
    await delay(500)
    return [
        'Revoke Location access for "Weather Widget" when not in use.',
        'Uninstall "Unknown Flashlight app" - flagged by 14 community members.',
        'Enable Auto-Restart mode to refresh background memory.',
        'Your storage is 40% Media. Consider backing up photos to Cloud.',
    ]
}

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function AndroidSEC() {
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // State for all 7 queries
    const [health, setHealth] = useState<any>(null)
    const [deviceInfo, setDeviceInfo] = useState<any>(null)
    const [batteryData, setBatteryData] = useState<any[]>([])
    const [performanceData, setPerformanceData] = useState<any[]>([])
    const [storageData, setStorageData] = useState<any[]>([])
    const [appRisks, setAppRisks] = useState<any[]>([])
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [installedApps, setInstalledApps] = useState<InstalledApp[]>([])
    const [batteryEstimator, setBatteryEstimator] = useState<BatteryEstimator | null>(null)

    const loadData = async (silent = false) => {
        if (!silent) setIsLoading(true)
        setIsRefreshing(true)

        try {
            const [
                healthRes,
                deviceRes,
                batteryRes,
                perfRes,
                storageRes,
                appsRes,
                suggRes,
                installedRes,
                batteryEstRes
            ] = await Promise.all([
                fetchHealthScore(),
                fetchDeviceInfo(),
                fetchBatteryData(),
                fetchPerformanceData(),
                fetchStorageData(),
                fetchAppRisks(),
                fetchSuggestions(),
                fetchInstalledApps(),
                fetchBatteryEstimator()
            ])

            setHealth(healthRes)
            setDeviceInfo(deviceRes)
            setBatteryData(batteryRes)
            setPerformanceData(perfRes)
            setStorageData(storageRes)
            setAppRisks(appsRes)
            setSuggestions(suggRes)
            setInstalledApps(installedRes)
            setBatteryEstimator(batteryEstRes)
        } catch (error) {
            console.error('Failed to load AndroidSEC data', error)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    // Initial load and 60s silent auto-refresh
    useEffect(() => {
        loadData()
        const interval = setInterval(() => {
            loadData(true)
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    if (isLoading) {
        return (
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-light animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-6 w-48 bg-surface-light rounded animate-pulse" />
                        <div className="h-4 w-32 bg-surface-light rounded animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-64 bg-surface-light rounded-2xl animate-pulse" />
                    <div className="h-64 bg-surface-light rounded-2xl animate-pulse md:col-span-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-80 bg-surface-light rounded-2xl animate-pulse" />
                    <div className="h-80 bg-surface-light rounded-2xl animate-pulse" />
                </div>
                <div className="h-64 bg-surface-light rounded-2xl animate-pulse" />
            </div>
        )
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full min-h-screen">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-[12px] bg-[rgba(0,255,255,0.1)] flex items-center justify-center glow-cyan ring-1 ring-[rgba(0,255,255,0.3)]">
                                <Smartphone className="w-7 h-7 text-[#00FFFF]" style={{ filter: 'drop-shadow(0 0 10px #00FFFF)' }} />
                            </div>
                            <div>
                                <h1 className="text-[32px] font-orbitron font-extrabold text-[#FFFFFF]" style={{ textShadow: '0 0 30px rgba(0, 255, 255, 0.4)' }}>AndroidSEC Dashboard</h1>
                                <p className="text-[14px] font-mono text-[#B0BEC5]">Deep telemetry and hardware health monitoring</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] font-mono text-[#607D8B] bg-[#0A0F1E] py-2 px-4 rounded-[12px] border border-[rgba(0,255,255,0.1)]">
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#00FFFF]' : ''}`} />
                        <span>Auto-refreshes every 60s</span>
                    </div>
                </motion.div>

                {/* Top Row: Health Gauge & Device Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Health Score */}
                    <motion.div variants={itemVariants} className="rounded-[16px] bg-[linear-gradient(135deg,rgba(8,11,20,0.9)_0%,rgba(13,17,23,0.95)_100%)] border border-[rgba(0,255,255,0.2)] shadow-[0_4px_30px_rgba(0,0,0,0.5)] p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFFF] opacity-5 rounded-full blur-[40px] group-hover:opacity-10 transition-colors" />
                        <h2 className="text-[16px] font-sans font-bold text-white mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[#00FF7F]" style={{ filter: 'drop-shadow(0 0 8px #00FF7F)' }} />
                            System Health
                        </h2>
                        
                        <div className="flex flex-col items-center justify-center relative h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[{ value: health?.score || 0 }, { value: 100 - (health?.score || 0) }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        startAngle={225}
                                        endAngle={-45}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill="#00FF7F" style={{ filter: 'drop-shadow(0 0 15px #00FF7F)' }} />
                                        <Cell fill="#111827" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                                <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5, type: 'spring' }}
                                    className="text-[44px] font-orbitron font-black leading-none text-[#00FF7F]"
                                    style={{ textShadow: '0 0 20px #00FF7F' }}
                                >
                                    {health?.score}
                                </motion.span>
                                <span className="text-[12px] font-mono font-bold text-[#00FF7F] uppercase tracking-[3px] mt-1 drop-shadow-md">{health?.status}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Device Info */}
                    <motion.div variants={itemVariants} className="bg-surface border border-border rounded-2xl p-6 md:col-span-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
                        <h2 className="text-sm font-ui font-medium text-text-secondary mb-6 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Device Specifications
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { label: 'Model', value: deviceInfo?.model },
                                { label: 'OS Version', value: deviceInfo?.os },
                                { label: 'System Integrity', value: deviceInfo?.rooted ? 'Rooted / Unsafe' : 'Intact (Unrooted)', color: deviceInfo?.rooted ? 'text-rose-500' : 'text-emerald-500' },
                                { label: 'Encryption', value: deviceInfo?.encryption },
                                { label: 'Uptime', value: deviceInfo?.uptime },
                            ].map((spec, i) => (
                                <div key={i} className="bg-surface-light/50 border border-border/50 rounded-xl p-4">
                                    <p className="text-xs text-text-muted mb-1 font-body uppercase tracking-wider">{spec.label}</p>
                                    <p className={`text-sm font-medium ${spec.color || 'text-text-primary'}`}>{spec.value}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* New Row: Battery Estimator */}
                {batteryEstimator && (
                    <div className="grid grid-cols-1">
                        <BatteryLifeEstimator data={batteryEstimator} />
                    </div>
                )}

                {/* Middle Row: Performance & Battery Usage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Performance Lines */}
                    <motion.div variants={itemVariants} className="rounded-[16px] bg-[linear-gradient(135deg,rgba(8,11,20,0.9)_0%,rgba(13,17,23,0.95)_100%)] border border-[rgba(0,255,255,0.2)] shadow-[0_4px_30px_rgba(0,0,0,0.5)] p-6">
                        <h2 className="text-[16px] font-sans font-bold text-white mb-6 flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-[#00FFFF]" />
                            Live Performance
                        </h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" vertical={false} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#080B14', borderColor: '#1A2236', borderRadius: '12px', color: '#FFF' }}
                                        itemStyle={{ fontSize: '13px', fontFamily: 'IBM Plex Mono' }}
                                    />
                                    <Line type="monotone" dataKey="cpu" stroke="#00FFFF" strokeWidth={2} dot={false} name="CPU %" style={{ filter: 'drop-shadow(0 0 8px #00FFFF)' }} />
                                    <Line type="monotone" dataKey="ram" stroke="#FF00FF" strokeWidth={2} dot={false} name="RAM %" style={{ filter: 'drop-shadow(0 0 8px #FF00FF)' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex gap-6 mt-4 justify-center">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#00FFFF]" style={{ boxShadow: '0 0 8px #00FFFF' }} /><span className="text-[12px] font-mono text-white">CPU Usage</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FF00FF]" style={{ boxShadow: '0 0 8px #FF00FF' }} /><span className="text-[12px] font-mono text-white">RAM Usage</span></div>
                        </div>
                    </motion.div>

                    {/* Battery Area Chart */}
                    <motion.div variants={itemVariants} className="bg-surface border border-border rounded-2xl p-6">
                        <h2 className="text-sm font-ui font-medium text-text-secondary mb-6 flex items-center gap-2">
                            <Battery className="w-4 h-4 text-emerald-500" />
                            Battery Drain Analysis
                        </h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={batteryData}>
                                    <defs>
                                        <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A40" vertical={false} />
                                    <XAxis dataKey="time" stroke="#60607e" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#13131F', borderColor: '#2A2A40', borderRadius: '8px' }}
                                    />
                                    <Area type="monotone" dataKey="level" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBattery)" name="Level %" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Row: Storage, Apps, Suggestions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Storage Treemap Alternative (Progress Bar Stack) */}
                    <motion.div variants={itemVariants} className="bg-surface border border-border rounded-2xl p-6">
                        <h2 className="text-sm font-ui font-medium text-text-secondary mb-6 flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-indigo-400" />
                            Storage Allocation
                        </h2>
                        <div className="space-y-4">
                            {storageData.map((item, i) => {
                                const total = storageData.reduce((sum, d) => sum + d.value, 0)
                                const percentage = Math.round((item.value / total) * 100)
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-text-primary">{item.name}</span>
                                            <span className="text-text-muted">{item.value} GB ({percentage}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-surface-light rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* New Row: Installed Apps */}
                <div className="grid grid-cols-1 gap-6">
                    <InstalledAppsPanel apps={installedApps} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* App Privacy Risks */}
                    <motion.div variants={itemVariants} className="bg-surface border border-border rounded-2xl p-6">
                        <h2 className="text-sm font-ui font-medium text-text-secondary mb-6 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-500" />
                            App Privacy Risks
                        </h2>
                        <div className="space-y-3">
                            {appRisks.map((app, i) => (
                                <div key={i} className="flex gap-4 p-3 rounded-xl border border-border/50 bg-surface-light/30">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${app.bg} ${app.color}`}>
                                        <app.icon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary truncate">{app.name}</p>
                                        <p className="text-xs text-text-muted truncate mt-0.5">{app.reason}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Smart Suggestions */}
                    <motion.div variants={itemVariants} className="rounded-[16px] bg-[linear-gradient(135deg,rgba(8,11,20,0.9)_0%,rgba(13,17,23,0.95)_100%)] border border-[rgba(0,255,255,0.2)] shadow-[0_4px_30px_rgba(0,0,0,0.5)] p-6 flex flex-col">
                        <h2 className="text-[16px] font-sans font-bold text-white mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-[#FFE000]" style={{ filter: 'drop-shadow(0 0 8px #FFE000)' }} />
                            Smart Suggestions
                        </h2>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 
                                        [&::-webkit-scrollbar]:w-1.5 
                                        [&::-webkit-scrollbar-thumb]:bg-[rgba(0,255,255,0.2)] 
                                        [&::-webkit-scrollbar-thumb]:rounded-full">
                            {suggestions.map((sugg, i) => (
                                <div key={i} className="p-4 bg-[rgba(0,255,255,0.05)] border border-[rgba(0,255,255,0.15)] rounded-[12px] text-[13px] text-white font-mono leading-relaxed relative pl-10 shadow-[inset_0_0_15px_rgba(0,255,255,0.02)]">
                                    <div className="absolute left-4 top-[18px] w-2 h-2 rounded-full bg-[#00FFFF]" style={{ boxShadow: '0 0 10px #00FFFF, 0 0 20px rgba(0,255,255,0.5)' }} />
                                    {sugg}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}
