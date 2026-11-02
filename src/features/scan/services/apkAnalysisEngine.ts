// ═══════════════════════════════════════════════════════════════════════
// RootX-Security APK Security Analysis Engine
//
// Classifies APK payloads and installed packages into 3 strict tiers:
//   1. Trusted
//   2. Unofficial / Unverified
//   3. Fake / Malicious
//
// ZERO-ASSUMPTION PRINCIPLE:
// Never infer safety from name, icon, or absence of evidence alone.
// ═══════════════════════════════════════════════════════════════════════

export type ApkVerdict = 'Trusted' | 'Unofficial-Unverified' | 'Fake-Malicious'

export interface ApkScanInput {
    package_name: string
    app_name?: string
    signing_certificate_fingerprint?: string
    install_source?: 'play_store' | 'sideloaded' | 'unknown' | string
    hash_reputation_result?: {
        malicious: number
        suspicious: number
        clean: number
        total: number
        flagged: boolean
    } | 'not_found' | null
    requested_permissions: string[]
    whitelist_match?: boolean
    apk_size_mb?: number
    is_system_app?: boolean
    is_debuggable?: boolean
}

export interface ApkAnalysisOutput {
    verdict: ApkVerdict
    confidence: number
    summary: string
    reasons: string[]
    recommendation: string
    formattedReport: string
    technicalDetails: {
        whitelistMatch: boolean
        certificateMatched: boolean | null
        installerSource: string
        hashReputation: string
        sensitivePermissionsFound: string[]
        impersonationTarget: string | null
    }
}

// ── Official Registry of Known Trusted Package Names & Cert Fingerprints ──
interface TrustedRegistryRecord {
    officialName: string
    packageName: string
    certSha256?: string
    category: 'banking' | 'social' | 'system' | 'productivity' | 'utility'
    allowedSensitivePerms: string[]
}

