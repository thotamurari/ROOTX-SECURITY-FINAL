import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, ShieldCheck, AlertTriangle,
    ShieldAlert, Info, Trash2, Activity,
    ChevronDown, Eye, EyeOff, Smartphone, RefreshCw
} from 'lucide-react'
import type { InstalledApp } from '@/types/api'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { isNativePlatform } from '@/services/nativeDevice'
import { analyzeAllApps, type FakeAppResult } from '../utils/fakeAppDetector'
import type { NativeInstalledApp } from '@/services/nativeDevice'

interface Props {
    apps: InstalledApp[]
    onRefresh?: () => void
    isRefreshing?: boolean
}

const getBadgeColor = (status: string) => {
    switch (status) {
        case 'safe': return 'bg-success-soft text-success border-success/20'
        case 'caution': return 'bg-warning-soft text-warning border-warning/20'
        case 'risky': return 'bg-danger-soft text-danger border-danger/20'
        default: return 'bg-surface-2 text-text-tertiary border-border'
    }
}

const getIcon = (status: string) => {
    switch (status) {
        case 'safe': return <ShieldCheck className="w-4 h-4 text-success" />
        case 'caution': return <AlertTriangle className="w-4 h-4 text-warning" />
        case 'risky': return <ShieldAlert className="w-4 h-4 text-danger" />
        default: return <Info className="w-4 h-4 text-text-tertiary" />
    }
}

