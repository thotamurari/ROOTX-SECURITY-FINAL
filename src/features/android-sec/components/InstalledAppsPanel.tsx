import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Search, Filter, LayoutGrid, List as ListIcon, 
    ChevronDown, ChevronRight, ShieldCheck, AlertTriangle, 
    ShieldAlert, Info, Trash2, Shield, Box, Activity, ChevronUp 
} from 'lucide-react'
import type { InstalledApp } from '@/types/api'

interface Props {
    apps: InstalledApp[]
}

const getBadgeColor = (status: string) => {
    switch(status) {
        case 'safe': return 'bg-[rgba(0,255,127,0.1)] text-[#00FF7F] border-[rgba(0,255,127,0.2)]'
        case 'caution': return 'bg-[rgba(255,224,0,0.1)] text-[#FFE000] border-[rgba(255,224,0,0.2)]'
        case 'risky': return 'bg-[rgba(255,23,68,0.1)] text-[#FF1744] border-[rgba(255,23,68,0.2)]'
        default: return 'bg-[rgba(0,255,255,0.05)] text-[#B0BEC5] border-[rgba(0,255,255,0.1)]'
    }
}

const getIcon = (status: string) => {
    switch(status) {
        case 'safe': return <ShieldCheck className="w-4 h-4 text-[#00FF7F]" />
        case 'caution': return <AlertTriangle className="w-4 h-4 text-[#FFE000]" />
        case 'risky': return <ShieldAlert className="w-4 h-4 text-[#FF1744]" />
        default: return <Info className="w-4 h-4 text-[#B0BEC5]" />
    }
}

// Format MB to GB if needed
const formatSize = (mb: number) => {
    if (mb >= 1000) return `${(mb / 1000).toFixed(2)} GB`
    return `${mb} MB`
}