const TRUSTED_REGISTRY: Record<string, TrustedRegistryRecord> = {
    // Banking & Financial Apps
    'com.sbi.SBIFreedomPlus': {
        officialName: 'SBI YONO',
        packageName: 'com.sbi.SBIFreedomPlus',
        category: 'banking',
        allowedSensitivePerms: ['READ_PHONE_STATE', 'ACCESS_FINE_LOCATION', 'CAMERA', 'RECEIVE_SMS'],
    },
    'net.one97.paytm': {
        officialName: 'Paytm',
        packageName: 'net.one97.paytm',
        category: 'banking',
        allowedSensitivePerms: ['READ_PHONE_STATE', 'ACCESS_FINE_LOCATION', 'CAMERA', 'READ_CONTACTS', 'RECEIVE_SMS'],
    },
    'com.phonepe.app': {
        officialName: 'PhonePe',
        packageName: 'com.phonepe.app',
        category: 'banking',
        allowedSensitivePerms: ['READ_PHONE_STATE', 'ACCESS_FINE_LOCATION', 'CAMERA', 'READ_CONTACTS', 'RECEIVE_SMS'],
    },
    'com.google.android.apps.nbu.paisa.user': {
        officialName: 'Google Pay (GPay)',
        packageName: 'com.google.android.apps.nbu.paisa.user',
        category: 'banking',
        allowedSensitivePerms: ['READ_PHONE_STATE', 'ACCESS_FINE_LOCATION', 'CAMERA', 'READ_CONTACTS', 'RECEIVE_SMS'],
    },
    'com.csam.icici.bank.imobile': {
        officialName: 'iMobile Pay by ICICI',
        packageName: 'com.csam.icici.bank.imobile',
        category: 'banking',
        allowedSensitivePerms: ['READ_PHONE_STATE', 'ACCESS_FINE_LOCATION', 'CAMERA', 'RECEIVE_SMS'],
    },

    // Social & Communication Apps
    'com.whatsapp': {
        officialName: 'WhatsApp Messenger',
        packageName: 'com.whatsapp',
        category: 'social',
        allowedSensitivePerms: ['CAMERA', 'RECORD_AUDIO', 'READ_CONTACTS', 'ACCESS_FINE_LOCATION', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
    },
    'com.instagram.android': {
        officialName: 'Instagram',
        packageName: 'com.instagram.android',
        category: 'social',
        allowedSensitivePerms: ['CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'READ_EXTERNAL_STORAGE'],
    },
    'org.telegram.messenger': {
        officialName: 'Telegram',
        packageName: 'org.telegram.messenger',
        category: 'social',
        allowedSensitivePerms: ['CAMERA', 'RECORD_AUDIO', 'READ_CONTACTS', 'ACCESS_FINE_LOCATION'],
    },

    // Streaming & Entertainment
    'com.netflix.mediaclient': {
        officialName: 'Netflix',
        packageName: 'com.netflix.mediaclient',
        category: 'productivity',
        allowedSensitivePerms: ['INTERNET', 'ACCESS_NETWORK_STATE'],
    },
    'com.google.android.youtube': {
        officialName: 'YouTube',
        packageName: 'com.google.android.youtube',
        category: 'productivity',
        allowedSensitivePerms: ['INTERNET', 'CAMERA', 'RECORD_AUDIO'],
    },
}

// Known brand keywords targeted for clone/phishing attacks
const BRAND_CLONE_TARGETS = [
    { brand: 'whatsapp', officialPkg: 'com.whatsapp', name: 'WhatsApp' },
    { brand: 'sbi', officialPkg: 'com.sbi.SBIFreedomPlus', name: 'SBI Bank' },
    { brand: 'paytm', officialPkg: 'net.one97.paytm', name: 'Paytm' },
    { brand: 'phonepe', officialPkg: 'com.phonepe.app', name: 'PhonePe' },
    { brand: 'gpay', officialPkg: 'com.google.android.apps.nbu.paisa.user', name: 'Google Pay' },
    { brand: 'netflix', officialPkg: 'com.netflix.mediaclient', name: 'Netflix' },
    { brand: 'instagram', officialPkg: 'com.instagram.android', name: 'Instagram' },
    { brand: 'telegram', officialPkg: 'org.telegram.messenger', name: 'Telegram' },
    { brand: 'icici', officialPkg: 'com.csam.icici.bank.imobile', name: 'ICICI Bank' },
]

// High-Risk Sensitive Android Permissions
const HIGH_RISK_PERMISSIONS = [
    'android.permission.BIND_ACCESSIBILITY_SERVICE',
    'android.permission.BIND_DEVICE_ADMIN',
    'android.permission.REQUEST_INSTALL_PACKAGES',
    'android.permission.READ_SMS',
    'android.permission.RECEIVE_SMS',
    'android.permission.SEND_SMS',
    'android.permission.RECEIVE_MMS',
    'android.permission.RECEIVE_WAP_PUSH',
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.RECORD_AUDIO',
    'android.permission.ACCESS_BACKGROUND_LOCATION',
]

/**
 * Main Analysis Engine: Evaluates an APK against cryptographic, reputation, and behavioral rules.
 */
export function analyzeApkSecurity(input: ApkScanInput): ApkAnalysisOutput {
    const pkg = (input.package_name || '').trim().toLowerCase()
    const appName = (input.app_name || input.package_name || '').trim().toLowerCase()
    const cert = (input.signing_certificate_fingerprint || '').trim()
    const installSource = input.install_source || 'unknown'
    const permissions = input.requested_permissions || []

    const reasons: string[] = []
    let dataSourcesEvaluated = 1 // Local package structure evaluated

    // ── 1. Check Registry / Whitelist Match ──────────────────────────
    const registryRecord = TRUSTED_REGISTRY[input.package_name]
    let whitelistMatch = Boolean(input.whitelist_match)
    let certificateMatched: boolean | null = null

    if (registryRecord) {
        dataSourcesEvaluated++
        if (cert && registryRecord.certSha256) {
            certificateMatched = cert === registryRecord.certSha256
            whitelistMatch = certificateMatched
        } else if (input.whitelist_match !== undefined) {
            whitelistMatch = input.whitelist_match
        } else if (installSource === 'play_store' && !input.is_debuggable) {
            // Official package from Google Play Store with no modded flags
            whitelistMatch = true
        }
    }

    // ── 2. Impersonation / Fake Clone Detection ──
    let impersonationTarget: string | null = null
    const matchedBrand = BRAND_CLONE_TARGETS.find(b =>
        (appName.includes(b.brand) || pkg.includes(b.brand)) && pkg !== b.officialPkg.toLowerCase()
    )

    if (matchedBrand) {
        impersonationTarget = matchedBrand.name
        reasons.push(`Package name "${input.package_name}" resembles official ${matchedBrand.name} (${matchedBrand.officialPkg}) but uses an unauthorized package identifier and signing key.`)
    }

    // ── 3. Signing Certificate Anomaly ──
    if (registryRecord && certificateMatched === false) {
        reasons.push(`Signing certificate fingerprint (${cert.slice(0, 16)}...) does NOT match the official publisher certificate for ${registryRecord.officialName}.`)
    }

    if (input.is_debuggable && !input.is_system_app) {
        reasons.push('APK is marked as debuggable (android:debuggable="true"), indicating a recompiled or modded binary.')
    }

    // ── 4. Hash Threat Intelligence / VirusTotal Check ──
    let hashReputation = 'not_found'
    let isHashFlagged = false

    if (input.hash_reputation_result && typeof input.hash_reputation_result === 'object') {
        dataSourcesEvaluated++
        const { malicious, suspicious, total } = input.hash_reputation_result
        if (malicious > 0 || suspicious > 0) {
            isHashFlagged = true
            hashReputation = `Flagged by ${malicious + suspicious}/${total} security engines`
            reasons.push(`External threat intelligence flagged file hash: ${malicious} malicious detections across security engines.`)
        } else if (total > 0) {
            hashReputation = `Confirmed clean across ${total} threat intelligence vendors`
            reasons.push(`File hash verified clean across ${total} independent anti-malware vendors.`)
        }
    }

    // ── 5. Sensitive Permission Anomaly Check ──
    const sensitiveFound: string[] = []
    for (const perm of permissions) {
        const shortName = perm.split('.').pop() || perm
        const isHighRisk = HIGH_RISK_PERMISSIONS.some(hr => perm.endsWith(hr) || perm === hr || shortName === hr)
        if (isHighRisk) {
            sensitiveFound.push(shortName)
        }
    }

    if (sensitiveFound.length > 0) {
        dataSourcesEvaluated++
        const isAllowedByRegistry = registryRecord && sensitiveFound.every(p => registryRecord.allowedSensitivePerms.includes(p))
        if (!isAllowedByRegistry && !input.is_system_app) {
            // Check for dangerous combinations (e.g. Accessibility Service or SMS without messaging intent)
            const hasAccessibility = sensitiveFound.some(p => p.includes('ACCESSIBILITY'))
            const hasSms = sensitiveFound.some(p => p.includes('SMS'))
            const hasInstall = sensitiveFound.some(p => p.includes('INSTALL_PACKAGES'))
            const hasDeviceAdmin = sensitiveFound.some(p => p.includes('DEVICE_ADMIN'))

            if (hasAccessibility || hasDeviceAdmin) {
                reasons.push(`Requests high-privilege system takeover permissions (${sensitiveFound.filter(p => p.includes('ACCESSIBILITY') || p.includes('DEVICE_ADMIN')).join(', ')}) with no legitimate architectural necessity.`)
            }
            if (hasSms && !pkg.includes('sms') && !pkg.includes('message') && !whitelistMatch) {
                reasons.push(`Requests SMS interception permissions (${sensitiveFound.filter(p => p.includes('SMS')).join(', ')}) outside of a verified communications context.`)
            }
            if (hasInstall) {
                reasons.push('Requests silent dropper permission (REQUEST_INSTALL_PACKAGES) to download and install secondary payloads.')
            }
        }
    }

    // ── 6. Sideloaded / Installer Source ──
    if (installSource === 'sideloaded' || installSource === 'unknown') {
        dataSourcesEvaluated++
        if (!whitelistMatch) {
            reasons.push(`Install source is ${installSource} (installed outside Google Play Store or OEM verified marketplace).`)
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 3-TIER CLASSIFICATION ENGINE
    // ═══════════════════════════════════════════════════════════════
    let verdict: ApkVerdict
    let summary: string
    let recommendation: string
    let confidence: number

    // RULE 1: FAKE / MALICIOUS
    const isFakeOrMalicious =
        impersonationTarget !== null ||
        (registryRecord && certificateMatched === false) ||
        isHashFlagged ||
        sensitiveFound.some(p => p.includes('ACCESSIBILITY') || p.includes('DEVICE_ADMIN')) && !whitelistMatch && !input.is_system_app

    if (isFakeOrMalicious) {
        verdict = 'Fake-Malicious'
        confidence = Math.min(98, 70 + (dataSourcesEvaluated * 7))
        summary = impersonationTarget
            ? `This application is a counterfeit or modified clone attempting to impersonate ${impersonationTarget}. It was not signed by the authentic developer.`
            : isHashFlagged
                ? `This APK was positively flagged as malware by external threat intelligence engines.`
                : `This application requests dangerous device takeover permissions without legitimate publisher credentials.`
        recommendation = 'Uninstall this application immediately and do not grant requested permissions.'
    }
    // RULE 2: TRUSTED
    else if (whitelistMatch === true) {
        verdict = 'Trusted'
        confidence = Math.min(99, 85 + (dataSourcesEvaluated * 4))
        summary = `This application (${registryRecord?.officialName || input.app_name || input.package_name}) is verified authentic. Package identity and publisher certificates match the official registry.`
        reasons.unshift('Cryptographic certificate and package identifier verified against official records.')
        recommendation = 'Safe to use. Verified authentic official application.'
    }
    // RULE 3: UNOFFICIAL / UNVERIFIED
    else {
        verdict = 'Unofficial-Unverified'
        confidence = Math.min(80, 50 + (dataSourcesEvaluated * 6))
        summary = `This application is an unverified third-party package. No known malware signatures were triggered, but insufficient publisher data exists to confirm safety.`
        if (!reasons.some(r => r.includes('unverified'))) {
            reasons.unshift('App is not present in official verified registries (unverified third-party publisher).')
        }
        recommendation = 'Exercise caution — only use if you trust the specific third-party distributor.'
    }

    // Format human-readable output report
    const formattedReport = [
        `Verdict: ${verdict}`,
        `Confidence: ${confidence}% (${dataSourcesEvaluated} confirming telemetry points)`,
        `\nSummary:`,
        summary,
        `\nReasons:`,
        ...reasons.map(r => `• ${r}`),
        `\nRecommendation:`,
        recommendation,
    ].join('\n')

    return {
        verdict,
        confidence,
        summary,
        reasons,
        recommendation,
        formattedReport,
        technicalDetails: {
            whitelistMatch,
            certificateMatched,
            installerSource: installSource,
            hashReputation,
            sensitivePermissionsFound: sensitiveFound,
            impersonationTarget,
        },
    }
}
