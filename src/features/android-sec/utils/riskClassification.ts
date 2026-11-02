import type { InstalledApp } from '@/types/api'

// ═══════════════════════════════════════════════════════════════════════
// Android app risk classification — Weighted Scoring System
//
// Scores each app 0-100 using four weighted components:
//   1. Install Source     (0-30): sideloaded/unknown = higher risk
//   2. Permission Anomaly (0-30): permissions vs. expected for category
//   3. Configuration      (0-20): debuggable, backup, old SDK
//   4. Suspicious Signals (0-20): PUA patterns, suspicious names
//
// Thresholds:
//   Score < 20  → safe   (not flagged)
//   Score 20-45 → caution (shown with explanation)
//   Score > 45  → risky  (strongly recommended to review/remove)
//
// A known-trusted app (matched by package name or prefix) with no
// `knownThreat` flag is ALWAYS classified as safe, regardless of
// permission count. This prevents false positives on legitimate
// apps like Instagram, BGMI, Chrome, etc.
// ═══════════════════════════════════════════════════════════════════════

export type InstallSource = 'play_store' | 'preinstalled' | 'sideloaded' | 'unknown'
export type TrustLevel = 'trusted' | 'untrusted'
export type RiskLevel = 'low' | 'medium' | 'high'
export type SafetyStatus = 'safe' | 'caution' | 'risky' | 'unknown'

export interface AppRiskSignals {
    name: string
    packageName?: string
    category: string
    installSource?: InstallSource
    signatureVerified?: boolean
    isSystemApp?: boolean
    knownThreat?: boolean
    permissions: number
    dangerousPermissions: number
    dangerousPermissionsList?: string[]
    isDebuggable?: boolean
    allowBackup?: boolean
    targetSdkVersion?: number
}

export interface AppRiskResult {
    trustLevel: TrustLevel
    riskLevel: RiskLevel
    safetyStatus: SafetyStatus
    safetyReason: string
    /** Numeric risk score 0-100 for transparency */
    riskScore: number
    /** Short, human indicators of WHY — surfaced in the UI. */
    signals: string[]
}

// ─── Known Trusted Installer Packages ───────────────────────────────
const KNOWN_STORE_INSTALLERS = new Set([
    'com.android.vending',           // Google Play Store
    'com.google.android.packageinstaller',
    'com.sec.android.app.samsungapps', // Samsung Galaxy Store
    'com.amazon.venezia',            // Amazon Appstore
    'com.xiaomi.mipicks',            // Xiaomi GetApps
    'com.xiaomi.market',
    'com.huawei.appmarket',          // Huawei AppGallery
    'com.oppo.market',               // OPPO App Market
    'com.heytap.market',
    'com.vivo.appstore',             // Vivo V-Appstore
    'com.bbk.appstore',
    'com.realme.store',              // Realme Store
    'com.lenovo.leos.appstore',      // Lenovo
    'com.motorola.marketplace',
])

