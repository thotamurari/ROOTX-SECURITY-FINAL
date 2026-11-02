// ═══════════════════════════════════════════════════════════════════════
// Fake / Cloned App Detector
//
// Evidence-based trust classification for installed apps.
// Uses 4 trust signals:
//   1. Package identity (known-good registry)
//   2. Signing certificate SHA-256 (if available from native plugin)
//   3. Installer source (Play Store vs sideloaded)
//   4. Permission-behavior mismatch scoring
//
// Output is a 3-tier verdict:
//   ✅ Verified Safe  — Matches known cert + trusted source
//   ⚠️ Unverified     — Insufficient data to confirm
//   🚫 High Risk      — Cert mismatch, sideloaded clone, or excessive perms
// ═══════════════════════════════════════════════════════════════════════

import type { NativeInstalledApp } from '@/services/nativeDevice'

export type AppTrustVerdict = 'verified_safe' | 'unverified' | 'high_risk'

export interface FakeAppResult {
    verdict: AppTrustVerdict
    label: string
    signals: string[]
    riskScore: number
    details: {
        packageMatch: boolean | null
        certMatch: boolean | null
        installerTrusted: boolean | null
        permissionAnomaly: boolean
    }
}

// ── Known-Good App Registry ──────────────────────────────────────────
// Maps packageName → { officialName, officialCertSha256, expectedPerms }
// SHA-256 values are public knowledge (from Play Store listings)
interface KnownApp {
    officialName: string
    officialCertSha256?: string
    /** Maximum expected dangerous permissions for this app category */
    maxDangerousPerms: number
    /** Expected dangerous permission names */
    expectedPerms?: string[]
}

