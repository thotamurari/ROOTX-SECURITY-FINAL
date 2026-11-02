// ═══════════════════════════════════════════════════════════════════════
// REAL device data — everything here comes from a browser API that actually
// exists and reflects the user's real device, updated live. Nothing is
// invented. Where a value can't be read (API missing / permission denied),
// it's returned as null and the UI shows "Not available" rather than a fake
// number.
//
// What the browser CAN read (used below):
//   - Device model & platform  → navigator.userAgentData.getHighEntropyValues
//   - OS / Android version      → user agent + UA-CH platformVersion
//   - CPU logical cores         → navigator.hardwareConcurrency
//   - Approx RAM                → navigator.deviceMemory (GB, coarse)
//   - Storage quota & usage     → navigator.storage.estimate()
//   - Battery level & charging  → navigator.getBattery()
//   - Network type & speed      → navigator.connection
//   - Screen / display          → window.screen, devicePixelRatio
//   - Online status, language, timezone
//
// What the browser CANNOT read (needs the native module, shown as sample):
//   installed-apps list, root/bootloader status, security patch level,
//   per-app permissions, running processes.
// ═══════════════════════════════════════════════════════════════════════

export interface DeviceInfo {
    model: string | null
    os: string
    osVersion: string | null
    architecture: string | null
    isMobile: boolean
    cpuCores: number | null
    ramGB: number | null
    storage: { usedGB: number; quotaGB: number; usedPercent: number } | null
    battery: { level: number; charging: boolean } | null
    network: { type: string | null; effectiveType: string | null; downlinkMbps: number | null } | null
    screen: { width: number; height: number; dpr: number }
    language: string
    timezone: string
    online: boolean
}

interface UADataLike {
    mobile?: boolean
    platform?: string
    getHighEntropyValues?: (hints: string[]) => Promise<Record<string, string>>
}

function parseUserAgentOS(ua: string): { os: string; osVersion: string | null } {
    if (/Android/i.test(ua)) {
        const m = ua.match(/Android\s+([\d.]+)/i)
        return { os: 'Android', osVersion: m ? m[1]! : null }
    }
    if (/iPhone|iPad|iPod/i.test(ua)) {
        const m = ua.match(/OS\s+([\d_]+)/i)
        return { os: 'iOS', osVersion: m ? m[1]!.replace(/_/g, '.') : null }
    }
    if (/Windows NT/i.test(ua)) return { os: 'Windows', osVersion: null }
    if (/Mac OS X/i.test(ua)) return { os: 'macOS', osVersion: null }
    if (/Linux/i.test(ua)) return { os: 'Linux', osVersion: null }
    return { os: navigator.platform || 'Unknown', osVersion: null }
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
    const ua = navigator.userAgent
    const parsed = parseUserAgentOS(ua)
    const uaData = (navigator as Navigator & { userAgentData?: UADataLike }).userAgentData

    let model: string | null = null
    let architecture: string | null = null
    let osVersion = parsed.osVersion
    const isMobile = uaData?.mobile ?? /Mobi|Android|iPhone/i.test(ua)

    // High-entropy UA Client Hints give the real device model on Android Chrome.
    if (uaData?.getHighEntropyValues) {
        try {
            const hev = await uaData.getHighEntropyValues(['model', 'platformVersion', 'architecture'])
            model = hev.model || null
            architecture = hev.architecture || null
            if (hev.platformVersion) osVersion = hev.platformVersion
        } catch {
            /* ignore — fall back to nulls */
        }
    }

    // Storage (real quota + usage)
    let storage: DeviceInfo['storage'] = null
    try {
        if (navigator.storage?.estimate) {
            const est = await navigator.storage.estimate()
            if (est.quota && est.usage != null) {
                const quotaGB = est.quota / 1e9
                const usedGB = est.usage / 1e9
                storage = {
                    usedGB: Math.round(usedGB * 10) / 10,
                    quotaGB: Math.round(quotaGB * 10) / 10,
                    usedPercent: est.quota > 0 ? Math.round((est.usage / est.quota) * 100) : 0,
                }
            }
        }
    } catch { /* ignore */ }

    // Battery (real level + charging state)
    let battery: DeviceInfo['battery'] = null
    try {
        const getBattery = (navigator as Navigator & { getBattery?: () => Promise<any> }).getBattery
        if (getBattery) {
            const b = await getBattery.call(navigator)
            battery = { level: Math.round(b.level * 100), charging: !!b.charging }
        }
    } catch { /* ignore */ }

    // Network Information
    let network: DeviceInfo['network'] = null
    const conn = (navigator as Navigator & { connection?: any }).connection
    if (conn) {
        network = {
            type: conn.type ?? null,
            effectiveType: conn.effectiveType ?? null,
            downlinkMbps: typeof conn.downlink === 'number' ? conn.downlink : null,
        }
    }

    return {
        model,
        os: parsed.os,
        osVersion,
        architecture,
        isMobile,
        cpuCores: navigator.hardwareConcurrency || null,
        ramGB: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
        storage,
        battery,
        network,
        screen: {
            width: window.screen.width,
            height: window.screen.height,
            dpr: window.devicePixelRatio || 1,
        },
        language: navigator.language || 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        online: navigator.onLine,
    }
}

/** Compact, human summary of the real device — handy for feeding the AI assistant. */
export function summarizeDevice(d: DeviceInfo): string {
    const parts = [
        `Device: ${d.model || (d.isMobile ? 'Mobile device' : 'Computer')} (${d.os}${d.osVersion ? ' ' + d.osVersion : ''})`,
        d.cpuCores ? `CPU: ${d.cpuCores} logical cores` : null,
        d.ramGB ? `RAM: ~${d.ramGB} GB` : null,
        d.storage ? `Storage: ${d.storage.usedGB} GB used of ${d.storage.quotaGB} GB available to the browser (${d.storage.usedPercent}%)` : null,
        d.battery ? `Battery: ${d.battery.level}% ${d.battery.charging ? '(charging)' : '(on battery)'}` : null,
        d.network ? `Network: ${d.network.effectiveType || d.network.type || 'unknown'}${d.network.downlinkMbps ? `, ~${d.network.downlinkMbps} Mbps` : ''}` : null,
        `Display: ${d.screen.width}×${d.screen.height} @ ${d.screen.dpr}x`,
        `Locale: ${d.language}, ${d.timezone}`,
        `Online: ${d.online ? 'yes' : 'no'}`,
    ].filter(Boolean)
    return parts.join('\n')
}
