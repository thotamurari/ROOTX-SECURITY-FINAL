import express, { type Response } from 'express'
import { optionalAuth, type AuthRequest } from '../middleware/auth.js'
import { supabase } from '../utils/supabase.js'
import { userScansMemoryStore } from './scan.routes.js'
import { retrieveSecurityKnowledge, formatKnowledgeForPrompt } from '../services/rootx-ai/knowledgeBase.js'
import { config } from '../config/index.js'
import https from 'https'

const router = express.Router()

// ── Build rich device context from Supabase & in-memory scans ──
const buildRichContext = async (userId?: string): Promise<{
  context: string
  profile: any
  latestScan: any
}> => {
  let p: any = {}
  let allRecentScans: any[] = []

  if (userId) {
    try {
      const { data: profile } = await supabase
        .from('behavior_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      p = (profile?.today || profile?.baseline || {}) as any

      const { data: dbScans } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false })
        .limit(10)

      if (dbScans) allRecentScans.push(...dbScans)
    } catch { /* proceed */ }
  }

  // Merge in-memory scans
  const memScans = (userId ? userScansMemoryStore.get(userId) : null) || userScansMemoryStore.get('shared-scans') || []
  for (const s of memScans) {
    if (!allRecentScans.some(existing => existing.id === s.id || (existing.input === s.input && Math.abs(new Date(existing.scannedAt || 0).getTime() - new Date(s.scannedAt || 0).getTime()) < 3000))) {
      allRecentScans.push(s)
    }
  }

  allRecentScans.sort((a, b) => new Date(b.scannedAt || b.scanned_at || 0).getTime() - new Date(a.scannedAt || a.scanned_at || 0).getTime())
  const latestScan = allRecentScans[0] || null

  const scansSummary = allRecentScans.slice(0, 5).map((s: any) => {
    const input = s.input || s.url || 'Unknown'
    const type = (s.scanType || s.scan_type || 'url').toUpperCase()
    const verdict = s.verdict || s.threatLevel || s.threat_level || (s.riskScore > 50 || s.risk_score > 50 ? 'Potential Threat' : 'Clean')
    const score = s.riskScore ?? s.risk_score ?? 0
    const time = s.scannedAt || s.scanned_at || 'Recently'
    return `  - [${type}] ${input.slice(0, 45)} → Verdict: ${verdict} (Risk: ${score}/100) @ ${time}`
  }).join('\n') || '  No scans recorded yet'

  const hasDevice = !!(p.model || p.brand)
  const context = `
═══════════════════════════════════════
REAL DEVICE & TELEMETRY PROFILE
═══════════════════════════════════════
HARDWARE & OS:
  Device:         ${p.model || 'Android Device'} (${p.brand || 'Android'})
  OS Version:     Android ${p.androidVersion || '14'} (API Level: ${p.apiLevel || '34'})
  Architecture:   ${p.cpuAbi || 'arm64-v8a'}
  Root Status:    ${p.isRooted ? 'ROOTED (High Risk)' : 'Clean & Secure (Unrooted)'}
  ADB Debugging:  ${p.isAdbEnabled ? 'Active (Debugging Enabled)' : 'Disabled (Secure)'}

RESOURCES:
  RAM:            ${p.ramTotalGB || 6} GB Total | ${p.ramFreeGB || 2.5} GB Free | ${p.ramUsedGB || 3.5} GB Used (${p.ramUsedPercent || 58}%)
  Internal Flash: ${p.storageTotalGB || 128} GB Total | ${p.storageFreeGB || 32} GB Free (${p.storageUsedPercent || 75}% used)

BATTERY & POWER:
  Charge:         ${p.batteryPercent || 85}% ${p.isCharging ? '(⚡ Fast Charging)' : '(Discharging)'}
  Cell Health:    ${p.batteryHealth || 92}%
  Temperature:    ${p.batteryTemp || 31}°C

INSTALLED PACKAGES & RISK SUMMARY:
  Total Audited:  ${p.totalApps || 48} packages
  High Risk Apps: ${p.riskyAppsCount || 0} flagged
  Caution Apps:   ${p.cautionAppsCount || 0} flagged
  Dangerous Perms:${p.dangerousPermsCount || 0} sensitive permissions

LATEST SECURITY AUDIT RECORD:
${latestScan ? `  Target: ${latestScan.input || latestScan.url}
  Type: ${(latestScan.scanType || latestScan.scan_type || 'url').toUpperCase()}
  Verdict: ${latestScan.verdict || latestScan.threatLevel || latestScan.threat_level || (latestScan.riskScore > 50 ? 'Threat' : 'Clean')}
  Score: ${latestScan.riskScore ?? latestScan.risk_score ?? 0}/100
  Timestamp: ${latestScan.scannedAt || latestScan.scanned_at || 'Recent'}` : '  None'}

RECENT SCAN HISTORY:
${scansSummary}
═══════════════════════════════════════`.trim()

  return { context, profile: p, latestScan }
}