export function InstalledAppsPanel({ apps }: Props) {
    const [view, setView] = useState<'list' | 'grid'>('list')
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('All')
    const [sort, setSort] = useState<'storage' | 'lastUsed' | 'risk' | 'name'>('storage')
    const [expandedApp, setExpandedApp] = useState<string | null>(null)

    const filteredApps = useMemo(() => {
        let result = apps.filter(app => app.name.toLowerCase().includes(search.toLowerCase()))
        
        if (filter !== 'All') {
            result = result.filter(app => 
                filter === 'Safe' ? app.safetyStatus === 'safe' :
                filter === 'Caution' ? app.safetyStatus === 'caution' :
                filter === 'Risky' ? app.safetyStatus === 'risky' :
                filter === 'Unused' ? app.lastUsed.includes('days') && parseInt(app.lastUsed) > 10 : true
            )
        }

        result.sort((a, b) => {
            if (sort === 'storage') return b.storageUsed - a.storageUsed
            if (sort === 'name') return a.name.localeCompare(b.name)
            if (sort === 'risk') {
                const map = { risky: 3, caution: 2, safe: 1, unknown: 0 } as any
                return map[b.safetyStatus] - map[a.safetyStatus]
            }
            return 0 // basic sort for 'lastUsed'
        })

        return result
    }, [apps, search, filter, sort])

    const totalStorage = useMemo(() => apps.reduce((sum, app) => sum + app.storageUsed, 0), [apps])
    const safeCount = apps.filter(a => a.safetyStatus === 'safe').length
    const riskyCount = apps.filter(a => a.safetyStatus === 'risky').length
    
    const topApps = [...apps].sort((a,b) => b.storageUsed - a.storageUsed).slice(0, 5)

    return (
        <div className="rounded-[16px] bg-[linear-gradient(135deg,rgba(8,11,20,0.9)_0%,rgba(13,17,23,0.95)_100%)] border border-[rgba(0,255,255,0.2)] shadow-[0_4px_30px_rgba(0,0,0,0.5)] p-6 flex flex-col w-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
                <h2 className="text-[20px] font-orbitron font-bold text-white flex items-center gap-3" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
                    <Box className="w-6 h-6 text-[#00FFFF]" style={{ filter: 'drop-shadow(0 0 8px #00FFFF)' }} />
                    Installed Apps ({apps.length})
                </h2>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-48">
                        <Search className="w-4 h-4 text-[#00FFFF] md:ml-3 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Search apps..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-[#080B14] border border-[rgba(0,255,255,0.2)] rounded-[12px] pl-10 pr-4 py-2 text-[13px] font-mono text-white w-full outline-none focus:border-[#00FFFF] focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] placeholder:text-[#607D8B]"
                        />
                    </div>
                    <select 
                        className="bg-[#0A0F1E] border border-[rgba(0,255,255,0.2)] rounded-[12px] px-3 py-2 text-[13px] font-mono text-[#00FFFF] outline-none"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        {['All', 'Safe', 'Caution', 'Risky', 'Unused'].map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sort & View toggles */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[rgba(0,255,255,0.1)] pb-4 mb-4 gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    {['storage', 'lastUsed', 'risk', 'name'].map(s => (
                        <button 
                            key={s}
                            onClick={() => setSort(s as any)}
                            className={`px-4 py-1.5 rounded-[8px] text-[12px] font-mono font-bold transition-all border ${sort === s ? 'bg-[rgba(0,255,255,0.1)] border-[#00FFFF] text-[#00FFFF]' : 'bg-[rgba(0,0,0,0.2)] border-transparent text-[#607D8B] hover:text-[#B0BEC5]'}`}
                        >
                            {s === 'storage' ? 'Storage ↓' : s === 'lastUsed' ? 'Last Used' : s === 'risk' ? 'Risk Level' : 'Name A-Z'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 p-1 bg-[rgba(0,0,0,0.2)] border border-[rgba(0,255,255,0.1)] rounded-[8px] shrink-0">
                    <button onClick={() => setView('grid')} className={`p-1.5 rounded-md ${view === 'grid' ? 'bg-[rgba(0,255,255,0.1)] text-[#00FFFF]' : 'text-[#607D8B] hover:text-[#B0BEC5]'}`}><LayoutGrid className="w-4 h-4" /></button>
                    <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-[rgba(0,255,255,0.1)] text-[#00FFFF]' : 'text-[#607D8B] hover:text-[#B0BEC5]'}`}><ListIcon className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[rgba(0,255,255,0.02)] border border-[rgba(0,255,255,0.1)] rounded-[16px] p-4 flex flex-col justify-center items-center">
                    <p className="text-[10px] text-[#B0BEC5] uppercase font-bold tracking-[2px] mb-1">Total Apps</p>
                    <p className="text-[24px] font-orbitron font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{apps.length}</p>
                </div>
                <div className="bg-[rgba(0,255,127,0.05)] border border-[rgba(0,255,127,0.1)] rounded-[16px] p-4 flex flex-col justify-center items-center">
                    <p className="text-[10px] text-[#00FF7F] uppercase font-bold tracking-[2px] mb-1">Safe Apps</p>
                    <p className="text-[24px] font-orbitron font-bold text-[#00FF7F] drop-shadow-[0_0_10px_#00FF7F]">{safeCount}</p>
                </div>
                <div className="bg-[rgba(255,23,68,0.05)] border border-[rgba(255,23,68,0.1)] rounded-[16px] p-4 flex flex-col justify-center items-center">
                    <p className="text-[10px] text-[#FF1744] uppercase font-bold tracking-[2px] mb-1">Risky Apps</p>
                    <p className="text-[24px] font-orbitron font-bold text-[#FF1744] drop-shadow-[0_0_10px_#FF1744]">{riskyCount}</p>
                </div>
                <div className="bg-[rgba(255,224,0,0.05)] border border-[rgba(255,224,0,0.1)] rounded-[16px] p-4 flex flex-col justify-center items-center">
                    <p className="text-[10px] text-[#FFE000] uppercase font-bold tracking-[2px] mb-1">Storage Used</p>
                    <p className="text-[20px] font-orbitron font-bold text-[#FFE000] drop-shadow-[0_0_10px_#FFE000]">{formatSize(totalStorage)}</p>
                </div>
            </div>

            {/* Main Content View */}
            <div className="min-h-[400px]">
                {view === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredApps.map(app => (
                            <div key={app.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col items-center text-center hover:bg-surface-light/30 transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-3">
                                    <Box className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h3 className="text-sm font-medium text-text-primary truncate w-full">{app.name}</h3>
                                <p className="text-xs text-text-muted mt-1">{formatSize(app.storageUsed)}</p>
                                <span className={`mt-2 px-2 py-0.5 rounded uppercase text-[10px] border font-bold ${getBadgeColor(app.safetyStatus)}`}>
                                    {app.safetyStatus}
                                </span>
                                <p className="text-[10px] text-text-secondary mt-2 truncate w-full">Last: {app.lastUsed}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredApps.map(app => {
                            const isExpanded = expandedApp === app.id
                            return (
                                <div key={app.id} className="bg-surface border border-border rounded-xl overflow-hidden transition-colors hover:border-border/80">
                                    <div 
                                        onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                                        className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-surface-light/20"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                                <Box className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-medium text-text-primary truncate">{app.name}</h3>
                                                    <span className="text-[10px] text-text-muted hidden sm:block border px-1.5 py-0.5 rounded border-border uppercase font-ui">{app.category}</span>
                                                </div>
                                                <p className="text-[11px] text-text-secondary truncate mt-0.5">v{app.version} · <span className="text-text-muted">Last used:</span> {app.lastUsed}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 sm:gap-6 shrink-0 ml-4">
                                            <div className="hidden md:flex flex-col text-right">
                                                <span className="text-xs font-mono text-text-secondary">{formatSize(app.storageUsed)}</span>
                                                <span className="text-[10px] text-text-muted">Permissions: {app.permissions}</span>
                                            </div>
                                            <span className={`hidden sm:inline-flex px-2 py-1 flex items-center gap-1.5 rounded text-[10px] border font-bold uppercase tracking-wider ${getBadgeColor(app.safetyStatus)}`}>
                                                {getIcon(app.safetyStatus)} {app.safetyStatus}
                                            </span>
                                            <div className="p-1 rounded bg-surface-light shrink-0">
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expaned Row Content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-border/50 bg-[#060608]/50 overflow-hidden"
                                            >
                                                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    
                                                    {/* Storage Breakdown */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-ui font-semibold text-text-secondary uppercase">Storage Breakdown</h4>
                                                        <div className="text-xs font-mono text-text-muted flex justify-between">
                                                            <span>APK: {app.apkSize}MB</span>
                                                            <span>Data: {app.dataSize}MB</span>
                                                            <span>Cache: {app.cacheSize}MB</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-surface-light rounded-full overflow-hidden flex">
                                                            <div style={{ width: `${(app.apkSize / app.storageUsed)*100}%`}} className="bg-indigo-500 h-full border-r border-[#060608]" />
                                                            <div style={{ width: `${(app.dataSize / app.storageUsed)*100}%`}} className="bg-cyan h-full border-r border-[#060608]" />
                                                            <div style={{ width: `${(app.cacheSize / app.storageUsed)*100}%`}} className="bg-amber-500 h-full" />
                                                        </div>
                                                        <p className="text-xs font-mono font-bold text-text-primary text-right">{formatSize(app.storageUsed)} Total</p>
                                                    </div>

                                                    {/* Safety Analysis */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-ui font-semibold text-text-secondary uppercase">Safety Analysis</h4>
                                                        <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${getBadgeColor(app.safetyStatus)}`}>
                                                            {getIcon(app.safetyStatus)}
                                                            <span className="font-medium">{app.safetyReason}</span>
                                                        </div>
                                                        <p className="text-[11px] text-text-secondary">Dangerous Permissions: <span className="font-mono text-rose-400">{app.dangerousPermissions}</span> / {app.permissions}</p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="space-y-2 flex flex-col justify-end">
                                                        <button className="w-full py-2 px-3 rounded-lg bg-surface border border-border text-xs font-medium text-text-primary hover:bg-surface-light transition-colors flex items-center justify-center gap-2">
                                                            <Activity className="w-4 h-4 text-cyan" /> Restrict Background Usage
                                                        </button>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button className="py-2 px-3 rounded-lg bg-surface border border-border text-xs font-medium text-text-primary hover:bg-surface-light transition-colors">
                                                                Clear Cache
                                                            </button>
                                                            <button className="py-2 px-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-500 hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2">
                                                                <Trash2 className="w-3.5 h-3.5" /> Uninstall
                                                            </button>
                                                        </div>
                                                    </div>

                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Storage Usage Bar Graphic */}
            <div className="mt-8 pt-6 border-t border-border/50">
                <h3 className="text-sm font-ui font-semibold text-text-secondary mb-4">Top 5 Storage Consumers</h3>
                <div className="space-y-3">
                    {topApps.map(app => (
                        <div key={app.id} className="flex items-center justify-between text-xs w-full group">
                            <div className="w-24 truncate font-medium text-text-primary group-hover:text-cyan transition-colors">{app.name}</div>
                            <div className="flex-1 mx-4 h-2 rounded-full bg-surface overflow-hidden relative border border-border/50">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${(app.storageUsed / (topApps[0]?.storageUsed || 1))*100}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="absolute left-0 top-0 h-full rounded-full"
                                    style={{
                                        background: `linear-gradient(to right, #4f46e5, #0ea5e9)`
                                    }}
                                />
                            </div>
                            <div className="w-16 text-right font-mono text-text-secondary">{formatSize(app.storageUsed)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
