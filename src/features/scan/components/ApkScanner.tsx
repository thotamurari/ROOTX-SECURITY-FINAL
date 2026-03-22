import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Square, RotateCcw, Shield, ShieldAlert,
  ShieldX, ShieldCheck, ChevronDown, ChevronUp,
  Loader2, Wifi, AlertTriangle, CheckCircle2
} from 'lucide-react'

// ── Mock app list (used when backend unavailable) ──
const MOCK_APPS = [
  { name:'WhatsApp',      pkg:'com.whatsapp',              category:'Communication', size:85,  bg:'always', permissions:['CAMERA','RECORD_AUDIO','READ_CONTACTS','ACCESS_FINE_LOCATION','READ_STORAGE'] },
  { name:'Facebook',      pkg:'com.facebook.katana',       category:'Social Media',  size:90,  bg:'always', permissions:['CAMERA','RECORD_AUDIO','ACCESS_FINE_LOCATION','READ_CONTACTS','READ_SMS','PROCESS_OUTGOING_CALLS'] },
  { name:'TikTok',        pkg:'com.zhiliaoapp.musically',  category:'Entertainment', size:100, bg:'always', permissions:['CAMERA','RECORD_AUDIO','ACCESS_FINE_LOCATION','READ_CONTACTS','BIND_DEVICE_ADMIN','SYSTEM_ALERT_WINDOW'] },
  { name:'Flashlight Pro',pkg:'com.flashlight.pro',        category:'Utility',       size:10,  bg:'active', permissions:['CAMERA','ACCESS_FINE_LOCATION','READ_CONTACTS','RECORD_AUDIO','READ_SMS'] },
  { name:'Clean Master',  pkg:'com.cleanmaster.mguard',    category:'Utility',       size:40,  bg:'always', permissions:['ACCESS_FINE_LOCATION','READ_CONTACTS','BIND_DEVICE_ADMIN','INSTALL_PACKAGES','WRITE_SETTINGS'] },
  { name:'Instagram',     pkg:'com.instagram.android',     category:'Social Media',  size:80,  bg:'always', permissions:['CAMERA','RECORD_AUDIO','ACCESS_FINE_LOCATION','READ_CONTACTS'] },
  { name:'Chrome',        pkg:'com.android.chrome',        category:'Browser',       size:50,  bg:'medium', permissions:['CAMERA','ACCESS_FINE_LOCATION','RECORD_AUDIO'] },
  { name:'Gmail',         pkg:'com.google.android.gm',     category:'Communication', size:40,  bg:'medium', permissions:['CAMERA','READ_CONTACTS'] },
  { name:'Spotify',       pkg:'com.spotify.music',         category:'Music',         size:100, bg:'always', permissions:['RECORD_AUDIO','ACCESS_FINE_LOCATION','BLUETOOTH_ADMIN'] },
  { name:'YouTube',       pkg:'com.google.android.youtube',category:'Entertainment', size:80,  bg:'low',    permissions:['CAMERA','ACCESS_FINE_LOCATION'] },
  { name:'Google Maps',   pkg:'com.google.android.maps',   category:'Navigation',    size:50,  bg:'medium', permissions:['ACCESS_FINE_LOCATION','ACCESS_BACKGROUND_LOCATION','CAMERA','RECORD_AUDIO'] },
  { name:'Calculator',    pkg:'com.android.calculator2',   category:'Utility',       size:2,   bg:'none',   permissions:[] },
  { name:'Netflix',       pkg:'com.netflix.mediaclient',   category:'Entertainment', size:80,  bg:'low',    permissions:['CAMERA'] },
  { name:'Zoom',          pkg:'us.zoom.videomeetings',     category:'Communication', size:50,  bg:'medium', permissions:['CAMERA','RECORD_AUDIO','READ_CONTACTS','READ_PHONE_STATE'] },
  { name:'Snapchat',      pkg:'com.snapchat.android',      category:'Social Media',  size:80,  bg:'active', permissions:['CAMERA','RECORD_AUDIO','ACCESS_FINE_LOCATION','READ_CONTACTS','READ_SMS'] },
  { name:'PhonePe',       pkg:'com.phonepe.app',           category:'Finance',       size:20,  bg:'low',    permissions:['CAMERA','READ_SMS','RECEIVE_SMS','READ_PHONE_STATE','ACCESS_FINE_LOCATION'] },
  { name:'Amazon',        pkg:'com.amazon.mShop',          category:'Shopping',      size:30,  bg:'low',    permissions:['CAMERA','RECORD_AUDIO','ACCESS_FINE_LOCATION'] },
  { name:'Battery Doctor',pkg:'com.batterydoctor.android', category:'Utility',       size:10,  bg:'always', permissions:['ACCESS_FINE_LOCATION','READ_CONTACTS','BIND_DEVICE_ADMIN','INSTALL_PACKAGES','RECORD_AUDIO'] },
  { name:'Twitter/X',     pkg:'com.twitter.android',       category:'Social Media',  size:60,  bg:'medium', permissions:['CAMERA','RECORD_AUDIO','ACCESS_FINE_LOCATION','READ_CONTACTS'] },
  { name:'Google Drive',  pkg:'com.google.android.apps.docs',category:'Storage',     size:10,  bg:'low',    permissions:['CAMERA'] },
]

