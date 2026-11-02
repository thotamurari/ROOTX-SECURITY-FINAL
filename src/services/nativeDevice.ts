export interface NativeInstalledApp {
    id: string
    name: string
    packageName: string
    version: string
    versionCode: number
    isSystemApp: boolean
    isDebuggable: boolean
    allowBackup: boolean
    targetSdkVersion: number
    minSdkVersion: number
    firstInstallTime: number
    lastUpdateTime: number
    apkSize: number
    permissions: string[]
    permissionsCount: number
    dangerousPermissions: string[]
    dangerousPermissionsCount: number
    installer: string
    isNative: boolean
    signatureSha256?: string
    installerPackageName?: string
}

export interface NativeDeviceSecurityInfo {
    cpuCores: number
    ram?: {
        totalGB: number
        availableGB: number
        usedGB: number
        usedPercent: number
        isLowMemory: boolean
    }
    ramGB?: number
    storage?: {
        totalGB: number
        availableGB: number
        usedGB: number
        quotaGB: number
        usedPercent: number
    }
    battery?: {
        level: number
        charging: boolean
        plugged: boolean
        temperature: number
        voltage: number
        health: string
    }
    manufacturer?: string
    model?: string
    brand?: string
    device?: string
    product?: string
    hardware?: string
    bootloader?: string
    os: string
    osVersion?: string
    sdkInt?: number
    securityPatch?: string
    isMobile: boolean
    isNative: boolean
    isRooted: boolean
    isAdbEnabled: boolean
}

export interface PackageEventData {
    packageName: string
    appName?: string
    action: string
    eventType: 'installed' | 'updated' | 'uninstalled'
    timestamp: number
    dangerousPermissionsCount?: number
}

export interface NativeGoogleUser {
    id: string
    email: string
    displayName?: string
    givenName?: string
    familyName?: string
    photoUrl?: string
    idToken?: string
    serverAuthCode?: string
}

export const isNativePlatform = (): boolean => {
    return false
}

export async function performNativeGoogleSignIn(webClientId?: string): Promise<NativeGoogleUser | null> {
    return null
}

export function onPackageEvent(callback: (event: PackageEventData) => void): (() => void) | undefined {
    return undefined
}

export async function getNativeInstalledApps(): Promise<{
    apps: NativeInstalledApp[]
    totalCount: number
    isNative: boolean
    error?: string
}> {
    return {
        apps: [],
        totalCount: 0,
        isNative: false,
    }
}

export async function getNativeDeviceSecurityInfo(): Promise<NativeDeviceSecurityInfo | null> {
    return null
}
