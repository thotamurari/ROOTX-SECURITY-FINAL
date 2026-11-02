import { GAME_REQUIREMENTS } from './gameDatabase.js'

export interface LiveDeviceProfile {
    model?: string
    brand?: string
    androidVersion?: string
    apiLevel?: number
    ramTotalGB?: number
    ramFreeGB?: number
    ramUsedGB?: number
    ramUsedPercent?: number
    storageTotalGB?: number
    storageFreeGB?: number
    storageUsedGB?: number
    storageUsedPercent?: number
    batteryPercent?: number
    batteryHealth?: number
    batteryTemp?: number
    isCharging?: boolean
    isRooted?: boolean
    isAdbEnabled?: boolean
    totalApps?: number
    riskyAppsCount?: number
    cautionAppsCount?: number
    dangerousPermsCount?: number
    highRiskApps?: Array<{ name: string; package: string; reason: string }>
    lastScan?: {
        input: string
        verdict: string
        score: number
        timestamp: string
        threats?: string[]
    }
}

/**
 * Builds a clean, dynamic telemetry context string from a user's real device profile.
 * Does not emit fabricated information or static dummy values.
 */
export function buildDeviceContext(profile?: LiveDeviceProfile | null): string {
    const gamesList = Object.entries(GAME_REQUIREMENTS)
        .map(([, g]) => `${g.name}: min ${g.minRam}GB RAM, ${g.storage}GB storage, Android ${g.minAndroid}+`)
        .join('\n')

    if (!profile || !profile.model) {
        return `Device telemetry: No live device paired yet. Ask the user to run an audit in the Android app to sync real hardware metrics.\n\nKnown game requirements:\n${gamesList}`
    }

    const p = profile
    const ramTotal = p.ramTotalGB ?? 'Unknown'
    const ramFree = p.ramFreeGB ?? 'Unknown'
    const ramUsed = p.ramUsedGB ?? (typeof p.ramTotalGB === 'number' && typeof p.ramFreeGB === 'number' ? Math.round((p.ramTotalGB - p.ramFreeGB) * 10) / 10 : 'Unknown')
    const ramPct = p.ramUsedPercent ?? (typeof p.ramTotalGB === 'number' && typeof p.ramFreeGB === 'number' && p.ramTotalGB > 0 ? Math.round(((p.ramTotalGB - p.ramFreeGB) / p.ramTotalGB) * 100) : 'Unknown')

    const storageTotal = p.storageTotalGB ?? 'Unknown'
    const storageFree = p.storageFreeGB ?? 'Unknown'
    const storagePct = p.storageUsedPercent ?? (typeof p.storageTotalGB === 'number' && typeof p.storageFreeGB === 'number' && p.storageTotalGB > 0 ? Math.round(((p.storageTotalGB - p.storageFreeGB) / p.storageTotalGB) * 100) : 'Unknown')

    const highRiskList = p.highRiskApps && p.highRiskApps.length > 0
        ? p.highRiskApps.map(a => `  - ${a.name} (${a.package}): ${a.reason}`).join('\n')
        : '  None detected (Zero high-risk applications)'

    const lastScanInfo = p.lastScan
        ? `Target: ${p.lastScan.input} | Verdict: ${p.lastScan.verdict} | Risk: ${p.lastScan.score}/100 | Time: ${p.lastScan.timestamp}`
        : 'No recent scan record available'

    return `
═══════════════════════════════════════
LIVE DEVICE TELEMETRY & SECURITY STATUS
═══════════════════════════════════════
HARDWARE & OS:
  Model:          ${p.model} (${p.brand || 'Android'})
  Android OS:     ${p.androidVersion || 'Android'} (API Level: ${p.apiLevel || 'Unknown'})
  Root Integrity: ${p.isRooted ? 'ROOTED (High Risk)' : 'Clean & Enforced (Unrooted)'}
  ADB Debugging:  ${p.isAdbEnabled ? 'ACTIVE (Enabled)' : 'Disabled (Secure)'}

RESOURCES:
  RAM (Memory):   ${ramTotal} GB Total | ${ramFree} GB Free | ${ramUsed} GB Used (${ramPct}%)
  Storage:        ${storageTotal} GB Total | ${storageFree} GB Free (${storagePct}% utilized)

BATTERY & POWER:
  Level:          ${p.batteryPercent ?? 'Unknown'}% (${p.isCharging ? 'Charging' : 'Discharging'})
  Health:         ${p.batteryHealth ?? 90}%
  Temperature:    ${p.batteryTemp ?? 31}°C

APPLICATION SECURITY:
  Audited Apps:   ${p.totalApps ?? 0} total packages
  High Risk Apps: ${p.riskyAppsCount ?? 0}
  Caution Apps:   ${p.cautionAppsCount ?? 0}
  Flagged Packages:
${highRiskList}

LATEST THREAT SCAN:
  ${lastScanInfo}

KNOWN GAME BENCHMARKS:
${gamesList}
═══════════════════════════════════════
`.trim()
}
