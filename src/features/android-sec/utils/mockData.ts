import type { InstalledApp, BatteryEstimator, BatteryScenario } from '@/types/api'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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

export const fetchBatteryEstimator = async (): Promise<BatteryEstimator> => {
    await delay(200)
    const currentPercent = 100
    const scenarios = Object.entries(usageScenarios).map(([key, scenario]) => {
        const hoursRaw = currentPercent / scenario.drainPerHour
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
            status: hours >= 8 ? 'great' : hours >= 4 ? 'good' : 
                    hours >= 2 ? 'low' : 'critical'
        } as BatteryScenario
    })
    
    return {
        currentPercent,
        capacity: 4500,
        temperature: 32,
        drainRate: 10,
        scenarios,
        tips: [
            'Close Instagram to save 3-4 hours of battery',
            'Enable Battery Saver for 40% longer battery life',
            'Reduce screen brightness to save 15% battery'
        ]
    }
}

export const fetchInstalledApps = async (): Promise<InstalledApp[]> => {
    await delay(400)
    return [
        { id:'1', name:'WhatsApp', category:'Communication', storageUsed:1240, cacheSize:340, dataSize:900, apkSize:85, safetyStatus:'caution', lastUsed:'5 minutes ago', installDate:'2022-03-15', version:'2.24.1', permissions:12, dangerousPermissions:2, safetyReason:'High battery drain and always runs in background' },
        { id:'2', name:'Instagram', category:'Social Media', storageUsed:890, cacheSize:450, dataSize:360, apkSize:80, safetyStatus:'caution', lastUsed:'1 hour ago', installDate:'2021-08-20', version:'320.0', permissions:14, dangerousPermissions:3, safetyReason:'Tracks location and runs background processes' },
        { id:'3', name:'Facebook', category:'Social Media', storageUsed:1100, cacheSize:520, dataSize:490, apkSize:90, safetyStatus:'risky', lastUsed:'3 hours ago', installDate:'2021-01-10', version:'420.0', permissions:16, dangerousPermissions:5, safetyReason:'Accesses microphone and location unnecessarily' },
        { id:'4', name:'Chrome', category:'Browser', storageUsed:650, cacheSize:380, dataSize:220, apkSize:50, safetyStatus:'safe', lastUsed:'30 minutes ago', installDate:'2020-05-01', version:'120.0', permissions:8, dangerousPermissions:1, safetyReason:'Trusted app with reasonable permissions' },
        { id:'5', name:'TikTok', category:'Entertainment', storageUsed:1800, cacheSize:900, dataSize:800, apkSize:100, safetyStatus:'risky', lastUsed:'2 hours ago', installDate:'2022-11-05', version:'33.1', permissions:18, dangerousPermissions:6, safetyReason:'Excessive data collection and camera access' },
        { id:'6', name:'Spotify', category:'Music', storageUsed:2200, cacheSize:1200, dataSize:900, apkSize:100, safetyStatus:'caution', lastUsed:'1 hour ago', installDate:'2021-04-12', version:'8.9', permissions:9, dangerousPermissions:2, safetyReason:'High storage usage from offline downloads' },
        { id:'7', name:'YouTube', category:'Entertainment', storageUsed:980, cacheSize:600, dataSize:300, apkSize:80, safetyStatus:'safe', lastUsed:'4 hours ago', installDate:'2020-01-01', version:'19.12', permissions:7, dangerousPermissions:1, safetyReason:'Trusted app, minimal risk' },
        { id:'8', name:'Google Maps', category:'Navigation', storageUsed:450, cacheSize:200, dataSize:200, apkSize:50, safetyStatus:'caution', lastUsed:'1 day ago', installDate:'2020-01-01', version:'11.120', permissions:10, dangerousPermissions:2, safetyReason:'Background location tracking' },
        { id:'9', name:'Clean Master', category:'Utility', storageUsed:320, cacheSize:80, dataSize:200, apkSize:40, safetyStatus:'risky', lastUsed:'15 days ago', installDate:'2023-02-20', version:'7.5', permissions:14, dangerousPermissions:5, safetyReason:'Sends device data to external servers' },
        { id:'10', name:'Flashlight Pro', category:'Utility', storageUsed:45, cacheSize:10, dataSize:25, apkSize:10, safetyStatus:'risky', lastUsed:'23 days ago', installDate:'2023-08-10', version:'3.2', permissions:12, dangerousPermissions:6, safetyReason:'Requests mic/location — unnecessary for flashlight' },
        { id:'11', name:'Gmail', category:'Communication', storageUsed:380, cacheSize:120, dataSize:220, apkSize:40, safetyStatus:'safe', lastUsed:'2 hours ago', installDate:'2020-01-01', version:'2024.1', permissions:8, dangerousPermissions:1, safetyReason:'Trusted Google app' },
        { id:'12', name:'Netflix', category:'Entertainment', storageUsed:1500, cacheSize:1000, dataSize:420, apkSize:80, safetyStatus:'safe', lastUsed:'2 days ago', installDate:'2021-06-15', version:'8.9', permissions:6, dangerousPermissions:0, safetyReason:'Trusted app with minimal permissions' },
        { id:'13', name:'Snapchat', category:'Social Media', storageUsed:760, cacheSize:400, dataSize:280, apkSize:80, safetyStatus:'caution', lastUsed:'5 hours ago', installDate:'2022-07-20', version:'12.80', permissions:13, dangerousPermissions:4, safetyReason:'Camera always accessible, high data usage' },
        { id:'14', name:'Calculator', category:'Utility', storageUsed:12, cacheSize:2, dataSize:8, apkSize:2, safetyStatus:'safe', lastUsed:'3 days ago', installDate:'2020-01-01', version:'8.2', permissions:0, dangerousPermissions:0, safetyReason:'No permissions, completely safe' },
        { id:'15', name:'Zoom', category:'Communication', storageUsed:420, cacheSize:180, dataSize:190, apkSize:50, safetyStatus:'safe', lastUsed:'1 week ago', installDate:'2020-04-01', version:'5.17', permissions:9, dangerousPermissions:2, safetyReason:'Trusted app, mic/camera only used in calls' },
        { id:'16', name:'Amazon', category:'Shopping', storageUsed:280, cacheSize:140, dataSize:110, apkSize:30, safetyStatus:'safe', lastUsed:'3 days ago', installDate:'2021-09-10', version:'24.12', permissions:7, dangerousPermissions:1, safetyReason:'Trusted app with reasonable permissions' },
        { id:'17', name:'Twitter/X', category:'Social Media', storageUsed:520, cacheSize:260, dataSize:200, apkSize:60, safetyStatus:'caution', lastUsed:'6 hours ago', installDate:'2021-03-15', version:'10.12', permissions:11, dangerousPermissions:3, safetyReason:'Location and contact access not required' },
        { id:'18', name:'PhonePe', category:'Finance', storageUsed:190, cacheSize:60, dataSize:110, apkSize:20, safetyStatus:'safe', lastUsed:'2 days ago', installDate:'2021-11-20', version:'5.12', permissions:8, dangerousPermissions:1, safetyReason:'Regulated financial app, trusted' },
        { id:'19', name:'Battery Doctor', category:'Utility', storageUsed:95, cacheSize:30, dataSize:55, apkSize:10, safetyStatus:'risky', lastUsed:'20 days ago', installDate:'2023-05-10', version:'7.1', permissions:15, dangerousPermissions:5, safetyReason:'Requests contacts and location — not needed' },
        { id:'20', name:'Google Drive', category:'Storage', storageUsed:145, cacheSize:50, dataSize:85, apkSize:10, safetyStatus:'safe', lastUsed:'1 day ago', installDate:'2020-01-01', version:'2.24', permissions:7, dangerousPermissions:1, safetyReason:'Trusted Google app' }
    ]
}