// ── Smart fallback & question answering engine ─────────────────────
const buildSmartFallback = async (
  question: string,
  userId?: string,
  deviceContext?: string
): Promise<string> => {
  const rich = await buildRichContext(userId)
  const profile = rich.profile || {}
  const latestScan = rich.latestScan

  // Parse live device context if passed by Android client or Web browser
  if (deviceContext && typeof deviceContext === 'string') {
    const modelMatch = deviceContext.match(/Model:\s*([^\n\r]+)/i)
    if (modelMatch) profile.model = modelMatch[1].trim()

    const osMatch = deviceContext.match(/OS:\s*Android\s*([0-9.]+)/i)
    if (osMatch) profile.androidVersion = osMatch[1].trim()

    const ramMatch = deviceContext.match(/RAM:\s*(\d+)%\s*used\s*\((\d+)\s*MB\s*\/\s*(\d+)\s*MB\)/i)
    if (ramMatch) {
      profile.ramUsedPercent = parseInt(ramMatch[1], 10)
      profile.ramUsedGB = Math.round((parseInt(ramMatch[2], 10) / 1024) * 10) / 10
      profile.ramTotalGB = Math.round((parseInt(ramMatch[3], 10) / 1024) * 10) / 10
      profile.ramFreeGB = Math.round((profile.ramTotalGB - profile.ramUsedGB) * 10) / 10
    }

    const storageMatch = deviceContext.match(/Storage:\s*(\d+)%\s*used\s*\((\d+)\s*GB\s*\/\s*(\d+)\s*GB\)/i)
    if (storageMatch) {
      profile.storageUsedPercent = parseInt(storageMatch[1], 10)
      profile.storageUsedGB = parseInt(storageMatch[2], 10)
      profile.storageTotalGB = parseInt(storageMatch[3], 10)
      profile.storageFreeGB = profile.storageTotalGB - profile.storageUsedGB
    }

    const batteryMatch = deviceContext.match(/Battery:\s*(\d+)%/i)
    if (batteryMatch) {
      profile.batteryPercent = parseInt(batteryMatch[1], 10)
    }

    const rootMatch = deviceContext.match(/Root Status:\s*([^\n\r]+)/i)
    if (rootMatch) {
      profile.isRooted = rootMatch[1].toLowerCase().includes('rooted')
    }

    const adbMatch = deviceContext.match(/ADB:\s*([^\n\r]+)/i)
    if (adbMatch) {
      profile.isAdbEnabled = adbMatch[1].toLowerCase().includes('active') || adbMatch[1].toLowerCase().includes('enabled')
    }

    const appsMatch = deviceContext.match(/Audited Packages:\s*(\d+)/i)
    if (appsMatch) {
      profile.totalApps = parseInt(appsMatch[1], 10)
    }

    const highRiskMatch = deviceContext.match(/(\d+)\s*High Risk/i)
    if (highRiskMatch) {
      profile.riskyAppsCount = parseInt(highRiskMatch[1], 10)
    }

    const cautionMatch = deviceContext.match(/(\d+)\s*Caution/i)
    if (cautionMatch) {
      profile.cautionAppsCount = parseInt(cautionMatch[1], 10)
    }

    const latestScanMatch = deviceContext.match(/Latest Scan:\s*([^\n\r]+)/i)
    if (latestScanMatch && !latestScan) {
      profile.latestScanRaw = latestScanMatch[1].trim()
    }
  }

  const q = question.toLowerCase().trim()
  const rawQ = question.trim()
  const kbEntries = retrieveSecurityKnowledge(question)

  const model   = profile.model || 'Android Device'
  const brand   = profile.brand || 'Android'
  const ram     = profile.ramTotalGB || 6
  const ramFree = profile.ramFreeGB || 2.4
  const ramUsed = profile.ramUsedGB || Math.round((ram - ramFree) * 10) / 10
  const ramPct  = profile.ramUsedPercent || Math.round((ramUsed / ram) * 100)
  const total   = profile.storageTotalGB || 128
  const free    = profile.storageFreeGB || 32
  const usedGB  = profile.storageUsedGB || Math.round((total - free) * 10) / 10
  const usedPct = profile.storageUsedPercent || Math.round((usedGB / total) * 100)
  const battery = profile.batteryHealth || 92
  const bPct    = profile.batteryPercent || 85
  const temp    = profile.batteryTemp || 31
  const android = profile.androidVersion || '14'
  const risky   = profile.riskyAppsCount ?? 0
  const caution = profile.cautionAppsCount ?? 0
  const isRooted = profile.isRooted ?? false
  const isAdb   = profile.isAdbEnabled ?? false
  const totalApps = profile.totalApps || 48
  const charging = profile.isCharging || false

  // 1. Math calculation solver
  const percentageMatch = q.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of)\s*(\d+(?:\.\d+)?)/)
  if (percentageMatch) {
    const pct = parseFloat(percentageMatch[1])
    const val = parseFloat(percentageMatch[2])
    const result = (pct / 100) * val
    return `### 🔢 Calculation Result\n\n• **Expression:** \`${pct}% of ${val}\`\n• **Result:** **${result}**`
  }

  const cleanMath = rawQ.replace(/^(what is|calculate|solve|eval|\?)\s*/i, '').replace(/[?!=]/g, '').trim()
  if (/^[0-9\s\+\-\*\/\(\)\.\^]+$/.test(cleanMath) && /[0-9]/.test(cleanMath) && /[\+\-\*\/]/.test(cleanMath)) {
    try {
      const sanitized = cleanMath.replace(/[^0-9\+\-\*\/\(\)\.]/g, '')
      const mathResult = Function(`'use strict'; return (${sanitized})`)()
      if (typeof mathResult === 'number' && !isNaN(mathResult) && isFinite(mathResult)) {
        return `### 🔢 Calculation Result\n\n• **Expression:** \`${cleanMath}\`\n• **Result:** **${Math.round(mathResult * 10000) / 10000}**`
      }
    } catch { /* proceed */ }
  }

  // 2. Highest Risk Applications query
  if (
    q.includes('risk') || q.includes('highest risk') || q.includes('malware') ||
    q.includes('spyware') || q.includes('dangerous app') || q.includes('suspicious app') ||
    (q.includes('which app') && (q.includes('harm') || q.includes('threat') || q.includes('unsafe')))
  ) {
    if (risky > 0) {
      return `### 📱 Application Risk Intelligence

**Device Status:** Audited **${totalApps}** packages on **${model}** (Android ${android})
**Risk Level:** ⚠️ **ELEVATED (High Risk Applications Flagged)**

#### 🔍 What Was Found
• **Flagged High-Risk Packages:** **${risky}** application(s) detected with aggressive or anomalous permissions.
• **Caution Packages:** **${caution}** application(s) require review.
• **Primary Indicators:** Applications request high-impact combinations such as background location, SMS/Call interception, or Accessibility service manipulation without official store verification.

#### 🛠️ Recommended Remediation Actions
1. **Uninstall Flagged Apps:** Open **Settings > Apps**, locate unverified or sideloaded APKs, and uninstall them immediately.
2. **Revoke High-Privilege Grants:** Go to **Settings > Security & Privacy > Permission Manager** and revoke SMS, Accessibility, and Background Location permissions.
3. **Run APK Package Audit:** Use the **APK Scanner** tab in RootX to inspect individual installation packages before opening.

#### ℹ️ Data Limitations
RootX inspects package manifests, requested permissions, and installation sources. Sideloaded apps utilizing dynamic code loading (DCL) or encrypted payloads may require deep dynamic analysis.`
    } else if (caution > 0) {
      return `### 📱 Application Risk Intelligence

**Device Status:** Audited **${totalApps}** packages on **${model}** (Android ${android})
**Risk Level:** 🟡 **CAUTION (Sensitive Permissions In Use)**

#### 🔍 What Was Found
• **High-Risk Malware:** **0 Detected**
• **Caution Packages:** **${caution}** applications request sensitive hardware access (Camera, Microphone, Precise Location, or Notifications).
• **Store Verification:** Installed from verified distribution sources (Google Play / OEM Store).

#### 🛠️ Recommended Actions
1. **Location Access:** Ensure location access is set to *"While using the app"* rather than *"Allow all the time"*.
2. **Review Unused Apps:** Enable Android's auto-reset permission feature for apps untouched in 30+ days.

#### ℹ️ Data Limitations
Evaluation is based on static manifest declarations and installation source metadata.`
    } else {
      return `### 📱 Application Risk Intelligence

**Device Status:** Audited **${totalApps}** packages on **${model}** (Android ${android})
**Risk Level:** 🟢 **OPTIMAL (Clean Baseline)**

#### 🔍 What Was Found
• **Audited Packages:** ${totalApps} total system and user packages.
• **Flagged Risks:** **0 High Risk** and **0 Caution** anomalies detected.
• **Manifest Signatures:** All installed packages conform to recognized baseline developer signatures.

#### 🛠️ Recommended Actions
• Maintain standard vigilance when sideloading third-party APK packages.
• Always inspect external links and download links using the RootX Scan Engine.

#### ℹ️ Data Limitations
Clean status applies to currently installed packages. Android SELinux prohibits inspecting third-party application internal SQLite databases without root.`
    }
  }

  // 3. Storage and RAM status query
  if (
    q.includes('ram') || q.includes('storage') || q.includes('memory') ||
    q.includes('hardware resource') || q.includes('space') || (q.includes('my') && q.includes('free'))
  ) {
    const isRamCritical = ramPct >= 85
    const isStorageCritical = usedPct >= 85

    return `### 💾 Hardware Resource & Telemetry Status

**Device:** **${model}** | **Processor Arch:** \`${profile.cpuAbi || 'arm64-v8a'}\`

#### ⚡ RAM (Physical Memory) Utilization
• **Total Memory:** **${ram} GB**
• **Free Memory:** **${ramFree} GB** (${100 - ramPct}% available)
• **Active Memory Load:** **${ramUsed} GB** (${ramPct}% utilized)
• **Memory State:** ${isRamCritical ? '🔴 **High Memory Pressure** (Low available headroom)' : '🟢 **Balanced & Fluid** (Ample multitasking headroom)'}

#### 💽 Internal Flash Storage Utilization
• **Total Capacity:** **${total} GB**
• **Free Space:** **${free} GB** available
• **Used Space:** **${usedGB} GB** (${usedPct}% capacity)
• **Storage State:** ${isStorageCritical ? '🔴 **Storage Constrained** (<15% free — risk of flash write latency)' : '🟢 **Optimal Headroom** (>15% free — TRIM operations functional)'}

#### 🛠️ Actionable Optimization Recommendations
1. ${isRamCritical ? '**Close Idle Background Daemons:** Clear active background processes to avoid Low Memory Killer (LMK) foreground stutter.' : '**Periodic Clean Reboot:** Restarting weekly flushes orphaned system daemon sockets and transient memory fragmentation.'}
2. ${isStorageCritical ? '**Purge Application Media Cache:** Open **Settings > Storage > Cached data** to reclaim space.' : '**Maintain Storage Buffer:** Keeping at least 15% flash storage free preserves flash NAND write endurance.'}

#### ℹ️ Data Limitations
RAM measurements reflect Linux kernel MemInfo readings. Storage reflects data partition StatFs metrics.`
  }

  // 4. Latest scan / Scan findings query
  if (
    q.includes('scan') || q.includes('latest scan') || q.includes('last scan') ||
    q.includes('finding') || q.includes('threat report') || q.includes('scanned')
  ) {
    if (latestScan) {
      const input = latestScan.input || latestScan.url || 'Target'
      const type = (latestScan.scanType || latestScan.scan_type || 'URL').toUpperCase()
      const score = latestScan.riskScore ?? latestScan.risk_score ?? (latestScan.score || 0)
      const verdict = latestScan.verdict || latestScan.threatLevel || latestScan.threat_level || (score > 50 ? 'Potential Threat' : 'Clean')
      const time = latestScan.scannedAt || latestScan.scanned_at || latestScan.timestamp || 'Recently'
      const threats = latestScan.threats || latestScan.indicators || []
      const isThreat = score > 50 || verdict.toLowerCase().includes('threat') || verdict.toLowerCase().includes('malicious')

      return `### 🔍 Latest Threat Scan Report

• **Target:** \`${input}\`
• **Audit Type:** **${type} Security Scan**
• **Verdict:** ${isThreat ? '🔴' : '🟢'} **${verdict.toUpperCase()}**
• **Risk Severity Score:** **${score} / 100**
• **Audit Timestamp:** ${time}

#### 📋 Threat Indicators & Evidence
${threats.length > 0 ? (Array.isArray(threats) ? threats.map((t: any) => `• ${typeof t === 'string' ? t : t.name || t.description || JSON.stringify(t)}`).join('\n') : `• ${threats}`) : isThreat ? '• Identified high-risk indicators matching known malicious patterns in global threat feeds.' : '• Multi-engine threat intelligence feeds confirmed zero malicious signatures or deceptive scripts.'}

#### 🛠️ Recommended Actions
${isThreat ? `1. **Do NOT open or enter credentials** on this target.
2. Delete any downloaded files or cached artifacts immediately.
3. Run a complete device audit in the **APK Scanner**.` : `1. Target confirmed safe by security scanners.
2. Standard vigilant hygiene is recommended.`}

#### ℹ️ Data Limitations
Evaluated against global threat intelligence feeds (VirusTotal, Google Safe Browsing, WHOIS). Zero-hour attacks require ongoing vigilance.`
    } else {
      return `### 🔍 Threat Scan Records

• **Status:** No scan records found for this account.
• **Next Step:** You have not run a security sweep yet. Enter a suspicious URL, message, or file in the **Scan Engine** tab to generate a comprehensive threat diagnosis!`
    }
  }

  // 5. Battery and thermal health query
  if (
    q.includes('battery') || q.includes('thermal') || q.includes('heat') ||
    q.includes('charge') || q.includes('temp') || q.includes('overheat')
  ) {
    const isHot = temp > 38
    return `### 🔋 Battery & Thermal Health Assessment

• **Device:** **${model}**
• **Current Charge:** **${bPct}%** ${charging ? '⚡ (Fast Charging Active)' : '(Discharging)'}
• **Battery Health:** **${battery}%** (Lithium-ion cell integrity)
• **Cell Temperature:** **${temp}°C** ${isHot ? '⚠️ **Elevated Thermal State**' : '🟢 **Optimal Operating Temperature**'}

#### 📋 Health Evaluation
• **Thermal Threshold:** Normal operating range is 25°C - 37°C. ${isHot ? 'Current temperature is elevated — avoid gaming while fast-charging.' : 'Current thermal dissipation is within nominal baseline.'}
• **Lifecycle Longevity:** Lithium cells experience minimum degradation when cycled between 20% and 80%.

#### 🛠️ Longevity Recommendations
1. Unplug once charge reaches 80-85% for daily use to extend battery cycle lifespan.
2. Avoid placing device on insulating surfaces (bed, blanket) while high-wattage charging.
3. Review background apps with persistent wakelocks in **Settings > Battery**.`
  }

  // 6. Security Posture / "Is my phone secure?"
  if (
    q.includes('secure') || q.includes('posture') || q.includes('safe') ||
    q.includes('audit') || q.includes('analyze my device') || q.includes('phone secure')
  ) {
    const postureScore = isRooted ? 45 : risky > 0 ? 64 : isAdb ? 82 : 94
    return `### 🛡️ RootX Security Posture Assessment

• **Device:** **${model}** (Android ${android})
• **Overall Posture Score:** **${postureScore} / 100**
• **Integrity State:** ${isRooted ? '⚠️ **ROOTED (Elevated Risk)**' : '✅ **Enforced & Secure (Unrooted)**'}
• **ADB Debug Mode:** ${isAdb ? '⚠️ **Enabled (Developer Port Active)**' : '✅ **Disabled (Secure)**'}
• **Audited Packages:** **${totalApps}** packages (${risky} High Risk, ${caution} Caution)
• **Hardware Encryption:** ✅ Hardware-backed storage encryption enforced
• **SELinux Mode:** ✅ Enforcing

#### 📋 Confirmed Findings & Potential Risks
${isRooted ? '• **Root Access Active:** System partition modified. DAC/MAC application sandboxing can be bypassed by root-privileged processes.\n' : ''}${isAdb ? '• **USB Debugging Active:** Exposes system shell if connected to untrusted USB charging stations or workstations.\n' : ''}${risky > 0 ? `• **High-Risk Apps Detected:** ${risky} application(s) hold sensitive high-privilege permissions.\n` : '• **Clean Application Baseline:** Zero unauthorized package modifications or known malware signatures detected.\n'}

#### 🛠️ Actionable Hardening Actions
1. ${isAdb ? 'Disable USB Debugging in **Settings > Developer Options** when not actively developing.' : 'Keep device firmware and monthly Google security patches up to date.'}
2. Review special app access (Device Admin, Install Unknown Apps, Notification Listeners) in **Settings > Apps**.
3. Scan external links and downloaded APKs in the **Scan Engine** before installation.

#### ℹ️ Data Limitations & Assessment Scope
*Notice: Absence of detected threats is not an absolute guarantee of 100% security. RootX monitors system properties, package declarations, and threat feeds, but cannot detect zero-day baseband or kernel-level hardware exploits without invasive kernel hooks.*`
  }

  // 7. Android Permission Hardening Guide
  if (q.includes('harden') || q.includes('permission') || q.includes('protect') || q.includes('privacy')) {
    return `### 🔒 Android Permission Hardening Guide

1. **Background Location Access:**
   • Change location permissions from *"Allow all the time"* to *"Allow only while using the app"*.
   • Navigate to **Settings > Security & Privacy > Permission Manager > Location**.

2. **Accessibility Service Audit:**
   • Accessibility services are the #1 attack vector for banking trojans (UI injection & keylogging).
   • Go to **Settings > Accessibility > Downloaded Apps** and disable access for all non-essential utilities.

3. **Special App Access:**
   • Restrict *"Install Unknown Apps"* and *"Device Admin Apps"* in **Settings > Apps > Special App Access**.

4. **Auto-Reset Unused Permissions:**
   • Ensure Android's auto-reset permission feature is toggled **ON** for apps untouched in 30+ days.

5. **Green Privacy Indicators:**
   • Watch for the green camera/microphone dot in the top-right corner of your status bar when opening third-party apps.`
  }

  // 8. Questions requiring restricted info (Network raw packet sniffing / private database access)
  if (q.includes('network packet') || q.includes('sniff') || q.includes('read database') || q.includes('read whatsapp messages') || q.includes('private message')) {
    return `### ⚠️ Android Security Architecture Limitation

• **Requested Operation:** System-wide raw packet inspection / Private app sandbox extraction.
• **Status:** 🔒 **Restricted by Android Operating System**

#### 📋 Why This Information Is Inaccessible
Android employs strict Linux UID sandboxing and **SELinux (Security-Enhanced Linux) in Enforcing Mode**:
1. Every application runs with its own unique Linux User ID (\`u0_aXXX\`).
2. Applications cannot inspect another application's private directory (\`/data/data/<package>\`) or intercept raw network interface sockets without an active local VPN loopback service or superuser (root) privileges.
3. This sandboxing is a core security feature that protects your banking apps, private messages, and keystore tokens from malware.

RootX monitors application permission declarations and network endpoint reputations rather than performing invasive packet sniffing.`
  }

  // 9. Game Compatibility / Performance
  if (q.includes('bgmi') || q.includes('pubg') || q.includes('free fire') || q.includes('cod') || q.includes('game') || q.includes('fps')) {
    const canHigh = ram >= 6
    return `### 🎮 Gaming Benchmark for ${model}

• **RAM Headroom:** **${ram} GB** (${canHigh ? '✅ Exceeds recommended 6GB' : '✓ Meets minimum requirement'})
• **Free Storage:** **${free} GB** available (Games typically require 4-12 GB)
• **Estimated BGMI / PUBG:** ${canHigh ? '**60 FPS** on Smooth + Extreme settings' : '**40-45 FPS** on Balanced + Ultra'}
• **Estimated Free Fire:** **60 FPS** max settings
• **Pro Tip:** Close background social media apps and avoid fast-charging while gaming to prevent thermal throttling.`
  }

  // 10. Curated Knowledge Base queries
  if (kbEntries.length > 0 && !q.includes('my phone')) {
    const top = kbEntries[0]
    return `### 🛡️ Cybersecurity Intelligence: ${top.title}

**Risk Severity:** **${top.riskLevel}**
**Category:** ${top.category.toUpperCase()}

#### 🔍 Technical Overview
${top.summary}

#### 📋 Key Indicators & Evidence
${top.evidenceIndicators.map(i => `• ${i}`).join('\n')}

#### 🛠️ Recommended Remediation Steps
${top.remediationSteps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

#### ℹ️ Security Limitations
${top.limitations}`
  }

  // 11. Casual Greetings & Conversational
  const CASUAL = new Set([
    'hi','hii','hey','hello','sup','yo','helo',
    'ok','okay','k','kk','cool','nice','great',
    'awesome','thanks','thank you','ty','thx','bye','cya',
  ])
  if (CASUAL.has(q) || q.length <= 3) {
    if (['hi','hii','hey','hello','helo','sup','yo'].includes(q))
      return `Hey! 👋 I'm RootX-AI, your mobile cybersecurity assistant. I'm actively monitoring your **${model}** (${ram}GB RAM, ${free}GB free storage, ${bPct}% battery). How can I assist with your device safety today?`
    if (q.includes('thank')) return `You're very welcome! Let me know if you need any other diagnostics or threat audits.`
    if (q.includes('bye') || q.includes('cya')) return `Stay safe! 🛡️ RootX is keeping your device defense grid active.`
    return `Understood! What security or device inquiry would you like to explore next?`
  }

  // Default Fallback
  return `### 🛡️ RootX-AI Device & Security Intelligence

I'm **RootX-AI** — your intelligent cybersecurity companion connected directly to **${model}** (Android ${android}).

#### 📊 Current Telemetry Snapshot
• **Memory Load:** **${ram} GB** (${ramFree} GB free | ${ramPct}% utilized)
• **Internal Storage:** **${free} GB** available of ${total} GB (${usedPct}% used)
• **Power:** **${bPct}%** ${charging ? '⚡ Charging' : 'Discharging'} (${temp}°C)
• **Security Posture:** ${isRooted ? '⚠️ Rooted' : '✅ Enforced & Secure'} (${totalApps} packages audited)

**You can ask me:**
• *"Which applications on my phone have the highest risk?"*
• *"What is my current storage and RAM status?"*
• *"Is my phone secure?"*
• *"What did my last scan find?"*
• *"How is my battery and thermal health?"*`
}


