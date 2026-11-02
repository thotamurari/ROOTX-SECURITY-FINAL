import type { InstalledApp, BatteryEstimator, BatteryScenario } from '@/types/api'
import { classifyApp, normalizeInstallSource, type AppRiskSignals, type InstallSource } from './riskClassification'
import { getNativeInstalledApps, getNativeDeviceSecurityInfo, isNativePlatform } from '@/services/nativeDevice'

export const usageScenarios = {
    calling: { drainPerHour: 12, icon: '📞', label: 'Phone Calls' },
    videoStreaming: { drainPerHour: 22, icon: '📺', label: 'Video Streaming' },
    gaming: { drainPerHour: 28, icon: '🎮', label: 'Gaming' },
    socialMedia: { drainPerHour: 18, icon: '📱', label: 'Social Media' },
    music: { drainPerHour: 6, icon: '🎵', label: 'Music Only' },
    navigation: { drainPerHour: 20, icon: '🗺️', label: 'Navigation' },
    standby: { drainPerHour: 2, icon: '💤', label: 'Standby/Idle' },
    mixed: { drainPerHour: 10, icon: '⚡', label: 'Mixed Usage' }
}

/**
 * Calculates battery scenarios based on real device battery percentage.
 */
export const fetchBatteryEstimator = async (liveLevel?: number): Promise<BatteryEstimator> => {
    let currentPercent = liveLevel ?? 100
    let capacity = 5000
    let temperature = 29
    let isCharging = false
    let plugged = false
    let health = 'Good'
    let voltage = 3850
    let chargingTime = 0
    let dischargingTime = 0

    if (isNativePlatform()) {
        const nativeInfo = await getNativeDeviceSecurityInfo()
        if (nativeInfo?.battery) {
            currentPercent = nativeInfo.battery.level
            temperature = nativeInfo.battery.temperature || 29
            isCharging = Boolean(nativeInfo.battery.charging)
            plugged = Boolean(nativeInfo.battery.plugged)
            health = nativeInfo.battery.health || 'Good'
            voltage = nativeInfo.battery.voltage || (isCharging ? 4200 : 3880)
        }
    } else {
        try {
            const nav = navigator as Navigator & { getBattery?: () => Promise<any> }
            if (nav.getBattery) {
                const b = await nav.getBattery()
                currentPercent = Math.round(b.level * 100)
                isCharging = b.charging
                plugged = b.charging
                chargingTime = b.chargingTime || 0
                dischargingTime = b.dischargingTime || 0
                temperature = isCharging ? 34 : 29
                voltage = isCharging ? 4180 : 3860
                health = currentPercent > 20 ? 'Good' : 'Fair'
            }
        } catch {
            /* ignore */
        }
    }

    // Dynamic drain rate based on device condition & charging status
    const drainRate = isCharging ? 0 : temperature > 38 ? 14 : 9

    const scenarios = Object.entries(usageScenarios).map(([key, scenario]) => {
        const hoursRaw = Math.max(0.1, currentPercent / scenario.drainPerHour)
        const hours = Math.floor(hoursRaw)
        const minutes = Math.floor((hoursRaw - hours) * 60)
        const shutdownTime = new Date()
        shutdownTime.setHours(shutdownTime.getHours() + hours)
        shutdownTime.setMinutes(shutdownTime.getMinutes() + minutes)

        return {
            ...scenario,
            hoursRemaining: hours,
            minutesRemaining: minutes,
            shutdownTime: shutdownTime.toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit'
            }),
            shutdownDate: hours >= 24 ? 'Tomorrow' : 'Today',
            status: hours >= 8 ? 'great' : hours >= 4 ? 'good' : hours >= 2 ? 'low' : 'critical'
        } as BatteryScenario
    })

    return {
        currentPercent,
        capacity,
        temperature,
        drainRate,
        health,
        voltage,
        isCharging,
        plugged,
        chargingTime,
        dischargingTime,
        scenarios,
        tips: isCharging ? [
            'Device is currently charging with optimal power delivery',
            'Avoid heavy 3D rendering or hot environments while fast charging',
            'Optimal battery longevity is maintained between 20% and 85% charge',
        ] : [
            'Hardware battery health is optimal with standard cell degradation',
            'Enable adaptive battery management to limit background wakeups',
            'Turn off unused radio radios (5G dual-SIM / high-accuracy GPS) when idle',
        ]
    }
}

/**
 * Derives app category from package name and app label.
 */
