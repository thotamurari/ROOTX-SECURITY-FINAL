import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Smartphone, Battery, BatteryCharging, Cpu, HardDrive, MemoryStick,
    Wifi, MonitorSmartphone, RefreshCw, Info, ShieldAlert, AlertTriangle, Shield,
    Lock, ShieldCheck, Terminal, Usb
} from 'lucide-react'

import { InstalledAppsPanel } from '@/features/android-sec/components/InstalledAppsPanel'
import { HardwareSecurityAuditor } from '@/features/android-sec/components/HardwareSecurityAuditor'
import { fetchInstalledApps } from '@/features/android-sec/utils/mockData'
import { getDeviceInfo, type DeviceInfo } from '@/features/android-sec/utils/deviceInfo'
import { getNativeDeviceSecurityInfo, isNativePlatform, onPackageEvent, type NativeDeviceSecurityInfo } from '@/services/nativeDevice'
import type { InstalledApp } from '@/types/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 26 } },
}

function StatTile({
    icon: Icon, label, value, sub, accent = 'text-accent', soft = 'bg-accent-soft',
}: {
    icon: typeof Cpu; label: string; value: string; sub?: string; accent?: string; soft?: string
}) {
    return (
        <motion.div variants={itemVariants}>
            <Card padding="sm" className="h-full">
                <div className="flex items-center gap-2.5 mb-2">
                    <span className={`w-8 h-8 rounded-lg ${soft} flex items-center justify-center shrink-0`} aria-hidden="true">
                        <Icon className={`w-4 h-4 ${accent}`} />
                    </span>
                    <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide truncate">{label}</span>
                </div>
                <p className="text-[17px] font-bold text-text-primary leading-tight truncate">{value}</p>
                {sub && <p className="text-[11.5px] text-text-secondary mt-0.5 truncate">{sub}</p>}
            </Card>
        </motion.div>
    )
}