const formatSize = (mb: number) => {
    if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`
    return `${mb} MB`
}

const getThreatType = (app: InstalledApp): string => {
    // Use the first signal as the primary threat type when available
    if (app.signals && app.signals.length > 0) {
        return app.signals[0]!
    }
    return 'Security Concern'
}

const getRecommendedAction = (app: InstalledApp): { action: string; color: string } => {
    if (app.safetyStatus === 'risky') {
        return { action: 'Review permissions & consider removal', color: 'text-danger' }
    }
    if (app.safetyStatus === 'caution') {
        return { action: 'Review and restrict permissions', color: 'text-warning' }
    }
    return { action: 'No action required', color: 'text-success' }
}

export function InstalledAppsPanel({ apps, onRefresh, isRefreshing }: Props) {
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState<'all' | 'unwanted' | 'safe' | 'system'>('all')
    const [expandedApp, setExpandedApp] = useState<string | null>(null)
    const isNative = isNativePlatform()

    // Fake / Clone app trust analysis
    const trustResults = useMemo(() => {
        // Cast InstalledApp[] → NativeInstalledApp-like objects for the detector
        const nativeApps = apps.map(app => ({
            id: app.id,
            name: app.name,
            packageName: app.packageName || '',
            version: app.version || '',
            versionCode: 0,
            isSystemApp: app.isSystemApp || false,
            isDebuggable: false,
            allowBackup: false,
            targetSdkVersion: 0,
            minSdkVersion: 0,
            firstInstallTime: 0,
            lastUpdateTime: 0,
            apkSize: app.apkSize || 0,
            permissions: [],
            permissionsCount: app.permissions || 0,
            dangerousPermissions: [],
            dangerousPermissionsCount: app.dangerousPermissions || 0,
            installer: app.installSource || '',
            isNative: true,
            installerPackageName: app.installSource === 'play_store' ? 'com.android.vending' : app.installSource === 'preinstalled' ? 'system' : undefined,
        } as NativeInstalledApp))
        return analyzeAllApps(nativeApps)
    }, [apps])

    // Separate harmful, safe user, and system apps
    const harmfulApps = useMemo(() => {
        return apps
            .filter(app => (app.safetyStatus === 'risky' || app.safetyStatus === 'caution') && !app.isSystemApp)
            .filter(app => app.name.toLowerCase().includes(search.toLowerCase()) || app.packageName.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => {
                const map: Record<string, number> = { risky: 3, caution: 2, safe: 1 }
                const scoreA = map[a.safetyStatus] || 0
                const scoreB = map[b.safetyStatus] || 0
                if (scoreB !== scoreA) return scoreB - scoreA
                return b.dangerousPermissions - a.dangerousPermissions
            })
    }, [apps, search])

    const safeUserApps = useMemo(() => {
        return apps
            .filter(app => app.safetyStatus === 'safe' && !app.isSystemApp)
            .filter(app => app.name.toLowerCase().includes(search.toLowerCase()) || app.packageName.toLowerCase().includes(search.toLowerCase()))
    }, [apps, search])

    const systemApps = useMemo(() => {
        return apps
            .filter(app => app.isSystemApp)
            .filter(app => app.name.toLowerCase().includes(search.toLowerCase()) || app.packageName.toLowerCase().includes(search.toLowerCase()))
    }, [apps, search])

    const allFilteredApps = useMemo(() => {
        return apps
            .filter(app => app.name.toLowerCase().includes(search.toLowerCase()) || app.packageName.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => {
                const map: Record<string, number> = { risky: 3, caution: 2, safe: 1 }
                const scoreA = map[a.safetyStatus] || 0
                const scoreB = map[b.safetyStatus] || 0
                if (scoreB !== scoreA) return scoreB - scoreA
                return a.name.localeCompare(b.name)
            })
    }, [apps, search])

    const riskyCount = apps.filter(a => a.safetyStatus === 'risky' && !a.isSystemApp).length
    const cautionCount = apps.filter(a => a.safetyStatus === 'caution' && !a.isSystemApp).length
    const safeCount = apps.filter(a => a.safetyStatus === 'safe' && !a.isSystemApp).length
    const systemCount = apps.filter(a => a.isSystemApp).length

    const summary = [
        { key: 'total', value: apps.length, label: 'All apps', soft: 'bg-accent-soft', text: 'text-accent' },
        { key: 'risky', value: riskyCount + cautionCount, label: 'Unwanted / Caution', soft: 'bg-warning-soft', text: 'text-warning' },
        { key: 'safe', value: safeCount, label: 'Verified safe', soft: 'bg-success-soft', text: 'text-success' },
    ]

    return (
        <Card padding="none" className="overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between gap-3 mb-4 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center shrink-0" aria-hidden="true">
                            <Smartphone className="w-5 h-5 text-accent" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-[15px] font-semibold text-text-primary tracking-tight truncate">
                                Real Installed Applications
                            </h2>
                            <p className="text-[12px] text-text-secondary mt-0.5 truncate">
                                {isNative ? `Live inspection via Android PackageManager (${apps.length} packages)` : 'Native Android package audit'}
                            </p>
                        </div>
                    </div>
                    {onRefresh && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
                        >
                            Refresh
                        </Button>
                    )}
                </div>

                {/* Alert Summary */}
                <ul className="grid grid-cols-3 gap-3">
                    {summary.map(({ key, value, label, soft, text }) => (
                        <li key={key} className={`${soft} border border-border rounded-xl p-3 text-center`}>
                            <p className={`text-[20px] font-bold tabular-nums leading-none ${text}`}>{value}</p>
                            <p className="text-[10px] text-text-tertiary uppercase tracking-wide mt-1.5 leading-tight">
                                {label}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Filter Tabs & Search */}
            {apps.length > 0 && (
                <div className="p-4 border-b border-border space-y-3 bg-surface-1/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-surface-2 p-1 rounded-xl border border-border">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'all' ? 'bg-surface-1 text-text-primary shadow-xs border border-border' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            <span>Check All Apps</span>
                            <span className="text-[10px] bg-surface-3 px-1.5 py-0.2 rounded-full tabular-nums">{apps.length}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('unwanted')}
                            className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'unwanted' ? 'bg-warning-soft text-warning border border-warning/30 shadow-xs' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            <span>Unwanted ({riskyCount + cautionCount})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('safe')}
                            className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'safe' ? 'bg-success-soft text-success border border-success/30 shadow-xs' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            <span>Verified Safe ({safeCount})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('system')}
                            className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'system' ? 'bg-surface-1 text-accent border border-border shadow-xs' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            <span>System ({systemCount})</span>
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Search installed apps by name or package..."
                            aria-label="Search installed apps"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>
                </div>
            )}

            {/* Empty state / Browser state */}
            {apps.length === 0 && (
                <div className="text-center py-12 px-4">
                    <span className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                        <Smartphone className="w-7 h-7 text-accent" />
                    </span>
                    <h3 className="text-[15px] font-semibold text-text-primary mb-1">
                        {isNative ? 'Ready to inspect device' : 'Native Android inspection'}
                    </h3>
                    <p className="text-[13px] text-text-secondary max-w-sm mx-auto mb-4 leading-relaxed">
                        {isNative
                            ? 'Querying Android PackageManager for installed packages. Tap refresh to reload.'
                            : 'Reading all installed packages requires running inside the RootX Android APK on your mobile device.'}
                    </p>
                    {onRefresh && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                        >
                            Scan Installed Apps
                        </Button>
                    )}
                </div>
            )}

            {/* App List by Active Tab */}
            {apps.length > 0 && (
                <div className="p-4 space-y-3">
                    {/* ─── TAB 1: ALL APPS ─── */}
                    {activeTab === 'all' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1 py-1">
                                <span className="text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider">
                                    All Installed Packages ({allFilteredApps.length})
                                </span>
                            </div>
                            {allFilteredApps.length === 0 ? (
                                <p className="text-center py-8 text-[13px] text-text-tertiary">No apps match "{search}"</p>
                            ) : (
                                <ul className="space-y-2">
                                    {allFilteredApps.map((app) => {
                                        const isExpanded = expandedApp === app.id
                                        const isCritical = app.safetyStatus === 'risky'
                                        const isCaution = app.safetyStatus === 'caution'

                                        return (
                                            <li
                                                key={app.id}
                                                className={`rounded-2xl border overflow-hidden transition-colors ${
                                                    isCritical
                                                        ? 'bg-danger-soft border-danger/20'
                                                        : isCaution
                                                        ? 'bg-warning-soft border-warning/20'
                                                        : 'bg-surface-2 border-border'
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                                                    aria-expanded={isExpanded}
                                                    className="w-full p-4 flex items-center gap-3 sm:gap-4 text-left cursor-pointer hover:bg-surface-2/60 transition-colors"
                                                >
                                                    <span
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                                            isCritical
                                                                ? 'bg-danger-soft border-danger/20 text-danger'
                                                                : isCaution
                                                                ? 'bg-warning-soft border-warning/20 text-warning'
                                                                : app.isSystemApp
                                                                ? 'bg-accent-soft border-accent/20 text-accent'
                                                                : 'bg-success-soft border-success/20 text-success'
                                                        }`}
                                                    >
                                                        {isCritical ? <ShieldAlert className="w-5 h-5" /> : isCaution ? <AlertTriangle className="w-5 h-5" /> : app.isSystemApp ? <Smartphone className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                                    </span>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                            <span className="text-[13.5px] font-semibold text-text-primary truncate">{app.name}</span>
                                                            <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-[0.08em] ${getBadgeColor(app.safetyStatus)}`}>
                                                                {app.safetyStatus === 'risky' ? 'High risk' : app.safetyStatus === 'caution' ? 'Caution' : 'Verified Safe'}
                                                            </span>
                                                            {app.isSystemApp && (
                                                                <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-[0.08em] bg-accent-soft text-accent border-accent/20">
                                                                    System
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11.5px] text-text-tertiary truncate font-mono">
                                                            {app.packageName} · {app.dangerousPermissions} sensitive perms
                                                        </p>
                                                    </div>

                                                    <ChevronDown className={`w-4 h-4 text-text-tertiary shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isExpanded && (
                                                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-4 bg-surface-1/40">
                                                        <div className={`p-3 rounded-xl border ${getBadgeColor(app.safetyStatus)}`}>
                                                            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-80">Security verdict</p>
                                                            <p className="text-[12.5px] text-text-primary leading-relaxed">{app.safetyReason}</p>
                                                            {app.signals && app.signals.length > 0 && (
                                                                <ul className="mt-2 flex flex-wrap gap-1.5">
                                                                    {app.signals.map((s) => (
                                                                        <li key={s} className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface-1 border border-border text-text-secondary">
                                                                            {s}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-[12px]">
                                                            <div className="bg-surface-2 p-2.5 rounded-lg border border-border">
                                                                <span className="text-[10px] text-text-tertiary uppercase block">Package</span>
                                                                <span className="font-mono text-text-primary truncate block">{app.packageName}</span>
                                                            </div>
                                                            <div className="bg-surface-2 p-2.5 rounded-lg border border-border">
                                                                <span className="text-[10px] text-text-tertiary uppercase block">Permissions</span>
                                                                <span className="text-text-primary font-medium">{app.dangerousPermissions} dangerous / {app.permissions} total</span>
                                                            </div>
                                                        </div>

                                                        {/* Trust Signals from Fake App Detector */}
                                                        {(() => {
                                                            const trust = trustResults.get(app.packageName || app.id)
                                                            if (!trust) return null
                                                            return (
                                                                <div className={`p-3 rounded-xl border ${
                                                                    trust.verdict === 'verified_safe' ? 'bg-success-soft/40 border-success/20'
                                                                        : trust.verdict === 'high_risk' ? 'bg-danger-soft/40 border-danger/20'
                                                                            : 'bg-warning-soft/40 border-warning/20'
                                                                }`}>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                                            trust.verdict === 'verified_safe' ? 'text-success'
                                                                                : trust.verdict === 'high_risk' ? 'text-danger'
                                                                                    : 'text-warning'
                                                                        }`}>
                                                                            {trust.verdict === 'verified_safe' ? '✅ Verified Authentic'
                                                                                : trust.verdict === 'high_risk' ? '🚫 Fake/Clone Risk'
                                                                                    : '⚠️ Unverified'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[12px] text-text-secondary mb-2">{trust.label}</p>
                                                                    <ul className="space-y-1">
                                                                        {trust.signals.map((sig, si) => (
                                                                            <li key={si} className="text-[11px] text-text-secondary flex items-start gap-1.5">
                                                                                <span className="shrink-0 mt-0.5">•</span>
                                                                                <span>{sig}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* ─── TAB 2: UNWANTED / CAUTION APPS ─── */}
                    {activeTab === 'unwanted' && (
                        <div className="space-y-2">
                            {harmfulApps.length === 0 ? (
                                <div className="text-center py-10 px-4 bg-surface-2 rounded-xl border border-border">
                                    <span className="w-12 h-12 rounded-2xl bg-success-soft flex items-center justify-center mx-auto mb-3" aria-hidden="true">
                                        <ShieldCheck className="w-6 h-6 text-success" />
                                    </span>
                                    <h3 className="text-[14px] font-semibold text-text-primary mb-1">Zero Unwanted Apps Flagged</h3>
                                    <p className="text-[12.5px] text-text-secondary max-w-sm mx-auto">
                                        All installed applications on this device are verified safe and conform to standard permissions.
                                    </p>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {harmfulApps.map((app) => {
                                        const isExpanded = expandedApp === app.id
                                        const isCritical = app.safetyStatus === 'risky'

                                        return (
                                            <li
                                                key={app.id}
                                                className={`rounded-2xl border overflow-hidden ${
                                                    isCritical ? 'bg-danger-soft border-danger/20' : 'bg-warning-soft border-warning/20'
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                                                    className="w-full p-4 flex items-center gap-3 sm:gap-4 text-left cursor-pointer hover:bg-surface-2/40 transition-colors"
                                                >
                                                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isCritical ? 'bg-danger-soft text-danger border-danger/30' : 'bg-warning-soft text-warning border-warning/30'}`}>
                                                        {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-[13.5px] font-semibold text-text-primary truncate">{app.name}</span>
                                                            <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded border uppercase ${getBadgeColor(app.safetyStatus)}`}>
                                                                {isCritical ? 'High risk' : 'Caution'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11.5px] text-text-tertiary truncate font-mono">{app.packageName}</p>
                                                    </div>
                                                    <ChevronDown className={`w-4 h-4 text-text-tertiary shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-4 bg-surface-1/40">
                                                        <div className={`p-3 rounded-xl border ${getBadgeColor(app.safetyStatus)}`}>
                                                            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-80">Security verdict</p>
                                                            <p className="text-[12.5px] text-text-primary leading-relaxed">{app.safetyReason}</p>
                                                            {app.signals && app.signals.length > 0 && (
                                                                <ul className="mt-2 flex flex-wrap gap-1.5">
                                                                    {app.signals.map((s) => (
                                                                        <li key={s} className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface-1 border border-border text-text-secondary">
                                                                            {s}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-[12px]">
                                                            <div className="bg-surface-2 p-2.5 rounded-lg border border-border">
                                                                <span className="text-[10px] text-text-tertiary uppercase block">Package</span>
                                                                <span className="font-mono text-text-primary truncate block">{app.packageName}</span>
                                                            </div>
                                                            <div className="bg-surface-2 p-2.5 rounded-lg border border-border">
                                                                <span className="text-[10px] text-text-tertiary uppercase block">Permissions</span>
                                                                <span className="text-text-primary font-medium">{app.dangerousPermissions} dangerous / {app.permissions} total</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* ─── TAB 3: VERIFIED SAFE APPS ─── */}
                    {activeTab === 'safe' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1 py-1">
                                <span className="text-[11.5px] font-semibold text-success uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Safe User Apps ({safeUserApps.length})
                                </span>
                            </div>
                            <ul className="space-y-2">
                                {safeUserApps.map((app) => (
                                    <li
                                        key={app.id}
                                        className="p-3.5 rounded-xl bg-surface-2 border border-border flex items-center gap-3"
                                    >
                                        <span className="w-9 h-9 rounded-xl bg-success-soft text-success flex items-center justify-center shrink-0 border border-success/20">
                                            <ShieldCheck className="w-4 h-4" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[13px] font-semibold text-text-primary truncate">{app.name}</p>
                                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-success-soft text-success border border-success/20 uppercase">
                                                    Verified Safe
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-text-tertiary truncate font-mono mt-0.5">
                                                {app.packageName} · {app.category}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* ─── TAB 4: SYSTEM PACKAGES ─── */}
                    {activeTab === 'system' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1 py-1">
                                <span className="text-[11.5px] font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
                                    <Smartphone className="w-3.5 h-3.5" /> Preinstalled System Packages ({systemApps.length})
                                </span>
                            </div>
                            <ul className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                                {systemApps.map((app) => (
                                    <li
                                        key={app.id}
                                        className="p-3 rounded-xl bg-surface-2/70 border border-border flex items-center gap-3"
                                    >
                                        <span className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
                                            <Smartphone className="w-4 h-4" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[12.5px] font-medium text-text-primary truncate">{app.name}</p>
                                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-accent-soft text-accent uppercase">
                                                    System
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-text-tertiary truncate font-mono mt-0.5">
                                                {app.packageName}
                                            </p>
                                        </div>
                                        <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </Card>
    )
}