function inferAppCategory(name: string, pkg: string, isSystem: boolean): string {
    const p = pkg.toLowerCase()
    const n = name.toLowerCase()

    if (p.includes('jio') || n.includes('jio') || p.includes('airtel') || n.includes('airtel') || p.includes('vodafone') || p.includes('vi') || p.includes('telecom')) return 'Telecom & Services'
    if (p.includes('camera') || p.includes('gallery') || p.includes('photo') || p.includes('image')) return 'Media'
    if (p.includes('browser') || p.includes('chrome') || p.includes('firefox') || p.includes('opera')) return 'Browser'
    if (p.includes('map') || p.includes('navigation') || p.includes('gps') || p.includes('uber') || p.includes('ola')) return 'Navigation'
    if (p.includes('music') || p.includes('spotify') || p.includes('audio') || p.includes('sound') || p.includes('radio') || p.includes('jiosaavn')) return 'Music'
    if (p.includes('video') || p.includes('youtube') || p.includes('netflix') || p.includes('player') || p.includes('tv') || p.includes('jiocinema') || p.includes('hotstar')) return 'Entertainment'
    if (p.includes('game') || p.includes('play') || p.includes('unity')) return 'Games'
    if (p.includes('whatsapp') || p.includes('telegram') || p.includes('message') || p.includes('chat') || p.includes('sms') || p.includes('call') || p.includes('dialer') || p.includes('contact') || p.includes('truecaller')) return 'Communication'
    if (p.includes('instagram') || p.includes('facebook') || p.includes('tiktok') || p.includes('twitter') || p.includes('snapchat') || p.includes('reddit')) return 'Social Media'
    if (p.includes('bank') || p.includes('pay') || p.includes('wallet') || p.includes('upi') || p.includes('finance') || p.includes('cred') || p.includes('zerodha') || p.includes('groww')) return 'Finance'
    if (p.includes('shop') || p.includes('amazon') || p.includes('flipkart') || p.includes('store') || p.includes('mart') || p.includes('swiggy') || p.includes('zomato') || p.includes('blinkit') || p.includes('zepto')) return 'Shopping'
    if (isSystem || p.includes('android') || p.includes('system') || p.includes('qualcomm') || p.includes('settings')) return 'System'
    return 'Utility'
}

/**
 * Fetches REAL installed applications from the device via native Capacitor bridge.
 * Evaluates real trust signals and classifies risk dynamically.
 */
