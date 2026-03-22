import express, { type Response } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { DeviceProfileModel } from '../models/device.model.js'
import { ApkScanModel } from '../models/apkScanSession.model.js'
import { ScanModel } from '../models/scan.model.js'

const router = express.Router()

// ── Build rich AI context from real device data ──
const buildRichContext = async (userId: string): Promise<{
  context: string
  profile: any
}> => {
  try {
    const [profile, apkScan, recentScans] = await Promise.all([
      DeviceProfileModel.findOne({ userId }).lean(),
      ApkScanModel.findOne({ userId }).sort({ scannedAt: -1 }).lean(),
      ScanModel.find({ userId }).sort({ scannedAt: -1 }).limit(5).lean()
    ])

    const p = (profile || {}) as any
    const riskyApps = apkScan?.results?.filter(
      (r: any) => r.riskLevel === 'risky' || r.riskLevel === 'critical'
    ) || []

    const storageStatus =
      (p.storageUsedPercent || 84) >= 90 ? 'CRITICAL - almost full' :
      (p.storageUsedPercent || 84) >= 75 ? 'WARNING - getting full' :
      'OK'

    const ramStatus =
      (p.ramUsedPercent || 75) >= 85 ? 'CRITICAL - very low' :
      (p.ramUsedPercent || 75) >= 70 ? 'WARNING - low' :
      'OK'

    const batteryStatus =
      (p.batteryHealth || 85) < 70 ? 'REPLACE SOON' :
      (p.batteryHealth || 85) < 80 ? 'DEGRADING' :
      'HEALTHY'

    const context = `
═══════════════════════════════════════
REAL DEVICE DATA FOR THIS USER
═══════════════════════════════════════

DEVICE:
  Model:          ${p.model || 'Unknown Device'}
  Brand:          ${p.brand || 'Unknown'}
  Android:        ${p.androidVersion || 'Unknown'}
  API Level:      ${p.apiLevel || 'Unknown'}
  Last synced:    ${p.lastSynced ? new Date(p.lastSynced).toLocaleString() : 'Never'}

MEMORY (RAM):
  Total:          ${p.ramTotalGB || 4}GB
  Free:           ${p.ramFreeGB || 1}GB
  Used:           ${p.ramUsedGB || 3}GB (${p.ramUsedPercent || 75}%)
  Status:         ${ramStatus}

STORAGE:
  Total:          ${p.storageTotalGB || 64}GB
  Free:           ${p.storageFreeGB || 10}GB
  Used:           ${p.storageUsedGB || 54}GB (${p.storageUsedPercent || 84}%)
  Status:         ${storageStatus}
  Cache:          ${p.cacheGB || 'Unknown'}GB cleanable

BATTERY:
  Charge:         ${p.batteryPercent || 80}%
  Health:         ${p.batteryHealth || 85}%
  Temperature:    ${p.batteryTemp || 30}°C
  Charging:       ${p.isCharging ? 'YES' : 'NO'}
  Status:         ${batteryStatus}

NETWORK:
  Type:           ${p.networkType || 'Unknown'}
  Connected:      ${p.isConnected ? 'YES' : 'NO'}
  Carrier:        ${p.carrier || 'Unknown'}

APPS:
  Total installed:   ${p.installedAppsCount || 0}
  Risky detected:    ${p.riskyAppsCount || riskyApps.length}
  Dangerous perms:   ${p.dangerousPermsCount || 0}
  Background procs:  ${p.bgProcessCount || 0}
  Top battery drains:${p.topBatteryDrains || 'Run APK scan to see'}

SECURITY:
  Risky apps:  ${riskyApps.slice(0,5).map((r: any) => r.appName).join(', ') || 'Run scan to detect'}
  Last scan:   ${apkScan?.completedAt ? new Date(apkScan.completedAt).toLocaleDateString() : 'Never scanned'}

RECENT SCANS:
${recentScans.map((s: any) =>
  `  - ${s.scanType}: ${s.input?.slice(0,40)} → ${s.threatLevel} (${s.riskScore}/100)`
).join('\n') || '  No recent scans'}

═══════════════════════════════════════
DEVICE HEALTH SUMMARY:
  RAM:     ${ramStatus}
  Storage: ${storageStatus}
  Battery: ${batteryStatus}
═══════════════════════════════════════`.trim()

    return { context, profile: p }
  } catch (err) {
    return {
      context: 'Device data unavailable — user has not synced their device yet.',
      profile: {}
    }
  }
}