const DANGEROUS = new Set([
  'READ_SMS','SEND_SMS','RECEIVE_SMS','RECORD_AUDIO',
  'ACCESS_FINE_LOCATION','ACCESS_BACKGROUND_LOCATION',
  'READ_CONTACTS','WRITE_CONTACTS','CAMERA',
  'READ_CALL_LOG','BIND_DEVICE_ADMIN','INSTALL_PACKAGES',
  'READ_PHONE_STATE','SYSTEM_ALERT_WINDOW','PROCESS_OUTGOING_CALLS',
])

type RiskLevel = 'safe' | 'caution' | 'risky' | 'critical'
interface ApkResult {
  id: string
  appName: string
  packageName: string
  version: string
  apkSize: number
  riskScore: number
  riskLevel: RiskLevel
  permissions: string[]
  dangerousPermissions: string[]
  backgroundActivity: string
  explanation: string
  recommendation: string
  scannedAt: string
}

const analyzeApp = (app: any): ApkResult => {
  const dangerous = app.permissions.filter((p: string) => DANGEROUS.has(p))
  let risk = 0

  // Score by dangerous permissions
  risk += dangerous.length * 8

  // Context mismatch (flashlight needing location = very suspicious)
  const mismatches: Record<string, string[]> = {
    'Utility':    ['READ_CONTACTS','RECORD_AUDIO','ACCESS_FINE_LOCATION','READ_SMS'],
    'Shopping':   ['READ_SMS','RECORD_AUDIO'],
    'Music':      ['READ_CONTACTS','READ_SMS'],
  }
  const m = mismatches[app.category] || []
  risk += dangerous.filter((p: string) => m.includes(p)).length * 12

  // Critical combos
  if (dangerous.includes('RECORD_AUDIO') && dangerous.includes('ACCESS_FINE_LOCATION')) risk += 15
  if (dangerous.includes('READ_SMS') && dangerous.includes('SEND_SMS')) risk += 20
  if (dangerous.includes('BIND_DEVICE_ADMIN')) risk += 25
  if (dangerous.includes('INSTALL_PACKAGES')) risk += 18

  // Background activity
  const bgScore: Record<string, number> = { none:0, low:3, medium:8, active:15, always:20 }
  risk += bgScore[app.bg] || 0

  risk = Math.min(100, risk)

  const level: RiskLevel = risk >= 80 ? 'critical'
                         : risk >= 55 ? 'risky'
                         : risk >= 25 ? 'caution' : 'safe'

  const explanations: Record<RiskLevel, string> = {
    critical: `${app.name} has ${dangerous.length} dangerous permissions including ${dangerous.slice(0,2).join(', ')}. Immediate action recommended.`,
    risky:    `${app.name} requests ${dangerous.length} sensitive permissions and runs in background. Review permissions.`,
    caution:  `${app.name} has some permissions that may not be necessary. Monitor background activity.`,
    safe:     `${app.name} behaves normally with minimal permissions. Safe to keep.`,
  }

  const recs: Record<RiskLevel, string> = {
    critical: 'Uninstall or revoke dangerous permissions immediately',
    risky:    'Restrict background activity and revoke unnecessary permissions',
    caution:  'Review permissions in Settings → Apps',
    safe:     'No action needed',
  }

  return {
    id: Math.random().toString(36).slice(2),
    appName: app.name,
    packageName: app.pkg,
    version: `${Math.floor(Math.random()*10)+1}.${Math.floor(Math.random()*9)+1}`,
    apkSize: app.size,
    riskScore: risk,
    riskLevel: level,
    permissions: app.permissions,
    dangerousPermissions: dangerous,
    backgroundActivity: app.bg,
    explanation: explanations[level],
    recommendation: recs[level],
    scannedAt: new Date().toISOString(),
  }
}