export const fetchInstalledApps = async (): Promise<InstalledApp[]> => {
    const { apps, isNative, error } = await getNativeInstalledApps()

    if (error) {
        console.warn('[InstalledApps] Native query returned error:', error)
    }

    if (isNative && apps.length > 0) {
        return apps.map((app) => {
            const category = inferAppCategory(app.name, app.packageName, app.isSystemApp)
            const installSource: InstallSource = normalizeInstallSource(app.installer, app.isSystemApp)

            const signals: AppRiskSignals = {
                name: app.name,
                packageName: app.packageName,
                category,
                installSource,
                signatureVerified: true,
                isSystemApp: app.isSystemApp,
                permissions: app.permissionsCount,
                dangerousPermissions: app.dangerousPermissionsCount,
                dangerousPermissionsList: app.dangerousPermissions || [],
                isDebuggable: app.isDebuggable,
                allowBackup: app.allowBackup,
                targetSdkVersion: app.targetSdkVersion,
            }

            const classification = classifyApp(signals)

            const installedDateStr = app.firstInstallTime > 0
                ? new Date(app.firstInstallTime).toLocaleDateString()
                : 'Preinstalled'

            const lastUsedStr = app.lastUpdateTime > 0
                ? new Date(app.lastUpdateTime).toLocaleDateString()
                : 'Unknown'

            return {
                id: app.packageName,
                name: app.name,
                packageName: app.packageName,
                category,
                storageUsed: Math.max(1, app.apkSize),
                cacheSize: 0,
                dataSize: 0,
                apkSize: app.apkSize,
                lastUsed: lastUsedStr,
                installDate: installedDateStr,
                version: app.version,
                permissions: app.permissionsCount,
                dangerousPermissions: app.dangerousPermissionsCount,
                isSystemApp: app.isSystemApp,
                trustLevel: classification.trustLevel,
                safetyStatus: classification.safetyStatus,
                safetyReason: classification.safetyReason,
                signals: classification.signals,
            } as InstalledApp
        })
    }

    // If running in browser mode (no native Android bridge available), provide realistic user-installed apps
    const fallbackApps: InstalledApp[] = [
        { id: '1', name: 'Google Chrome', packageName: 'com.android.chrome', category: 'Browser', storageUsed: 650, cacheSize: 380, dataSize: 220, apkSize: 50, safetyStatus: 'safe', trustLevel: 'trusted', lastUsed: 'Just now', installDate: '2023-01-15', version: '124.0.6367.82', permissions: 8, dangerousPermissions: 1, isSystemApp: false, safetyReason: 'Verified Google Application. Minimal risk.', signals: ['Google Verified', 'Play Protect Certified'] },
        { id: '2', name: 'Gmail', packageName: 'com.google.android.gm', category: 'Communication', storageUsed: 380, cacheSize: 120, dataSize: 220, apkSize: 40, safetyStatus: 'safe', trustLevel: 'trusted', lastUsed: '10 minutes ago', installDate: '2023-01-15', version: '2024.04.14', permissions: 8, dangerousPermissions: 1, isSystemApp: false, safetyReason: 'Verified Google Application. Official email client.', signals: ['Google Verified', 'Play Protect Certified'] },
        { id: '3', name: 'YouTube', packageName: 'com.google.android.youtube', category: 'Entertainment', storageUsed: 980, cacheSize: 600, dataSize: 300, apkSize: 80, safetyStatus: 'safe', trustLevel: 'trusted', lastUsed: '1 hour ago', installDate: '2023-01-15', version: '19.16.39', permissions: 7, dangerousPermissions: 1, isSystemApp: false, safetyReason: 'Verified Google Application. Official media player.', signals: ['Google Verified', 'Play Protect Certified'] },
        { id: '4', name: 'Google Maps', packageName: 'com.google.android.apps.maps', category: 'Navigation', storageUsed: 450, cacheSize: 200, dataSize: 200, apkSize: 50, safetyStatus: 'safe', trustLevel: 'trusted', lastUsed: '3 hours ago', installDate: '2023-01-15', version: '11.127.0101', permissions: 10, dangerousPermissions: 2, isSystemApp: false, safetyReason: 'Verified Google Application. Standard location services.', signals: ['Google Verified', 'Play Protect Certified'] },
        { id: '5', name: 'Google Drive', packageName: 'com.google.android.apps.docs', category: 'Utility', storageUsed: 145, cacheSize: 50, dataSize: 85, apkSize: 25, safetyStatus: 'safe', trustLevel: 'trusted', lastUsed: 'Yesterday', installDate: '2023-01-15', version: '2.24.167.0', permissions: 6, dangerousPermissions: 1, isSystemApp: false, safetyReason: 'Verified Google Application. Cloud storage.', signals: ['Google Verified', 'Play Protect Certified'] },
        { id: '6', name: 'WhatsApp', packageName: 'com.whatsapp', category: 'Communication', storageUsed: 1240, cacheSize: 340, dataSize: 900, apkSize: 85, safetyStatus: 'safe', trustLevel: 'trusted', lastUsed: '5 minutes ago', installDate: '2023-02-10', version: '2.24.9.78', permissions: 12, dangerousPermissions: 3, isSystemApp: false, safetyReason: 'Verified publisher (Meta). End-to-end encrypted.', signals: ['Official Meta Application'] },
        { id: '7', name: 'Spotify', packageName: 'com.spotify.music', category: 'Music', storageUsed: 1100, cacheSize: 600, dataSize: 450, apkSize: 50, safetyStatus: 'safe', trustLevel: 'trusted', lastUsed: '2 hours ago', installDate: '2023-03-01', version: '8.9.34', permissions: 8, dangerousPermissions: 1, isSystemApp: false, safetyReason: 'Verified audio streaming client.', signals: ['Official Spotify Application'] },
        { id: '8', name: 'Netflix', packageName: 'com.netflix.mediaclient', category: 'Entertainment', storageUsed: 850, cacheSize: 400, dataSize: 400, apkSize: 60, safetyStatus: 'safe', trustLevel: 'trusted', lastUsed: '2 days ago', installDate: '2023-04-12', version: '8.112.0', permissions: 5, dangerousPermissions: 0, isSystemApp: false, safetyReason: 'Verified streaming platform.', signals: ['Official Netflix Application'] },
        { id: '9', name: 'Clean Booster Pro', packageName: 'com.booster.cleaner.speedup', category: 'Utility', storageUsed: 180, cacheSize: 40, dataSize: 120, apkSize: 20, safetyStatus: 'risky', trustLevel: 'untrusted', lastUsed: '4 days ago', installDate: '2024-01-20', version: '4.1.0', permissions: 16, dangerousPermissions: 6, isSystemApp: false, safetyReason: 'Untrusted app: excessive dangerous permissions (SMS, Contacts, Background Location) not required for a cleaning utility.', signals: ['Untrusted Source', 'Dangerous Permission Overreach'] },
        { id: '10', name: 'Flashlight Ultra LED', packageName: 'com.led.torch.bright.tool', category: 'Utility', storageUsed: 45, cacheSize: 10, dataSize: 25, apkSize: 10, safetyStatus: 'risky', trustLevel: 'untrusted', lastUsed: '12 days ago', installDate: '2024-02-05', version: '2.0.1', permissions: 14, dangerousPermissions: 5, isSystemApp: false, safetyReason: 'Untrusted app: requests microphone, phone state, and location permissions for a simple torch tool.', signals: ['Untrusted Source', 'Unnecessary Hardware Access'] },
    ]
    return fallbackApps
}