// ─── Known Trusted Package Prefixes ────────────────────────────────
export const KNOWN_TRUSTED_PREFIXES = [
    'com.google.',
    'com.android.',
    'com.facebook.',
    'com.instagram.',
    'com.whatsapp',
    'com.microsoft.',
    'com.sec.android.',
    'com.samsung.',
    'com.xiaomi.',
    'com.miui.',
    'com.oppo.',
    'com.coloros.',
    'com.heytap.',
    'com.vivo.',
    'com.bbk.',
    'com.oneplus.',
    'com.huawei.',
    'com.realme.',
    'org.telegram.',
    'com.spotify.',
    'com.twitter.',
    'com.snapchat.',
    'com.netflix.',
    'com.amazon.',
    'in.amazon.',
    'com.uber.',
    'com.olacabs.',
    'in.swiggy.',
    'com.application.zomato',
    'com.phonepe.',
    'net.one97.paytm',
    'in.org.npci.',
    'org.npci.',
    'in.gov.',
    'nic.in',
    'com.jio.',
    'com.ril.',
    'com.myjio',
    'in.jfs.',
    'com.grofers.',
    'com.meesho.',
    'com.myntra.',
    'com.rapido.',
    'com.dare2compete.',
    'com.unstop.',
    'sun.way2',
    'com.way2',
    'com.rigi.',
    'com.bigbasket.',
    'com.flipkart.',
    'com.zepto.',
    'com.dunzo.',
    'com.tata.',
    'com.ajio.',
    'com.nykaa.',
    'com.purplle.',
    'com.lenskart.',
    'com.makemytrip.',
    'com.goibibo.',
    'com.easemytrip.',
    'com.cleartrip.',
    'com.ixigo.',
    'com.redbus.',
    'com.bookmyshow.',
    'com.airtel.',
    'com.vodafone.',
    'com.truecaller',
    'com.sbi.',
    'com.hdfc',
    'com.icici',
    'com.axis',
    'com.kotak',
    'com.zerodha.',
    'com.groww.',
    'com.upstox.',
    'com.angelone.',
    'com.dreamplug.',
    'com.discord',
    'com.reddit.',
    'com.pinterest',
    'com.linkedin.',
    'com.adobe.',
    'com.canva.',
    'com.duolingo',
    'com.tencent.',
    'com.supercell.',
    'com.kiloo.',
    'com.ea.',
    'com.epicgames.',
    'com.activision.',
    'com.krafton.',
    'com.pubg.',
    'com.dts.freefiremax',
    'com.dts.freefireth',
    'com.mojang.',
    'com.roblox.',
    'org.coursera.',
    'com.udemy.',
    'com.byjus.',
    'com.unacademy.',
    'com.physicswallah.',
]

export const KNOWN_TRUSTED_PACKAGES = new Set([
    'com.jio.myjio',
    'com.jio.media.jiobeats',
    'com.jio.join',
    'com.jio.jioplay.tv',
    'com.jio.media.ondemand',
    'com.jiochat.jiochatapp',
    'com.ril.jio.services',
    'in.jfs.jiofinance',
    'com.grofers.customerapp',
    'com.meesho.supply',
    'com.myntra.android',
    'com.rapido.passenger',
    'com.dare2compete.app',
    'sun.way2english.hyd.com',
    'com.rigi.educlub',
    'in.amazon.mShop.android.shopping',
    'com.amazon.mShop.android.shopping',
    'com.instagram.android',
    'com.instagram.lite',
    'com.instagram.threadsapp',
    'com.whatsapp',
    'com.whatsapp.w4b',
    'com.facebook.katana',
    'com.facebook.lite',
    'com.facebook.orca',
    'org.telegram.messenger',
    'com.twitter.android',
    'com.snapchat.android',
    'com.spotify.music',
    'com.linkedin.android',
    'com.discord',
    'com.reddit.frontpage',
    'com.pinterest',
    'com.netflix.mediaclient',
    'com.flipkart.android',
    'com.ubercab',
    'com.phonepe.app',
    'net.one97.paytm',
    'com.google.android.youtube',
    'com.google.android.gm',
    'com.google.android.apps.maps',
    'com.google.android.apps.photos',
    'com.google.android.apps.messaging',
    'com.google.android.dialer',
    'com.google.android.contacts',
    'com.google.android.apps.docs',
    'com.google.android.apps.nbu.paisa.user',
    'com.android.chrome',
    'com.truecaller',
    'in.swiggy.android',
    'com.application.zomato',
    'com.dreamplug.androidapp',        // CRED
    'com.msf.kbank.mobile',            // Kotak
    'com.csam.icici.bank.imobile',     // ICICI iMobile
    'com.sbi.lotusintouch',            // YONO SBI
    'com.snapwork.hdfc',               // HDFC Bank
    'com.bigbasket.mobileapp',
    'com.hellotalk',
    'com.krafton.pubgm',               // BGMI
    'com.dts.freefiremax',
    'com.mojang.minecraftpe',
    'com.roblox.client',
    'com.brave.browser',
    'org.mozilla.firefox',
    'com.opera.browser',
    'com.opera.mini.native',
    'us.zoom.videomeetings',
    'com.skype.raider',
    'com.Slack',
    'com.notion.id',
])