// ── Main chat endpoint ───────────────────────
router.post('/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId ?? (req as any).user?.id
  if (!userId) {
     res.status(401).json({ error: 'Unauthorized' })
     return
  }

  const { message, history = [] } = req.body
  if (!message?.trim()) {
     res.status(400).json({ error: 'Empty message' })
     return
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  ;(res as any).flushHeaders()

  const keepAlive = setInterval(() => (res as any).write(': ping\n\n'), 15000)

  try {
    const { context, profile } = await buildRichContext(userId)

    const systemPrompt = `You are RootX-AI — an intelligent personal device
assistant built into the SafeOpen security app. You have REAL data from
the user's actual Android device synced moments ago.

${context}

CRITICAL BEHAVIOR RULES:

1. CASUAL MESSAGES (hi, hello, thanks, ok, bye):
   - Reply NATURALLY like a friend — 1-2 sentences MAXIMUM
   - "hi" → "Hey! How can I help with your ${profile?.model || 'phone'}?"
   - "thanks" → "You're welcome! Anything else?"
   - NEVER dump device specs for casual messages
   - NEVER list device data unless asked about it

2. DEVICE-SPECIFIC QUESTIONS:
   - Use EXACT numbers from the device data above
   - Do NOT use generic/example numbers
   - "How much storage?" → use their actual ${profile?.storageFreeGB || 0}GB free
   - "What's my RAM?" → use their actual ${profile?.ramTotalGB || 0}GB RAM

3. GAME INSTALL QUESTIONS:
   Use this exact logic with their real specs:

   GAME DATABASE:
   - BGMI/PUBG Mobile: needs 2GB RAM min, 3GB storage, Android 5.1+
     60fps: needs 4GB+ RAM | 40fps: 3GB RAM | 30fps: 2GB RAM
   - Free Fire: needs 1GB RAM, 700MB storage, Android 4.1+
     60fps: needs 2GB+ RAM
   - Genshin Impact: needs 4GB RAM, 20GB storage, Android 7+
     40fps: 6GB RAM | 30fps: 4GB RAM
   - COD Mobile: needs 2GB RAM, 3GB storage, Android 5.1+
     60fps: needs 3GB+ RAM
   - Minecraft: needs 1GB RAM, 200MB storage
     60fps: needs 2GB+ RAM
   - Fortnite: needs 3GB RAM, 4GB storage, Android 8+
     60fps: needs 6GB+ RAM
   - Among Us: needs 1GB RAM, 500MB storage
   - Roblox: needs 1GB RAM, 200MB storage
   - Pokemon GO: needs 2GB RAM, 1GB storage

   For any game: check user's actual RAM vs requirement, actual storage
   vs requirement, actual Android version vs requirement, then give
   specific FPS estimate and honest verdict.

4. PERFORMANCE QUESTIONS:
   - Reference their actual RAM usage: ${profile?.ramUsedPercent || 75}%
   - Reference their actual background processes
   - Give specific actionable fixes

5. BATTERY QUESTIONS:
   - Reference their actual battery: ${profile?.batteryPercent || 80}% charge, ${profile?.batteryHealth || 85}% health
   - Reference their actual temperature: ${profile?.batteryTemp || 30}°C
   - Give honest health assessment

6. STORAGE QUESTIONS:
   - Reference their actual: ${profile?.storageFreeGB || 10}GB free of ${profile?.storageTotalGB || 64}GB
   - Reference actual storage status: ${
     (profile?.storageUsedPercent || 84) >= 90 ? 'CRITICAL' :
     (profile?.storageUsedPercent || 84) >= 75 ? 'WARNING' : 'OK'
   }

7. FORMAT:
   - Use bullet points (•) for lists
   - Bold key info with **text** markdown
   - Max 3-4 paragraphs for technical answers
   - 1-2 sentences for casual replies
   - Always end with an actionable recommendation

8. IF DATA IS MISSING:
   If device data shows "Unknown" or "Never synced":
   Tell user to open AndroidSEC to scan their device, which will
   populate real data for more accurate answers.`

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        stream: true,
        system: systemPrompt,
        messages: [
          ...history.slice(-8).map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content).slice(0, 1000)
          })),
          { role: 'user', content: message.trim() }
        ]
      })
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      throw new Error(`Anthropic ${anthropicRes.status}: ${errText}`)
    }

    const reader = anthropicRes.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'content_block_delta') {
            const text = parsed.delta?.text || ''
            if (text) {
                (res as any).write(`data: ${JSON.stringify({ delta:{ text } })}\n\n`)
            }
          }
        } catch { /* skip */ }
      }
    }

    ;(res as any).write('data: [DONE]\n\n')

  } catch (err: any) {
    console.error('[RootX-AI]', err.message)
    // Smart fallback using real profile
    const fallback = await generateSmartFallback(message, userId)
    for (const char of fallback) {
      (res as any).write(`data: ${JSON.stringify({ delta:{ text: char } })}\n\n`)
      await new Promise(r => setTimeout(r, 5))
    }
    (res as any).write('data: [DONE]\n\n')
  } finally {
    clearInterval(keepAlive);
    (res as any).end()
  }
})