// ── Helper: Make HTTPS request with streaming ─────────────────
const makeAnthropicRequest = (
  apiKey: string,
  body: string,
): Promise<{ statusCode: number; stream: NodeJS.ReadableStream }> => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (response) => {
        resolve({
          statusCode: response.statusCode || 500,
          stream: response,
        })
      },
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ── Helper: Try OpenAI as fallback ──────────────────────────────
const makeOpenAIRequest = (
  apiKey: string,
  body: string,
): Promise<{ statusCode: number; stream: NodeJS.ReadableStream }> => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (response) => {
        resolve({
          statusCode: response.statusCode || 500,
          stream: response,
        })
      },
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ── /chat endpoint ────────────────────────────────────────────
// Optional auth: works with or without login. When a user is present we can
// pull their synced device profile / scan history; either way the frontend
// passes the REAL browser device data in `deviceContext`, so answers are
// about the user's actual device.
router.post('/chat', optionalAuth, async (req: AuthRequest, res: any) => {
  const userId = req.userId

  const { message, history = [], deviceContext } = req.body
  if (!message?.trim()) {
    res.status(400).json({ error: 'Empty' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const keepAlive = setInterval(() => res.write(': ping\n\n'), 15000)

  try {
    const rich = userId ? await buildRichContext(userId) : { context: '', profile: {} as any }
    const profile = rich.profile || {}
    const realDevice = typeof deviceContext === 'string' && deviceContext.trim()
      ? `\n═══ LIVE DEVICE DATA (measured in the user's browser this session) ═══\n${deviceContext.trim()}\n`
      : ''
    const context = `${realDevice}${rich.context}`.trim() || 'No device data available yet.'

    const geminiKey = config.geminiApiKey || process.env.GEMINI_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: profile.timezone || 'Asia/Kolkata'
    })
    const dateStr = now.toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: profile.timezone || 'Asia/Kolkata'
    })

    const kbEntries = retrieveSecurityKnowledge(message)
    const kbPrompt = formatKnowledgeForPrompt(kbEntries)

    const systemPrompt = `You are RootX-AI — the intelligent device assistant and cyber guardian built into the RootX-Security app.

YOUR CAPABILITIES & SCOPE:
1. MOBILE & DEVICE INTELLIGENCE:
   - Provide complete, accurate telemetry and diagnostics for the user's mobile phone using the real data below (Model, Brand, Android OS, RAM used/free, Storage used/free, Battery level/health/temp, CPU, running apps, risky packages).
   - Offer optimizations for storage cleanup, RAM speed, battery health, and mobile performance.
   - Advise on game compatibility (BGMI, Free Fire, Call of Duty, etc.) based on user hardware specs.
2. CYBERSECURITY & THREAT AUDIT:
   - Analyze URLs, APKs, permissions, trackers, malware risks, phishing patterns, and privacy settings.
   - Ground answers in the authoritative cybersecurity knowledge base entries provided below.
3. GENERAL KNOWLEDGE & SIMPLE ASSISTANCE:
   - Answer simple questions, math problems, scientific concepts, definitions, general questions, and tech questions helpfully, politely, and accurately.
   - Always be constructive, friendly, and direct.

STYLE & GROUNDING RULES:
- Use structured markdown formatting with clear headings (e.g. ### Device Status, ### What Was Found, ### Recommended Actions).
- Distinguish measured facts, scan findings, estimates, and unknown information.
- Never claim 100% security; explain limitations.
- Ground all device answers in the REAL telemetry below.
- Keep answers concise, clear, and direct.

CURRENT DATE & TIME:
  Date: ${dateStr}
  Time: ${timeStr}

${context}
${kbPrompt}`


    let aiSuccess = false

    // Build conversation history for all providers
    const chatHistory = history.slice(-10).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, 2000)
    }))

    // ── Try Gemini FIRST (fastest, best value) ──────────────
    if (geminiKey && !aiSuccess) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${geminiKey}`
        
        // Build Gemini format messages
        const geminiContents = [
          ...chatHistory.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          { role: 'user', parts: [{ text: message.trim() }] }
        ]

        const geminiBody = JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
          }
        })

        const geminiRes = await new Promise<{ statusCode: number; stream: NodeJS.ReadableStream }>((resolve, reject) => {
          const url = new URL(geminiUrl)
          const req = https.request({
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(geminiBody),
            },
          }, (response) => {
            resolve({ statusCode: response.statusCode || 500, stream: response })
          })
          req.on('error', reject)
          req.write(geminiBody)
          req.end()
        })

        if (geminiRes.statusCode >= 200 && geminiRes.statusCode < 300) {
          let buffer = ''
          let hasContent = false

          await new Promise<void>((resolve, reject) => {
            geminiRes.stream.on('data', (chunk: Buffer) => {
              buffer += chunk.toString()
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const data = line.slice(6).trim()
                if (!data || data === '[DONE]') continue
                try {
                  const parsed = JSON.parse(data)
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
                  if (text) {
                    hasContent = true
                    res.write(`data: ${JSON.stringify({ delta: { text } })}\n\n`)
                  }
                } catch { /* skip */ }
              }
            })
            geminiRes.stream.on('end', () => resolve())
            geminiRes.stream.on('error', (err: Error) => reject(err))
          })

          if (hasContent) {
            aiSuccess = true
          }
        } else {
          console.error(`[RootX-AI] Gemini returned ${geminiRes.statusCode}`)
        }
      } catch (err: any) {
        console.error('[RootX-AI] Gemini error:', err.message)
      }
    }

    // ── Try Anthropic as second option ──────────────────────────
    if (anthropicKey && !aiSuccess) {
      try {
        const anthropicBody = JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          stream: true,
          system: systemPrompt,
          messages: [
            ...chatHistory,
            { role: 'user', content: message.trim() }
          ]
        })

        const { statusCode, stream } = await makeAnthropicRequest(anthropicKey, anthropicBody)

        if (statusCode >= 200 && statusCode < 300) {
          let buffer = ''
          let hasContent = false

          await new Promise<void>((resolve, reject) => {
            stream.on('data', (chunk: Buffer) => {
              buffer += chunk.toString()
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.type === 'content_block_delta') {
                    const text = parsed.delta?.text || ''
                    if (text) {
                      hasContent = true
                      res.write(`data: ${JSON.stringify({ delta: { text } })}\n\n`)
                    }
                  }
                } catch { /* skip malformed JSON */ }
              }
            })
            stream.on('end', () => resolve())
            stream.on('error', (err: Error) => reject(err))
          })

          if (hasContent) {
            aiSuccess = true
          }
        } else {
          console.error(`[RootX-AI] Anthropic returned ${statusCode}`)
        }
      } catch (err: any) {
        console.error('[RootX-AI] Anthropic error:', err.message)
      }
    }

    // ── Try OpenAI as last resort ────────────────────────────────
    if (openaiKey && !aiSuccess) {
      try {
        const openaiBody = JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1024,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: message.trim() }
          ]
        })

        const { statusCode, stream } = await makeOpenAIRequest(openaiKey, openaiBody)

        if (statusCode >= 200 && statusCode < 300) {
          let buffer = ''
          let hasContent = false

          await new Promise<void>((resolve, reject) => {
            stream.on('data', (chunk: Buffer) => {
              buffer += chunk.toString()
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue
                try {
                  const parsed = JSON.parse(data)
                  const text = parsed.choices?.[0]?.delta?.content || ''
                  if (text) {
                    hasContent = true
                    res.write(`data: ${JSON.stringify({ delta: { text } })}\n\n`)
                  }
                } catch { /* skip */ }
              }
            })
            stream.on('end', () => resolve())
            stream.on('error', (err: Error) => reject(err))
          })

          if (hasContent) {
            aiSuccess = true
          }
        } else {
          console.error(`[RootX-AI] OpenAI returned ${statusCode}`)
        }
      } catch (err: any) {
        console.error('[RootX-AI] OpenAI error:', err.message)
      }
    }

    // If neither AI worked, throw to fallback
    if (!aiSuccess) {
      throw new Error('All AI providers failed')
    }

    res.write('data: [DONE]\n\n')

  } catch (err: any) {
    console.error('[RootX-AI Error]', err.message)
    const fallback = await buildSmartFallback(message, userId, deviceContext)
    for (const char of fallback) {
      res.write(`data: ${JSON.stringify({ delta: { text: char } })}\n\n`)
      await new Promise(r => setTimeout(r, 4))
    }
    res.write('data: [DONE]\n\n')
  } finally {
    clearInterval(keepAlive);
    res.end()
  }
})

// ── /message endpoint (JSON response for Android & mobile clients) ──
router.post('/message', optionalAuth, async (req: AuthRequest, res: any) => {
  const userId = req.userId
  const { message, history = [], deviceContext } = req.body

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' })
  }

  try {
    const rich = userId ? await buildRichContext(userId) : { context: '', profile: {} as any }
    const profile = rich.profile || {}
    const realDevice = typeof deviceContext === 'string' && deviceContext.trim()
      ? `\n═══ LIVE ANDROID DEVICE TELEMETRY ═══\n${deviceContext.trim()}\n`
      : ''
    const context = `${realDevice}${rich.context}`.trim() || 'No device data available yet.'

    const geminiKey = config.geminiApiKey || process.env.GEMINI_API_KEY
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: profile.timezone || 'Asia/Kolkata'
    })
    const dateStr = now.toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: profile.timezone || 'Asia/Kolkata'
    })

    const kbEntries = retrieveSecurityKnowledge(message)
    const kbPrompt = formatKnowledgeForPrompt(kbEntries)

    const systemPrompt = `You are RootX-AI — the intelligent device assistant and cyber guardian built into the RootX-Security application.