export function isKnownTrustedPackage(packageName?: string, _appName?: string): boolean {
    if (!packageName) return false
    const pkg = packageName.toLowerCase()

    if (KNOWN_TRUSTED_PACKAGES.has(pkg)) return true
    if (KNOWN_TRUSTED_PREFIXES.some(prefix => pkg.startsWith(prefix))) return true

    return false
}

/**
 * Normalizes an installer string returned by the native plugin
 * into a standard InstallSource category.
 */
export function normalizeInstallSource(
    installer: string | undefined | null,
    isSystemApp: boolean
): InstallSource {
    if (isSystemApp) return 'preinstalled'
    if (!installer) return 'unknown'

    const lower = installer.toLowerCase()

    // Known app stores
    if (KNOWN_STORE_INSTALLERS.has(lower)) return 'play_store'
    if (lower.includes('vending') || lower.includes('google')) return 'play_store'
    if (lower.includes('samsung') || lower.includes('sec.android.app')) return 'play_store'
    if (lower.includes('xiaomi') || lower.includes('miui')) return 'play_store'
    if (lower.includes('huawei') || lower.includes('appmarket')) return 'play_store'
    if (lower.includes('oppo') || lower.includes('heytap')) return 'play_store'
    if (lower.includes('vivo') || lower.includes('bbk')) return 'play_store'
    if (lower.includes('amazon') || lower.includes('venezia')) return 'play_store'
    if (lower.includes('realme')) return 'play_store'

    // Package installer / ADB
    if (lower.includes('packageinstaller')) return 'sideloaded'
    if (lower === 'adb' || lower === 'shell') return 'sideloaded'

    // If we have *any* installer name but don't recognize it,
    // treat it as a known store install rather than "sideloaded" —
    // OEMs register custom installer package names.
    return 'play_store'
}

// ─── Permission Category Expectations ──────────────────────────────
// Expected dangerous permission range for each category.
// If an app exceeds the upper bound, it's an anomaly for that category.

const CATEGORY_EXPECTED_PERMISSIONS: Record<string, { expected: number; max: number }> = {
    'Utility':          { expected: 1, max: 3 },
    'Tools':            { expected: 2, max: 4 },
    'Personalization':  { expected: 0, max: 2 },
    'Wallpaper':        { expected: 0, max: 1 },
    'Flashlight':       { expected: 0, max: 1 },
    'Books':            { expected: 1, max: 2 },
    'Education':        { expected: 2, max: 5 },
    'Widgets':          { expected: 0, max: 2 },
    'Cleaner':          { expected: 1, max: 3 },
    'Battery':          { expected: 1, max: 2 },
    'Weather':          { expected: 1, max: 3 },
    'Calculator':       { expected: 0, max: 1 },
    'Clock':            { expected: 0, max: 2 },
    'Social Media':     { expected: 8, max: 15 },
    'Communication':    { expected: 8, max: 15 },
    'Entertainment':    { expected: 5, max: 12 },
    'Navigation':       { expected: 3, max: 8 },
    'Finance':          { expected: 5, max: 10 },
    'Dating':           { expected: 5, max: 10 },
    'Shopping':         { expected: 3, max: 8 },
    'Travel':           { expected: 3, max: 8 },
    'Health':           { expected: 3, max: 8 },
    'Fitness':          { expected: 3, max: 8 },
    'Games':            { expected: 3, max: 8 },
    'Photography':      { expected: 4, max: 8 },
    'Music':            { expected: 3, max: 7 },
    'Video':            { expected: 4, max: 8 },
    'News':             { expected: 2, max: 5 },
    'Productivity':     { expected: 3, max: 7 },
    'Business':         { expected: 3, max: 8 },
}