export default function AndroidSEC() {
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [device, setDevice] = useState<DeviceInfo | null>(null)
    const [nativeInfo, setNativeInfo] = useState<NativeDeviceSecurityInfo | null>(null)
    const [installedApps, setInstalledApps] = useState<InstalledApp[]>([])
    const isNative = isNativePlatform()

    const load = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const [info, nInfo, apps] = await Promise.all([
                getDeviceInfo(),
                getNativeDeviceSecurityInfo(),
                fetchInstalledApps(),
            ])
            setDevice(info)
            setNativeInfo(nInfo)
            setInstalledApps(apps)
        } catch (err) {
            console.error('AndroidSEC load error:', err)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        load()
        const onChange = () => { load() }
        window.addEventListener('online', onChange)
        window.addEventListener('offline', onChange)
        const unregisterPackageListener = onPackageEvent(() => {
            load()
        })
        return () => {
            window.removeEventListener('online', onChange)
            window.removeEventListener('offline', onChange)
            if (unregisterPackageListener) unregisterPackageListener()
        }
    }, [load])

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center pb-24 lg:pb-8">
                <LoadingSpinner size="lg" text="Reading real device data..." />
            </div>
        )
    }

    const riskyApps = installedApps.filter(a => a.safetyStatus === 'risky')
    const cautionApps = installedApps.filter(a => a.safetyStatus === 'caution')
    const trustedApps = installedApps.filter(a => a.trustLevel === 'trusted' || a.safetyStatus === 'safe')

    // Real device model label
    const modelName = nativeInfo?.model
        ? `${nativeInfo.manufacturer || ''} ${nativeInfo.model}`.trim()
        : device?.model || (device?.isMobile ? 'Android Mobile Device' : 'Desktop Environment')

    const osLabel = nativeInfo?.osVersion
        ? `Android ${nativeInfo.osVersion} (SDK ${nativeInfo.sdkInt})`
        : `${device?.os ?? 'Android'}${device?.osVersion ? ' ' + device.osVersion : ''}`

    // Storage values (native vs browser)
    const storageUsedGB = nativeInfo?.storage?.usedGB ?? device?.storage?.usedGB ?? 0
    const storageTotalGB = nativeInfo?.storage?.totalGB ?? device?.storage?.quotaGB ?? 0
    const storagePercent = nativeInfo?.storage?.usedPercent ?? device?.storage?.usedPercent ?? 0

    // RAM values
    const ramTotal = nativeInfo?.ram?.totalGB ?? device?.ramGB ?? null
    const ramUsed = nativeInfo?.ram?.usedGB ?? null

    // Battery
    const batteryPct = nativeInfo?.battery?.level ?? device?.battery?.level ?? null
    const isCharging = nativeInfo?.battery?.charging ?? device?.battery?.charging ?? false

    return (
        <div className="pb-24 lg:pb-8 max-w-4xl mx-auto">
            <PageHeader
                title="Android-Sec"
                description="Real-time device security & hardware telemetry"
                icon={<Smartphone className="w-5 h-5" />}
                actions={
                    <Button
                        variant="secondary" size="icon" onClick={load} disabled={isRefreshing}
                        aria-label="Refresh device data" title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                }
            />

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5 sm:space-y-6">
                {/* ── Real device identity ── */}
                <motion.div variants={itemVariants}>
                    <Card padding="lg">
                        <div className="flex items-center gap-4">
                            <span className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center shrink-0" aria-hidden="true">
                                <Smartphone className="w-7 h-7 text-accent" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-[17px] sm:text-[19px] font-bold text-text-primary tracking-tight truncate">{modelName}</h2>
                                    {isNative && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-soft text-success border border-success/20">
                                            Native Bridge
                                        </span>
                                    )}
                                </div>
                                <p className="text-[13px] text-text-secondary truncate mt-0.5">
                                    {osLabel} {nativeInfo?.securityPatch ? ` · Patch: ${nativeInfo.securityPatch}` : ''}
                                </p>
                            </div>
                            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${device?.online ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${device?.online ? 'bg-success' : 'bg-danger'}`} />
                                {device?.online ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        {/* Security flags: Root, ADB */}
                        {nativeInfo && (
                            <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                    nativeInfo.isRooted
                                        ? 'bg-danger-soft text-danger border-danger/30'
                                        : 'bg-success-soft text-success border-success/20'
                                }`}>
                                    {nativeInfo.isRooted ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                    {nativeInfo.isRooted ? 'Root Access Detected' : 'Unrooted (Secure)'}
                                </span>

                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                    nativeInfo.isAdbEnabled
                                        ? 'bg-warning-soft text-warning border-warning/30'
                                        : 'bg-surface-2 text-text-secondary border-border'
                                }`}>
                                    <Terminal className="w-3.5 h-3.5" />
                                    {nativeInfo.isAdbEnabled ? 'USB Debugging Active' : 'USB Debugging Inactive'}
                                </span>

                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                    (nativeInfo.battery?.plugged || nativeInfo.isAdbEnabled)
                                        ? 'bg-accent-soft text-accent border-accent/30'
                                        : 'bg-surface-2 text-text-secondary border-border'
                                }`}>
                                    <Usb className="w-3.5 h-3.5" />
                                    {(nativeInfo.battery?.plugged || nativeInfo.isAdbEnabled) ? 'USB Interface Connected' : 'USB Disconnected'}
                                </span>

                                {nativeInfo.securityPatch && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-surface-2 text-text-secondary border border-border">
                                        <Lock className="w-3.5 h-3.5 text-accent" />
                                        Security Patch: {nativeInfo.securityPatch}
                                    </span>
                                )}
                            </div>
                        )}
                    </Card>
                </motion.div>

                {/* ── Real, live device metrics ── */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <StatTile
                        icon={isCharging ? BatteryCharging : Battery}
                        label="Battery"
                        value={batteryPct != null ? `${batteryPct}%` : 'N/A'}
                        sub={batteryPct != null ? (isCharging ? 'Charging' : (nativeInfo?.battery?.health ? `Health: ${nativeInfo.battery.health}` : 'On battery')) : 'Not available'}
                        accent={batteryPct != null && batteryPct <= 20 && !isCharging ? 'text-danger' : 'text-success'}
                        soft={batteryPct != null && batteryPct <= 20 && !isCharging ? 'bg-danger-soft' : 'bg-success-soft'}
                    />
                    <StatTile
                        icon={HardDrive} label="Storage"
                        value={storageTotalGB > 0 ? `${storagePercent}%` : 'N/A'}
                        sub={storageTotalGB > 0 ? `${storageUsedGB} / ${storageTotalGB} GB` : 'Not available'}
                        accent="text-info" soft="bg-info-soft"
                    />
                    <StatTile
                        icon={MemoryStick} label="RAM"
                        value={ramTotal != null ? `${ramTotal} GB` : 'N/A'}
                        sub={ramUsed != null ? `${ramUsed} GB used` : (isNative ? 'System memory' : 'Browser memory')}
                    />
                    <StatTile
                        icon={Cpu} label="CPU"
                        value={nativeInfo?.cpuCores ? `${nativeInfo.cpuCores} cores` : (device?.cpuCores ? `${device.cpuCores} cores` : 'N/A')}
                        sub="Hardware processors"
                    />
                    <StatTile
                        icon={Wifi} label="Network"
                        value={device?.network?.effectiveType?.toUpperCase() || device?.network?.type || (device?.online ? 'Online' : 'Offline')}
                        sub={device?.network?.downlinkMbps ? `~${device.network.downlinkMbps} Mbps` : 'Connection type'}
                        accent="text-accent" soft="bg-accent-soft"
                    />
                    <StatTile
                        icon={MonitorSmartphone} label="Display"
                        value={`${device?.screen.width}×${device?.screen.height}`}
                        sub={`${device?.screen.dpr}x density`}
                    />
                </div>

                {/* Real storage bar */}
                {storageTotalGB > 0 && (
                    <motion.div variants={itemVariants}>
                        <Card padding="md">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[12.5px] font-semibold text-text-primary">
                                    {isNative ? 'Internal Device Storage' : 'Storage Quota'}
                                </span>
                                <span className="text-[12px] text-text-secondary tabular-nums">
                                    {storageUsedGB} GB used of {storageTotalGB} GB ({storagePercent}%)
                                </span>
                            </div>
                            <div className="h-2.5 rounded-full bg-surface-3 overflow-hidden" role="progressbar" aria-valuenow={storagePercent} aria-valuemin={0} aria-valuemax={100}>
                                <motion.div
                                    className={`h-full rounded-full ${storagePercent >= 90 ? 'bg-danger' : storagePercent >= 75 ? 'bg-warning' : 'bg-accent'}`}
                                    initial={{ width: 0 }} animate={{ width: `${storagePercent}%` }} transition={{ duration: 0.6 }}
                                />
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* ── Security summary of the real installed app set ── */}
                <ul className="grid grid-cols-3 gap-3">
                    {[
                        { key: 'risky', icon: ShieldAlert, value: riskyApps.length, label: 'High risk apps', soft: 'bg-danger-soft', text: 'text-danger' },
                        { key: 'caution', icon: AlertTriangle, value: cautionApps.length, label: 'Caution', soft: 'bg-warning-soft', text: 'text-warning' },
                        { key: 'trusted', icon: Shield, value: trustedApps.length, label: 'Verified safe', soft: 'bg-success-soft', text: 'text-success' },
                    ].map(({ key, icon: Icon, value, label, soft, text }) => (
                        <motion.li key={key} variants={itemVariants}>
                            <Card padding="sm" className="h-full text-center flex flex-col items-center justify-center">
                                <span className={`w-9 h-9 rounded-xl ${soft} flex items-center justify-center mb-2`} aria-hidden="true">
                                    <Icon className={`w-4 h-4 ${text}`} />
                                </span>
                                <p className="text-[20px] font-bold text-text-primary tabular-nums leading-none">{value}</p>
                                <p className="text-[10.5px] text-text-tertiary uppercase tracking-wide mt-1.5 leading-tight">{label}</p>
                            </Card>
                        </motion.li>
                    ))}
                </ul>

                {/* Hardware & Kernel Security Auditor */}
                <motion.div variants={itemVariants}>
                    <HardwareSecurityAuditor
                        nativeInfo={nativeInfo}
                        isNative={isNative}
                        onRefresh={load}
                        isRefreshing={isRefreshing}
                    />
                </motion.div>

                {/* Real App Panel */}
                <motion.div variants={itemVariants}>
                    <InstalledAppsPanel apps={installedApps} onRefresh={load} isRefreshing={isRefreshing} />
                </motion.div>
            </motion.div>
        </div>
    )
}