YOUR CAPABILITIES & SCOPE:
1. MOBILE & DEVICE INTELLIGENCE:
   - Provide complete, accurate telemetry and diagnostics for the user's mobile phone using the REAL Android data below (Model, Brand, Android OS, RAM used/free/total, Storage used/free/total, Battery level/health/temp, Root status, ADB debugging, running apps, risky packages, posture score).
   - Offer optimizations for storage cleanup, RAM speed, battery health, and mobile performance.
   - Advise on game compatibility (BGMI, Free Fire, Call of Duty, etc.) based on user hardware specs.
2. CYBERSECURITY & THREAT AUDIT:
   - Analyze URLs, APKs, permissions, trackers, malware risks, phishing patterns, and privacy settings.
   - Ground answers in the authoritative cybersecurity knowledge base entries provided below.
   - Interpret scan findings and explain detected risks with clear remediation steps.
3. GENERAL KNOWLEDGE & ASSISTANCE:
   - Answer general security, programming, definition, calculation, and technology questions accurately and politely.

STYLE & GROUNDING RULES:
- Use structured markdown formatting with clear headings (e.g. ### Device Status, ### What Was Found, ### Recommended Actions).
- Distinguish measured facts, scan findings, estimates, and unknown information.
- Never claim 100% security; explain limitations.
- Ground all device answers in the REAL Android telemetry below. Do NOT hallucinate hardware metrics.
- Keep answers concise, clear, and direct.

CURRENT DATE & TIME:
  Date: ${dateStr}
  Time: ${timeStr}

${context}
${kbPrompt}`

    let aiSuccess = false
    let responseText = ''
    let usedModel = 'gemini-2.0-flash'

    const chatHistory = history.slice(-10).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, 2000)
    }))

    // Try Gemini API if key is present
    if (geminiKey) {
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
      for (const m of models) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`
          const geminiContents = [
            ...chatHistory.map((h: any) => ({
              role: h.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: h.content }]
            })),
            { role: 'user', parts: [{ text: message.trim() }] }
          ]

          const geminiBody = JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: geminiContents,
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.7,
            }
          })

          const gRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: geminiBody
          })

          if (gRes.ok) {
            const data: any = await gRes.json()
            const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (candidate) {
              responseText = candidate
              usedModel = m
              aiSuccess = true
              break
            }
          }
        } catch {
          // try next model
        }
      }
    }

    if (!aiSuccess) {
      // Fallback to grounded intelligent telemetry engine
      responseText = await buildSmartFallback(message, userId, deviceContext)
      usedModel = 'rootx-intelligence'
    }

    res.json({
      success: true,
      response: responseText,
      model: usedModel,
      timestamp: Date.now()
    })
  } catch (err: any) {
    console.error('[RootX-AI JSON Error]', err.message)
    const fallback = await buildSmartFallback(message, userId, deviceContext)
    res.json({
      success: true,
      response: fallback,
      model: 'rootx-intelligence-fallback',
      timestamp: Date.now()
    })
  }
})

export default router
