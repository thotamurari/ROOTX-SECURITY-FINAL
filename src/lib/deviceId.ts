import { isNativePlatform } from '@/services/nativeDevice'

const DEVICE_ID_KEY = 'rootx_device_id'

/** Stable per-install device identifier, used to let a user see this device
 *  in Settings → Active Devices and revoke it from another device. */
export function getDeviceId(): string {
    try {
        let id = localStorage.getItem(DEVICE_ID_KEY)
        if (!id) {
            id = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`
            localStorage.setItem(DEVICE_ID_KEY, id)
        }
        return id
    } catch {
        // localStorage unavailable (private browsing, etc.) — fall back to a
        // session-only id rather than crashing.
        return `dev-session-${Date.now()}`
    }
}

export function getDevicePlatform(): 'web' | 'android' | 'ios' {
    return isNativePlatform() ? 'android' : 'web'
}

/** Best-effort human label for the device list ("Chrome on Windows"). */
export function getDeviceName(): string {
    const ua = navigator.userAgent || ''

    let browser = 'Browser'
    if (/Edg\//.test(ua)) browser = 'Edge'
    else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome'
    else if (/Firefox\//.test(ua)) browser = 'Firefox'
    else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari'

    let os = 'Unknown OS'
    if (/Windows/.test(ua)) os = 'Windows'
    else if (/Android/.test(ua)) os = 'Android'
    else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS'
    else if (/Mac OS X/.test(ua)) os = 'macOS'
    else if (/Linux/.test(ua)) os = 'Linux'

    return isNativePlatform() ? `RootX App (${os})` : `${browser} on ${os}`
}