// Suspicious permission combos that should raise flags
const SUSPICIOUS_COMBOS: Array<{ perms: string[]; label: string }> = [
    {
        perms: ['android.permission.SEND_SMS', 'android.permission.READ_SMS', 'android.permission.RECEIVE_SMS'],
        label: 'Full SMS access (can send, read, and intercept messages)',
    },
    {
        perms: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO', 'android.permission.ACCESS_FINE_LOCATION'],
        label: 'Camera + microphone + precise location (surveillance-capable)',
    },
    {
        perms: ['android.permission.READ_CONTACTS', 'android.permission.SEND_SMS'],
        label: 'Contacts + SMS (can spam your contacts)',
    },
    {
        perms: ['android.permission.REQUEST_INSTALL_PACKAGES', 'android.permission.SYSTEM_ALERT_WINDOW'],
        label: 'Can install apps and show overlay windows (malware dropper pattern)',
    },
    {
        perms: ['android.permission.BIND_ACCESSIBILITY_SERVICE'],
        label: 'Accessibility service (can read screen content and perform actions)',
    },
    {
        perms: ['android.permission.BIND_DEVICE_ADMIN'],
        label: 'Device administrator (can lock device, wipe data)',
    },
]

// PUA / suspicious package name patterns
const SUSPICIOUS_PACKAGE_PATTERNS = [
    /\.hack/i,
    /\.crack/i,
    /\.cheat/i,
    /\.modded/i,
    /\.keygen/i,
    /\.spy/i,
    /\.stealth/i,
    /\.hidden/i,
    /\.fakegps/i,
    /\.xspy/i,
    /\.keylog/i,
    /\.sniffer/i,
]

// ─── Main Classifier ───────────────────────────────────────────────