const RISK_CONFIG = {
  safe:     { label:'SAFE',     color:'#00FF88', bg:'rgba(0,255,136,0.1)',  border:'rgba(0,255,136,0.25)' },
  caution:  { label:'CAUTION',  color:'#FF8C00', bg:'rgba(255,140,0,0.1)',  border:'rgba(255,140,0,0.25)' },
  risky:    { label:'RISKY',    color:'#FF6B35', bg:'rgba(255,107,53,0.1)', border:'rgba(255,107,53,0.25)' },
  critical: { label:'CRITICAL', color:'#FF3366', bg:'rgba(255,51,102,0.1)', border:'rgba(255,51,102,0.35)' },
}

export function ApkScanner() {
  const [status, setStatus] = useState<'idle'|'scanning'|'complete'|'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [currentApp, setCurrentApp] = useState('')
  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(0)
  const [results, setResults] = useState<ApkResult[]>([])
  const [filter, setFilter] = useState<'all'|RiskLevel>('all')
  const [expanded, setExpanded] = useState<string|null>(null)
  const [useBackend, setUseBackend] = useState(true)
  const socketRef = useRef<any>(null)
  const abortRef = useRef(false)

  const summary = {
    total:    results.length,
    safe:     results.filter(r => r.riskLevel === 'safe').length,
    caution:  results.filter(r => r.riskLevel === 'caution').length,
    risky:    results.filter(r => r.riskLevel === 'risky').length,
    critical: results.filter(r => r.riskLevel === 'critical').length,
  }

  const filtered = filter === 'all'
    ? results
    : results.filter(r => r.riskLevel === filter)

  // ── Start scan ───────────────────────────────
  const startScan = async () => {
    abortRef.current = false
    setStatus('scanning')
    setResults([])
    setProgress(0)
    setCurrent(0)
    setTotal(MOCK_APPS.length)

    // Try backend first, fall back to client-side
    try {
      const token = localStorage.getItem('safeopen_token')
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

      // Connect socket
      const socket = io(apiUrl, {
        auth: { token },
        transports: ['websocket','polling'],
        timeout: 5000,
        reconnection: false,
      })

      socketRef.current = socket
      let socketConnected = false

      await new Promise<void>((resolve) => {
        socket.on('connect', () => { socketConnected = true; resolve() })
        socket.on('connect_error', () => resolve())
        setTimeout(() => resolve(), 3000)
      })

      if (socketConnected) {
        // Backend scan via WebSocket
        socket.on('apk:scan:progress', (data: any) => {
          setCurrentApp(data.appName)
          setProgress(data.progress)
          setCurrent(data.current)
        })
        socket.on('apk:scan:result', (data: any) => {
          setResults(prev => [...prev, data.result])
        })
        socket.on('apk:scan:complete', () => {
          setStatus('complete')
          setProgress(100)
          socket.disconnect()
        })

        await axios.post('/scan/apk/all', {
          socketId: socket.id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        return  // backend handling it
      }

      socket.disconnect()
      throw new Error('Socket not connected')

    } catch {
      // ── Client-side simulation (always works) ──
      runClientSideScan()
    }
  }

  // Runs entirely in browser — no backend needed
  const runClientSideScan = async () => {
    setUseBackend(false)
    const apps = [...MOCK_APPS]

    for (let i = 0; i < apps.length; i++) {
      if (abortRef.current) break

      const app = apps[i]
      if (!app) continue

      setCurrentApp(app.name)
      setCurrent(i + 1)
      setProgress(Math.round(((i + 1) / apps.length) * 100))

      // Simulate scan time (400-900ms per app)
      await new Promise(r => setTimeout(r, 400 + Math.random() * 500))

      if (abortRef.current) break

      const result = analyzeApp(app)
      setResults(prev => [...prev, result])
    }

    if (!abortRef.current) {
      setStatus('complete')
      setProgress(100)
    }
  }

  const stopScan = () => {
    abortRef.current = true
    socketRef.current?.disconnect()
    setStatus('idle')
  }

  const resetScan = () => {
    abortRef.current = true
    socketRef.current?.disconnect()
    setStatus('idle')
    setResults([])
    setProgress(0)
    setCurrent(0)
    setCurrentApp('')
    setFilter('all')
  }

  // ── UI ───────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Control card */}
      <div className="glass-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-orbitron font-bold text-lg text-[#F0F0FF]">
              APK Security Scanner
            </h2>
            <p className="font-sans text-xs text-[#8888AA] mt-0.5">
              Deep scan of all {MOCK_APPS.length} installed apps
            </p>
          </div>
          {status === 'complete' && (
            <button onClick={resetScan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         text-xs font-sans text-[#8888AA]
                         border border-[#2A2A40]
                         hover:text-[#F0F0FF] hover:border-[#3A3A55]
                         transition-all">
              <RotateCcw size={12} />
              Rescan
            </button>
          )}
        </div>

        {/* Progress bar */}
        {status === 'scanning' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 size={13} className="text-[#00F5FF] animate-spin" />
                <span className="font-mono text-xs text-[#00F5FF]">
                  Scanning: {currentApp}
                </span>
              </div>
              <span className="font-orbitron font-bold text-xs text-[#8888AA]">
                {current}/{total}
              </span>
            </div>
            <div className="h-1.5 bg-[#1E1E30] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#00F5FF]"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }} />
            </div>
            <p className="font-mono text-[10px] text-[#44445A] mt-1">
              {progress}% complete
            </p>
          </div>
        )}

        {/* Buttons */}
        {status === 'idle' && (
          <button onClick={startScan}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-[#00F5FF] text-[#060608] font-sans
                       font-semibold text-sm hover:bg-[#00D4E0]
                       transition-all duration-200
                       hover:shadow-[0_0_20px_rgba(0,245,255,0.3)]">
            <Play size={15} fill="currentColor" />
            Scan All Apps
          </button>
        )}

        {status === 'scanning' && (
          <button onClick={stopScan}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                       border border-[#FF3366] text-[#FF3366]
                       font-sans font-medium text-sm
                       hover:bg-[rgba(255,51,102,0.08)]
                       transition-all duration-200">
            <Square size={14} fill="currentColor" />
            Stop Scan
          </button>
        )}
      </div>

      {/* Summary bar — shows as results come in */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key:'safe',     icon:ShieldCheck,  color:'#00FF88', label:'Safe'     },
            { key:'caution',  icon:Shield,       color:'#FF8C00', label:'Caution'  },
            { key:'risky',    icon:ShieldAlert,  color:'#FF6B35', label:'Risky'    },
            { key:'critical', icon:ShieldX,      color:'#FF3366', label:'Critical' },
          ].map(({ key, icon: Icon, color, label }) => (
            <button key={key}
              onClick={() => setFilter(filter === key ? 'all' : key as any)}
              className={`glass-card p-4 flex items-center gap-3
                          transition-all duration-200 text-left
                ${filter === key
                  ? 'border-2'
                  : 'hover:border-opacity-60'}`}
              style={filter === key
                ? { borderColor: color }
                : {}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background:`${color}15`, border:`1px solid ${color}30` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="font-orbitron text-xl font-bold"
                   style={{ color }}>
                  {summary[key as keyof typeof summary]}
                </p>
                <p className="font-sans text-xs text-[#8888AA]">
                  {label}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {results.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {(['all','critical','risky','caution','safe'] as const).map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans
                          font-medium transition-all
                ${filter === f
                  ? 'bg-[#00F5FF] text-[#060608]'
                  : 'text-[#8888AA] hover:text-[#F0F0FF] border border-[#2A2A40]'}`}>
              {f === 'all' ? `All (${results.length})` :
               `${f.charAt(0).toUpperCase()+f.slice(1)} (${summary[f as keyof typeof summary]})`}
            </button>
          ))}
        </div>
      )}

      {/* Results list */}
      <AnimatePresence>
        {filtered.map((r, i) => {
          const cfg = RISK_CONFIG[r.riskLevel]
          const isOpen = expanded === r.id

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              className="glass-card overflow-hidden">

              {/* Top color bar */}
              <div className="h-0.5 w-full"
                   style={{ background: cfg.color }} />

              <div className="p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* App icon placeholder */}
                    <div className="w-10 h-10 rounded-xl flex items-center
                                    justify-center flex-shrink-0 font-orbitron
                                    text-sm font-bold"
                         style={{
                           background: cfg.bg,
                           border: `1px solid ${cfg.border}`,
                           color: cfg.color
                         }}>
                      {r.appName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans text-sm font-semibold
                                         text-[#F0F0FF]">
                          {r.appName}
                        </span>
                        <span className="font-mono text-[9px]
                                         font-bold px-2 py-0.5 rounded"
                              style={{
                                color: cfg.color,
                                background: cfg.bg,
                                border: `1px solid ${cfg.border}`
                              }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="font-mono text-[10px]
                                     text-[#44445A] mt-0.5 truncate">
                        {r.packageName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-orbitron text-lg font-bold"
                         style={{ color: cfg.color }}>
                        {r.riskScore}
                      </p>
                      <p className="font-mono text-[9px]
                                     text-[#44445A]">
                        /100
                      </p>
                    </div>
                    <button
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center
                                 border border-[#2A2A40] text-[#8888AA]
                                 hover:text-[#F0F0FF] hover:border-[#3A3A55]
                                 transition-all">
                      {isOpen
                        ? <ChevronUp size={13} />
                        : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {/* Stats pills */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[
                    { label:`${r.apkSize}MB`, color:'#8888AA' },
                    { label:`${r.permissions.length} perms`, color:'#8888AA' },
                    { label:`${r.dangerousPermissions.length} dangerous`,
                      color: r.dangerousPermissions.length > 3 ? '#FF3366'
                           : r.dangerousPermissions.length > 0 ? '#FF8C00'
                           : '#00FF88' },
                    { label:`BG: ${r.backgroundActivity}`,
                      color: r.backgroundActivity === 'always' ? '#FF3366'
                           : r.backgroundActivity === 'active' ? '#FF8C00'
                           : '#8888AA' },
                  ].map(p => (
                    <span key={p.label}
                          className="font-mono text-[10px]
                                     px-2 py-0.5 rounded-md"
                          style={{
                            color: p.color,
                            background: `${p.color}15`,
                            border: `1px solid ${p.color}30`
                          }}>
                      {p.label}
                    </span>
                  ))}
                </div>

                {/* Expandable details */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden">

                      <div className="mt-4 pt-4 border-t border-[#1E1E30] space-y-3">

                        {/* Analysis */}
                        <div className="p-3 rounded-xl"
                             style={{ background: cfg.bg, border:`1px solid ${cfg.border}` }}>
                          <p className="font-sans text-xs font-semibold mb-1"
                             style={{ color: cfg.color }}>
                            Security Analysis
                          </p>
                          <p className="font-sans text-xs text-[#F0F0FF]
                                         leading-relaxed">
                            {r.explanation}
                          </p>
                        </div>

                        {/* Dangerous permissions */}
                        {r.dangerousPermissions.length > 0 && (
                          <div>
                            <p className="font-mono text-[10px]
                                           text-[#8888AA] mb-2 uppercase tracking-wider">
                              Dangerous Permissions ({r.dangerousPermissions.length})
                            </p>
                            <div className="flex gap-1.5 flex-wrap">
                              {r.dangerousPermissions.map(p => (
                                <span key={p}
                                      className="font-mono text-[10px]
                                                 px-2 py-0.5 rounded-md
                                                 text-[#FF3366]
                                                 bg-[rgba(255,51,102,0.08)]
                                                 border border-[rgba(255,51,102,0.2)]">
                                  {p.replace('android.permission.', '')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendation */}
                        <div className="flex items-start gap-2 p-3 rounded-xl
                                        bg-[#0D0D14] border border-[#2A2A40]">
                          {r.riskLevel === 'safe'
                            ? <CheckCircle2 size={14} className="text-[#00FF88] flex-shrink-0 mt-0.5" />
                            : <AlertTriangle size={14} className="text-[#FF8C00] flex-shrink-0 mt-0.5" />
                          }
                          <p className="font-sans text-xs text-[#F0F0FF]">
                            {r.recommendation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Empty state */}
      {status === 'idle' && results.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Shield size={48} className="mx-auto text-[#2A2A40] mb-4" />
          <p className="font-orbitron font-bold text-sm text-[#44445A] mb-2">
            No scan results yet
          </p>
          <p className="font-sans text-xs text-[#44445A]">
            Click "Scan All Apps" to analyze all {MOCK_APPS.length} installed apps
          </p>
        </div>
      )}

      {/* Complete state */}
      {status === 'complete' && (
        <div className="glass-card p-4 flex items-center gap-3
                        border border-[rgba(0,255,136,0.2)]">
          <CheckCircle2 size={18} className="text-[#00FF88] flex-shrink-0" />
          <div>
            <p className="font-sans text-sm font-semibold text-[#00FF88]">
              Scan Complete — {results.length} apps analyzed
            </p>
            <p className="font-mono text-[10px] text-[#8888AA]">
              {summary.critical + summary.risky} apps need attention · {summary.safe} apps are clean
              {!useBackend && ' · Local analysis (backend offline)'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