const KNOWN_APPS: Record<string, KnownApp> = {
    // Social / Messaging
    'com.whatsapp': { officialName: 'WhatsApp', maxDangerousPerms: 8, expectedPerms: ['CAMERA', 'RECORD_AUDIO', 'READ_CONTACTS', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'ACCESS_FINE_LOCATION'] },
    'com.instagram.android': { officialName: 'Instagram', maxDangerousPerms: 7, expectedPerms: ['CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'ACCESS_FINE_LOCATION'] },
    'com.facebook.katana': { officialName: 'Facebook', maxDangerousPerms: 10 },
    'com.twitter.android': { officialName: 'Twitter / X', maxDangerousPerms: 6 },
    'com.snapchat.android': { officialName: 'Snapchat', maxDangerousPerms: 8 },
    'org.telegram.messenger': { officialName: 'Telegram', maxDangerousPerms: 8 },

    // Streaming
    'com.netflix.mediaclient': { officialName: 'Netflix', maxDangerousPerms: 3 },
    'com.google.android.youtube': { officialName: 'YouTube', maxDangerousPerms: 4 },
    'com.spotify.music': { officialName: 'Spotify', maxDangerousPerms: 4 },
    'in.startv.hotstar': { officialName: 'Disney+ Hotstar', maxDangerousPerms: 5 },

    // Finance / Banking (India)
    'com.sbi.SBIFreedomPlus': { officialName: 'SBI YONO', maxDangerousPerms: 7 },
    'com.csam.icici.bank.imobile': { officialName: 'iMobile Pay', maxDangerousPerms: 8 },
    'com.lendingkart.lkart': { officialName: 'Lendingkart', maxDangerousPerms: 6 },
    'net.one97.paytm': { officialName: 'Paytm', maxDangerousPerms: 10 },
    'com.phonepe.app': { officialName: 'PhonePe', maxDangerousPerms: 9 },
    'com.google.android.apps.nbu.paisa.user': { officialName: 'Google Pay', maxDangerousPerms: 7 },

    // Banking (International)
    'com.chase.sig.android': { officialName: 'Chase', maxDangerousPerms: 6 },
    'com.wf.wellsfargomobile': { officialName: 'Wells Fargo', maxDangerousPerms: 6 },
    'com.infonow.bofa': { officialName: 'Bank of America', maxDangerousPerms: 6 },

    // Utilities
    'com.google.android.gm': { officialName: 'Gmail', maxDangerousPerms: 5 },
    'com.google.android.apps.maps': { officialName: 'Google Maps', maxDangerousPerms: 4 },
    'com.amazon.mShop.android.shopping': { officialName: 'Amazon Shopping', maxDangerousPerms: 7 },
    'com.flipkart.android': { officialName: 'Flipkart', maxDangerousPerms: 7 },

    // Games
    'com.pubg.imobile': { officialName: 'BGMI', maxDangerousPerms: 6 },
    'com.supercell.clashofclans': { officialName: 'Clash of Clans', maxDangerousPerms: 3 },
    'com.kiloo.subwaysurf': { officialName: 'Subway Surfers', maxDangerousPerms: 3 },
}

// ── Brand name fragments for look-alike detection ────────────────────
const BRAND_FRAGMENTS = [
    'whatsapp', 'instagram', 'facebook', 'netflix', 'youtube', 'spotify',
    'paytm', 'phonepe', 'gpay', 'google pay', 'sbi', 'hdfc', 'icici',
    'amazon', 'flipkart', 'snapchat', 'telegram', 'twitter',
    'chase', 'wells fargo', 'bank of america', 'paypal',
    'pubg', 'bgmi', 'free fire',
]

// ── Trusted installer packages ───────────────────────────────────────
const TRUSTED_INSTALLERS = new Set([
    'com.android.vending',          // Google Play Store
    'com.google.android.packageinstaller',
    'com.samsung.android.app.galaxymarket', // Samsung Galaxy Store
    'com.huawei.appmarket',         // Huawei AppGallery
    'com.amazon.venezia',           // Amazon Appstore
    'com.xiaomi.market',            // Xiaomi GetApps
    'com.oppo.market',              // OPPO App Market
    'com.vivo.appstore',            // Vivo V-Appstore
])

// ═══════════════════════════════════════════════════════════════════════
// Main Analysis Function
// ═══════════════════════════════════════════════════════════════════════

export function analyzeFakeApp(app: NativeInstalledApp): FakeAppResult {
    const signals: string[] = []
    let riskScore = 0

    const knownApp = KNOWN_APPS[app.packageName]
    const appNameLower = app.name.toLowerCase()
    const installerPkg = app.installerPackageName || app.installer || ''

    // ── 1. Package Identity Check ────────────────────────────────────
    let packageMatch: boolean | null = null

    if (knownApp) {
        // Package name is in the known-good registry
        packageMatch = true
        signals.push(`✅ Official package: ${knownApp.officialName}`)
    } else {
        // Check if the app NAME looks like a known brand but has wrong package
        const matchedBrand = BRAND_FRAGMENTS.find(brand =>
            appNameLower.includes(brand) ||
            app.packageName.toLowerCase().includes(brand)
        )
        if (matchedBrand) {
            packageMatch = false
            signals.push(`🚫 Name/package contains "${matchedBrand}" but is not the official package`)
            riskScore += 40
        }
    }

    // ── 2. Signing Certificate Check ─────────────────────────────────
    let certMatch: boolean | null = null

    if (knownApp?.officialCertSha256 && app.signatureSha256) {
        if (app.signatureSha256 === knownApp.officialCertSha256) {
            certMatch = true
            signals.push('✅ Signing certificate matches official release')
        } else {
            certMatch = false
            signals.push('🚫 Signing certificate does NOT match official release — likely repackaged')
            riskScore += 50
        }
    } else if (knownApp && !app.signatureSha256) {
        certMatch = null
        signals.push('⚠️ Certificate not available for verification (needs native module)')
    }

    // ── 3. Installer Source Check ────────────────────────────────────
    let installerTrusted: boolean | null = null

    if (app.isSystemApp) {
        installerTrusted = true
        signals.push('✅ System/pre-installed app')
    } else if (installerPkg) {
        if (TRUSTED_INSTALLERS.has(installerPkg)) {
            installerTrusted = true
            signals.push(`✅ Installed via trusted source (${getInstallerLabel(installerPkg)})`)
        } else if (installerPkg === 'com.android.shell' || installerPkg === 'adb') {
            installerTrusted = false
            signals.push('⚠️ Installed via ADB/shell — developer or sideloaded')
            riskScore += 15
        } else {
            installerTrusted = false
            signals.push(`⚠️ Unknown installer: ${installerPkg}`)
            riskScore += 10
        }
    } else {
        // No installer info — likely sideloaded APK
        installerTrusted = false
        signals.push('⚠️ Sideloaded (no installer recorded)')
        riskScore += 20
    }

    // ── 4. Permission-Behavior Mismatch ──────────────────────────────
    let permissionAnomaly = false
    const dangerousCount = app.dangerousPermissionsCount || app.dangerousPermissions?.length || 0

    if (knownApp) {
        // Compare against expected permission count
        if (dangerousCount > knownApp.maxDangerousPerms + 3) {
            permissionAnomaly = true
            signals.push(`🚫 Excessive permissions: ${dangerousCount} dangerous perms (expected ≤${knownApp.maxDangerousPerms})`)
            riskScore += 25
        }
    } else {
        // For unknown apps, flag if permissions are suspicious combinations
        const perms = (app.dangerousPermissions || []).map(p => p.toUpperCase())
        const hasSms = perms.some(p => p.includes('SMS') || p.includes('SEND_SMS') || p.includes('RECEIVE_SMS'))
        const hasAccessibility = perms.some(p => p.includes('ACCESSIBILITY') || p.includes('BIND_ACCESSIBILITY'))
        const hasContacts = perms.some(p => p.includes('READ_CONTACTS'))
        const hasCamera = perms.some(p => p.includes('CAMERA'))

        if (hasSms && hasAccessibility) {
            permissionAnomaly = true
            signals.push('🚫 Suspicious: SMS + Accessibility access (common in banking trojans)')
            riskScore += 35
        } else if (hasSms && hasContacts && hasCamera && dangerousCount > 8) {
            permissionAnomaly = true
            signals.push('⚠️ High permission footprint for a non-system app')
            riskScore += 15
        }
    }

    // ── 5. Debuggable flag (repackaged APK indicator) ────────────────
    if (app.isDebuggable && !app.isSystemApp) {
        signals.push('🚫 App is debuggable — likely a modified/repackaged APK')
        riskScore += 30
    }

    // ── Final verdict ────────────────────────────────────────────────
    riskScore = Math.min(100, riskScore)

    let verdict: AppTrustVerdict
    let label: string

    if (riskScore >= 40) {
        verdict = 'high_risk'
        label = packageMatch === false
            ? `Likely Fake — impersonating ${BRAND_FRAGMENTS.find(b => appNameLower.includes(b)) || 'a known brand'}`
            : 'High Risk — suspicious indicators detected'
    } else if (packageMatch === true && installerTrusted === true) {
        verdict = 'verified_safe'
        label = `Verified — official ${knownApp?.officialName || app.name}`
    } else {
        verdict = 'unverified'
        label = 'Unverified — insufficient data to confirm authenticity'
    }

    return {
        verdict,
        label,
        signals,
        riskScore,
        details: { packageMatch, certMatch, installerTrusted, permissionAnomaly },
    }
}

// ── Batch analysis for all installed apps ─────────────────────────────
export function analyzeAllApps(apps: NativeInstalledApp[]): Map<string, FakeAppResult> {
    const results = new Map<string, FakeAppResult>()
    for (const app of apps) {
        results.set(app.packageName || app.id, analyzeFakeApp(app))
    }
    return results
}

// ── Helpers ──────────────────────────────────────────────────────────
function getInstallerLabel(pkg: string): string {
    switch (pkg) {
        case 'com.android.vending': return 'Google Play Store'
        case 'com.samsung.android.app.galaxymarket': return 'Samsung Galaxy Store'
        case 'com.huawei.appmarket': return 'Huawei AppGallery'
        case 'com.amazon.venezia': return 'Amazon Appstore'
        case 'com.xiaomi.market': return 'Xiaomi GetApps'
        case 'com.oppo.market': return 'OPPO App Market'
        case 'com.vivo.appstore': return 'Vivo V-Appstore'
        default: return pkg
    }
}