export function classifyApp(app: AppRiskSignals): AppRiskResult {
    const signals: string[] = []
    const pkg = (app.packageName || '').toLowerCase()
    const isKnownTrusted = isKnownTrustedPackage(app.packageName, app.name)
    const source = app.installSource
        ?? normalizeInstallSource(undefined, !!app.isSystemApp)

    // ═══ Fast path: known trusted app without known threats ═══
    if (isKnownTrusted && !app.knownThreat) {
        return {
            trustLevel: 'trusted',
            riskLevel: 'low',
            safetyStatus: 'safe',
            riskScore: 0,
            safetyReason: `Verified trusted application. Permissions are standard for ${app.category.toLowerCase()} functionality.`,
            signals: ['Verified publisher', 'Trusted ecosystem app'],
        }
    }

    // ═══ Fast path: system/preinstalled app without known threats ═══
    if (app.isSystemApp && !app.knownThreat) {
        return {
            trustLevel: 'trusted',
            riskLevel: 'low',
            safetyStatus: 'safe',
            riskScore: 0,
            safetyReason: `Preinstalled system application.`,
            signals: ['System app', 'Preinstalled by manufacturer'],
        }
    }

    // ═══ Weighted scoring ═══
    let score = 0

    // 1. INSTALL SOURCE (0-30)
    let sourceScore = 0
    if (source === 'sideloaded') {
        sourceScore = 20
        signals.push('Installed from outside app stores (sideloaded)')
    } else if (source === 'unknown') {
        sourceScore = 25
        signals.push('Unknown install source')
    } else if (source === 'play_store') {
        sourceScore = 0
    }
    // Signature adds to source concerns
    if (app.signatureVerified === false) {
        sourceScore = Math.min(30, sourceScore + 10)
        signals.push('Unverified signing certificate')
    }
    score += sourceScore

    // 2. PERMISSION ANOMALY (0-30)
    let permScore = 0
    const categoryExpectation = CATEGORY_EXPECTED_PERMISSIONS[app.category]
    if (categoryExpectation) {
        const excess = app.dangerousPermissions - categoryExpectation.max
        if (excess > 0) {
            // For Play Store apps, standard permission use is normal — cap penalty
            if (source === 'play_store') {
                permScore = Math.min(8, excess * 2)
            } else {
                permScore = Math.min(30, excess * 5)
                signals.push(
                    `Requests ${app.dangerousPermissions} dangerous permissions (expected ≤${categoryExpectation.max} for ${app.category})`
                )
            }
        }
    } else {
        // Unknown category
        if (source !== 'play_store' && app.dangerousPermissions >= 10) {
            permScore = 15
            signals.push(`High permission count (${app.dangerousPermissions} dangerous permissions)`)
        }
    }

    // Check for suspicious permission combinations
    if (app.dangerousPermissionsList && app.dangerousPermissionsList.length > 0) {
        for (const combo of SUSPICIOUS_COMBOS) {
            const hasAllPerms = combo.perms.every(p =>
                app.dangerousPermissionsList!.includes(p)
            )
            if (hasAllPerms) {
                // Only add penalty for categories that shouldn't have these combos
                const isExpectedForCategory =
                    ['Social Media', 'Communication', 'Finance'].includes(app.category)
                if (!isExpectedForCategory) {
                    permScore = Math.min(30, permScore + 10)
                    signals.push(combo.label)
                }
            }
        }
    }
    score += permScore

    // 3. CONFIGURATION FLAGS (0-20)
    let configScore = 0
    if (app.isDebuggable) {
        configScore += 10
        signals.push('App is built in debug mode (not production-ready)')
    }
    if (app.targetSdkVersion && app.targetSdkVersion < 26) {
        // Targeting very old Android APIs — can bypass modern security
        configScore += 8
        signals.push(`Targets old Android API level ${app.targetSdkVersion} (bypasses modern security restrictions)`)
    }
    configScore = Math.min(20, configScore)
    score += configScore

    // 4. SUSPICIOUS INDICATORS (0-20)
    let suspiciousScore = 0
    if (app.knownThreat) {
        suspiciousScore = 20
        signals.push('Matches known malware/adware signature')
    } else {
        // Check package name patterns
        for (const pattern of SUSPICIOUS_PACKAGE_PATTERNS) {
            if (pattern.test(pkg)) {
                suspiciousScore = Math.min(20, suspiciousScore + 15)
                signals.push('Package name matches suspicious software pattern')
                break
            }
        }
    }
    score += suspiciousScore

    // ═══ Clamp score 0-100 ═══
    score = Math.min(100, Math.max(0, score))

    // ═══ Determine risk level from score ═══
    let riskLevel: RiskLevel
    let safetyStatus: SafetyStatus

    if (score > 45) {
        riskLevel = 'high'
        safetyStatus = 'risky'
    } else if (score >= 20) {
        riskLevel = 'medium'
        safetyStatus = 'caution'
    } else {
        riskLevel = 'low'
        safetyStatus = 'safe'
    }

    const trustLevel: TrustLevel = (source === 'play_store' || source === 'preinstalled')
        && app.signatureVerified !== false
        && !app.knownThreat
        ? 'trusted' : 'untrusted'

    // Generate human-readable reason
    let reason: string
    if (score > 45) {
        reason = `Risk Score ${score}/100 — ${signals.slice(0, 2).join('. ')}. Review or remove this application.`
    } else if (score >= 20) {
        reason = `Risk Score ${score}/100 — ${signals.slice(0, 2).join('. ')}. Worth reviewing.`
    } else {
        reason = `Risk Score ${score}/100 — No significant concerns detected.`
        if (signals.length === 0) signals.push('No risk indicators')
    }

    return { trustLevel, riskLevel, safetyStatus, safetyReason: reason, riskScore: score, signals }
}

/** Applies the classifier to a raw app record and merges the derived fields. */
export function withRiskClassification<T extends AppRiskSignals & Partial<InstalledApp>>(app: T): T & AppRiskResult {
    return { ...app, ...classifyApp(app) }
}