// ── Smart fallback using real DB data ────────
const generateSmartFallback = async (
  question: string,
  userId: string
): Promise<string> => {
  let profile: any = {}
  try {
    profile = await DeviceProfileModel.findOne({ userId }).lean() || {}
  } catch { /* use defaults */ }

  const q = question.toLowerCase().trim()
  const model    = profile.model || 'your phone'
  const ram      = profile.ramTotalGB || 4
  const ramFree  = profile.ramFreeGB || 1
  const free     = profile.storageFreeGB || 10
  const total    = profile.storageTotalGB || 64
  const battery  = profile.batteryHealth || 85
  const bPct     = profile.batteryPercent || 80
  const temp     = profile.batteryTemp || 30
  const android  = profile.androidVersion || 'Unknown'
  const risky    = profile.riskyAppsCount || 0
  const bgProcs  = profile.bgProcessCount || 0
  const used     = profile.storageUsedPercent || 84

  // Casual messages
  const CASUAL = new Set(['hi','hii','hey','hello','sup','yo','ok','okay',
    'k','thanks','thank you','ty','bye','cool','nice','great','yes','no'])
  if (CASUAL.has(q) || q.length < 4) {
    if (['hi','hii','hey','hello','sup','yo'].includes(q)) {
      return `Hey! 👋 How can I help you with your ${model} today?`
    }
    if (q.includes('thank')) return `You're welcome! Anything else about your ${model}?`
    if (q.includes('bye')) return `Take care! Your device is being monitored by SafeOpen. 🛡️`
    return `Got it! What would you like to know about your ${model}?`
  }

  // Games
  const GAMES: Record<string, {name:string, minRam:number, minStorage:number, minAndroid:number, fps60Ram:number}> = {
    bgmi:       { name:'BGMI',           minRam:2, minStorage:3,   minAndroid:5.1, fps60Ram:4 },
    battleground:{ name:'BGMI',          minRam:2, minStorage:3,   minAndroid:5.1, fps60Ram:4 },
    pubg:       { name:'PUBG Mobile',    minRam:2, minStorage:3,   minAndroid:5.1, fps60Ram:4 },
    'free fire':{ name:'Free Fire',      minRam:1, minStorage:0.7, minAndroid:4.1, fps60Ram:2 },
    freefire:   { name:'Free Fire',      minRam:1, minStorage:0.7, minAndroid:4.1, fps60Ram:2 },
    genshin:    { name:'Genshin Impact', minRam:4, minStorage:20,  minAndroid:7.0, fps60Ram:8 },
    'call of duty':{ name:'COD Mobile',  minRam:2, minStorage:3,   minAndroid:5.1, fps60Ram:3 },
    codm:       { name:'COD Mobile',     minRam:2, minStorage:3,   minAndroid:5.1, fps60Ram:3 },
    minecraft:  { name:'Minecraft',      minRam:1, minStorage:0.2, minAndroid:5.0, fps60Ram:2 },
    fortnite:   { name:'Fortnite',       minRam:3, minStorage:4,   minAndroid:8.0, fps60Ram:6 },
    roblox:     { name:'Roblox',         minRam:1, minStorage:0.2, minAndroid:5.0, fps60Ram:2 },
    pokemon:    { name:'Pokemon GO',     minRam:2, minStorage:1,   minAndroid:6.0, fps60Ram:3 },
  }

  const gameKey = Object.keys(GAMES).find(k => q.includes(k))
  if (gameKey || (q.includes('install') && q.includes('game'))) {
    if (gameKey) {
      const g = GAMES[gameKey]
      const ramOk = ram >= g.minRam
      const storageOk = free >= g.minStorage
      const fps = ram >= g.fps60Ram ? '60fps' : ram >= g.fps60Ram * 0.75 ? '40fps' : '30fps'
      const canRun = ramOk && storageOk

      return `${canRun ? 'Yes!' : 'Unfortunately not.'} ${g.name} ${canRun ? 'will' : 'cannot'} run on your ${model}.\n\n• RAM: ${ram}GB ${ramOk ? '✓' : `✗ needs ${g.minRam}GB`}\n• Storage: ${free}GB free ${storageOk ? '✓' : `✗ needs ${g.minStorage}GB`}\n• Android ${android} ${parseFloat(android) >= g.minAndroid ? '✓' : `✗ needs Android ${g.minAndroid}+`}\n• Expected FPS: ${canRun ? fps : 'Cannot run'}\n\n${canRun ? `Tip: Close background apps (RAM is ${Math.round((1 - ramFree/ram)*100)}% used) before gaming for best performance.` : `Your device doesn't meet the minimum requirements. Consider ${g.minRam > ram ? 'a device with more RAM' : 'freeing up storage'}.`}`
    }
    return `Tell me which game specifically! I can check if your ${model} (${ram}GB RAM, ${free}GB free, Android ${android}) can run it and estimate the FPS.`
  }

  // Performance
  if (q.includes('slow') || q.includes('lag') || q.includes('freeze') || q.includes('hang')) {
    const ramPct = Math.round(((ram - ramFree) / ram) * 100)
    return `Your ${model} is slow because RAM is ${ramPct}% full (only ${ramFree}GB free of ${ram}GB).\n\n• ${bgProcs > 0 ? `${bgProcs} apps running in background` : 'Multiple apps running in background'}\n• Storage at ${used}% full (Android slows down above 80%)\n${risky > 0 ? `• ${risky} risky apps detected consuming resources\n` : ''}• Fix: Force stop unused apps, clear cache, restart device`
  }

  // Battery
  if (q.includes('battery') || q.includes('drain') || q.includes('charge')) {
    return `Your ${model} battery: ${bPct}% charge, ${battery}% health, ${temp}°C.\n\n• Health ${battery}%: ${battery >= 80 ? 'Good — no replacement needed' : battery >= 70 ? 'Degrading — consider replacement soon' : 'Poor — replace battery'}\n• Temperature ${temp}°C: ${temp <= 35 ? 'Normal' : temp <= 40 ? 'Slightly warm — reduce usage' : 'Too hot — stop charging and cool down'}\n${profile.topBatteryDrains && profile.topBatteryDrains !== 'No data yet' ? `• Top drains: ${profile.topBatteryDrains}` : '• Run APK scan to see which apps drain most battery'}`
  }

  // Storage
  if (q.includes('storage') || q.includes('space') || q.includes('full') || q.includes('memory')) {
    return `${model} storage: ${free}GB free of ${total}GB (${used}% used).\n\n• Status: ${used >= 90 ? '🔴 Critical — phone will slow down significantly' : used >= 80 ? '🟡 Warning — free up space soon' : '🟢 OK'}\n• Estimated cache: Clear from Settings → Apps for quick space\n• Photos backup to Google Photos to free space\n• Run APK Scanner to find apps using most storage`
  }

  // Security
  if (q.includes('safe') || q.includes('bank') || q.includes('secure') || q.includes('virus')) {
    return `${model} security status: ${risky} risky apps detected.\n\n• ${risky > 0 ? `${risky} apps flagged — check APK Scanner for details` : 'No risky apps found'}\n• For banking: use Chrome only, avoid third-party browsers\n• ${risky > 0 ? 'Remove risky apps before entering banking passwords' : 'Device looks clean for banking'}\n• Run APK Scanner for full security analysis`
  }

  return `Based on your ${model} (${ram}GB RAM, ${free}GB free, Android ${android}): I can help with game compatibility, performance, battery, storage, and security. What specifically do you need?`
}

export default router
