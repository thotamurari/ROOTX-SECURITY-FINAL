/**
 * RootXGuardian — Global Floating Robot Mascot
 *
 * • Persists across ALL protected pages (mounted in AppShell)
 * • Route-aware: gives contextual instructions per page
 * • Mood states: idle | scanning | alert | happy | warning
 * • Drifts to different screen corners based on mood
 * • Minimises to a glowing orb on click; expands on re-click
 * • NO global mousemove — zero performance overhead
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { X, ChevronUp } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────
type Mood = 'idle' | 'scanning' | 'alert' | 'happy' | 'warning'
type Corner = 'br' | 'bl' | 'tr' | 'tl'

interface RouteConfig {
    mood: Mood
    title: string
    tips: string[]
}

// ─── Route-aware config ─────────────────────────────────────────────────────
const ROUTE_CONFIG: Record<string, RouteConfig> = {
    '/dashboard': {
        mood: 'happy',
        title: 'Dashboard Overview',
        tips: [
            'Your Security Score updates live — check it daily.',
            'Run a Core Scan weekly to stay protected.',
            'Enable Behavioral DNA for real-time anomaly alerts.',
            'Check the Threat Intelligence feed for live global threats.',
        ],
    },
    '/scan': {
        mood: 'scanning',
        title: 'Scan Engine',
        tips: [
            'Upload an APK or select installed apps to scan.',
            'Deep Scan checks for malware, trackers & hidden permissions.',
            'Export your scan report as a PDF for audit records.',
            'Run Social Engineering check to detect phishing patterns.',
        ],
    },
    '/android-sec': {
        mood: 'alert',
        title: 'Android Hardening',
        tips: [
            'Disable developer options when not actively developing.',
            'Review app permissions — revoke anything unused.',
            'Enable Full-Disk Encryption in device settings.',
            'Keep your Android security patch up to date.',
        ],
    },
    '/rootx-ai': {
        mood: 'scanning',
        title: 'RootX AI',
        tips: [
            'Ask RootX AI about any suspicious app behaviour.',
            'Paste a permission list for instant risk analysis.',
            'Use AI Audit to get a full behavioural threat report.',
            'Ask for hardening steps specific to your device model.',
        ],
    },
    '/scan-history': {
        mood: 'scanning',
        title: 'Scan History',
        tips: [
            'Filter by URL, File, or Message to find specific audit logs.',
            'Use 1-tap Re-scan to re-evaluate threats with live intelligence.',
            'Logs sync automatically with Cloud Firestore when logged in.',
            'Expand any log to review the detailed threat breakdown.',
        ],
    },
    '/apk-scanner': {
        mood: 'scanning',
        title: 'APK Scanner',
        tips: [
            'Drop any APK here for a full static analysis.',
            'Check for obfuscated code — a common malware tactic.',
            'Permissions labelled "Dangerous" need your attention.',
            'Compare APK signatures against known malware hashes.',
        ],
    },
    '/news': {
        mood: 'idle',
        title: 'Security News',
        tips: [
            'Filter by CVE to track specific vulnerabilities.',
            'Bookmark articles for your security audit reports.',
            'Enable notifications for critical threat advisories.',
        ],
    },
    '/inbox': {
        mood: 'alert',
        title: 'Alerts Inbox',
        tips: [
            'Review all HIGH severity alerts immediately.',
            'Mark resolved threats to keep your inbox clean.',
            'Set alert thresholds in Settings for custom rules.',
        ],
    },
    '/community': {
        mood: 'happy',
        title: 'Community',
        tips: [
            'Share findings with the community for peer review.',
            'Follow top researchers for cutting-edge threat intel.',
            'Join the weekly CTF challenge to sharpen your skills.',
        ],
    },
    '/settings': {
        mood: 'idle',
        title: 'Settings',
        tips: [
            'Enable 2-Factor Authentication for stronger account security.',
            'Set up alert rules to match your threat tolerance.',
            'Export your data before making major changes.',
        ],
    },
}

// ─── Mood colours ───────────────────────────────────────────────────────────
const MOOD_COLORS: Record<Mood, { primary: string; glow: string; ring: string }> = {
    idle:     { primary: '#06b6d4', glow: '#0891b2', ring: '#22d3ee' },
    scanning: { primary: '#a78bfa', glow: '#7c3aed', ring: '#c4b5fd' },
    alert:    { primary: '#f87171', glow: '#dc2626', ring: '#fca5a5' },
    happy:    { primary: '#34d399', glow: '#059669', ring: '#6ee7b7' },
    warning:  { primary: '#fbbf24', glow: '#d97706', ring: '#fde68a' },
}

// ─── Corner positions ───────────────────────────────────────────────────────
const CORNER_POS: Record<Corner, React.CSSProperties> = {
    br: { bottom: 24, right: 24, top: 'auto', left: 'auto' },
    bl: { bottom: 24, left: 24, top: 'auto', right: 'auto' },
    tr: { top: 80,   right: 24, bottom: 'auto', left: 'auto' },
    tl: { top: 80,   left: 24,  bottom: 'auto', right: 'auto' },
}

const MOOD_CORNERS: Record<Mood, Corner> = {
    idle:     'br',
    scanning: 'br',
    alert:    'tr',
    happy:    'br',
    warning:  'bl',
}

// ─── Injected CSS (once) ────────────────────────────────────────────────────
const GUARDIAN_CSS = `
  @keyframes guardianFloat {
    0%,100%{transform:translateY(0px);}
    50%{transform:translateY(-6px);}
  }
  @keyframes guardianBlink {
    0%,90%,100%{transform:scaleY(1);}
    95%{transform:scaleY(0.06);}
  }
  @keyframes guardianBlinkR {
    0%,93%,100%{transform:scaleY(1);}
    97%{transform:scaleY(0.06);}
  }
  @keyframes guardianAntenna {
    0%,100%{opacity:0;transform:scale(0);}
    50%{opacity:1;transform:scale(1);}
  }
  @keyframes guardianScan {
    0%{transform:translateY(-24px);opacity:0.5;}
    100%{transform:translateY(36px);opacity:0;}
  }
  @keyframes guardianCore {
    0%,100%{opacity:0.4;transform:scale(0.85);}
    50%{opacity:1;transform:scale(1.1);}
  }
  @keyframes guardianOrbit {
    0%{transform:rotate(0deg) translateX(20px) rotate(0deg);}
    100%{transform:rotate(360deg) translateX(20px) rotate(-360deg);}
  }
  @keyframes guardianOrbitR {
    0%{transform:rotate(0deg) translateX(20px) rotate(0deg);}
    100%{transform:rotate(-360deg) translateX(20px) rotate(360deg);}
  }
  @keyframes guardianGlow {
    0%,100%{box-shadow:0 0 16px 4px var(--grd-clr,#06b6d4);}
    50%{box-shadow:0 0 28px 8px var(--grd-clr,#06b6d4);}
  }
  @keyframes orbPulse {
    0%,100%{transform:scale(1);opacity:0.9;}
    50%{transform:scale(1.18);opacity:1;}
  }
  @keyframes tipSlide {
    0%{opacity:0;transform:translateY(6px);}
    15%,85%{opacity:1;transform:translateY(0);}
    100%{opacity:0;transform:translateY(-6px);}
  }
  .guardian-body{animation:guardianFloat 3s ease-in-out infinite;}
  .guardian-eye{animation:guardianBlink 6s ease-in-out infinite;transform-origin:center;transform-box:fill-box;}
  .guardian-eye-r{animation:guardianBlinkR 6s ease-in-out infinite;transform-origin:center;transform-box:fill-box;}
  .guardian-antenna{animation:guardianAntenna 1.4s ease-in-out infinite;transform-origin:center;transform-box:fill-box;}
  .guardian-antenna2{animation:guardianAntenna 1.4s ease-in-out infinite 0.5s;transform-origin:center;transform-box:fill-box;}
  .guardian-scan{animation:guardianScan 2s ease-in-out infinite;}
  .guardian-core{animation:guardianCore 1.8s ease-in-out infinite;transform-origin:center;transform-box:fill-box;}
  .guardian-orbit{animation:guardianOrbit 3s linear infinite;transform-origin:50% 50%;transform-box:fill-box;}
  .guardian-orbit2{animation:guardianOrbitR 3s linear infinite;transform-origin:50% 50%;transform-box:fill-box;}
  .guardian-glow{animation:guardianGlow 2.5s ease-in-out infinite;}
  .guardian-orb{animation:orbPulse 2s ease-in-out infinite;}
  .guardian-tip{animation:tipSlide 4s ease-in-out infinite;}
  @media(prefers-reduced-motion:reduce){
    .guardian-body,.guardian-eye,.guardian-eye-r,.guardian-antenna,.guardian-antenna2,
    .guardian-scan,.guardian-core,.guardian-orbit,.guardian-orbit2,.guardian-glow,
    .guardian-orb,.guardian-tip{animation:none!important;}
  }
`

// ─── Mini Robot SVG ─────────────────────────────────────────────────────────
function RobotSVG({ mood, size = 64 }: { mood: Mood; size?: number }) {
    const c = MOOD_COLORS[mood]
    return (
        <svg
            width={size} height={size * 1.25}
            viewBox="0 0 80 100"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="grd-body" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="grd-head" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e3a5f" />
                    <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <radialGradient id="grd-eye">
                    <stop offset="0%" stopColor={c.ring} />
                    <stop offset="100%" stopColor={c.primary} />
                </radialGradient>
                <radialGradient id="grd-core" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={c.ring} stopOpacity="0.9" />
                    <stop offset="60%" stopColor={c.primary} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={c.glow} stopOpacity="0" />
                </radialGradient>
                <clipPath id="grd-clip">
                    <rect x="22" y="40" width="36" height="36" rx="5" />
                </clipPath>
                <filter id="grd-bloom" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="grd-core-bloom" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* Orbit rings */}
            <ellipse cx="40" cy="60" rx="26" ry="7" fill="none" stroke={c.primary} strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />

            {/* Orbit dots */}
            <g className="guardian-orbit"><circle cx="40" cy="60" r="1.8" fill={c.ring} opacity="0.9" /></g>
            <g className="guardian-orbit2"><circle cx="40" cy="60" r="1.4" fill={c.primary} opacity="0.7" /></g>

            {/* Floating body group */}
            <g className="guardian-body">
                {/* Antenna */}
                <line x1="40" y1="14" x2="40" y2="21" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="40" cy="12" r="3" fill="#1e293b" stroke={c.primary} strokeWidth="1" />
                <circle cx="40" cy="12" r="4.5" fill={c.ring} opacity="0" className="guardian-antenna" filter="url(#grd-bloom)" />
                <circle cx="40" cy="12" r="6" fill={c.primary} opacity="0" className="guardian-antenna2" filter="url(#grd-bloom)" />

                {/* Head */}
                <rect x="22" y="19" width="36" height="26" rx="7" fill="url(#grd-head)" stroke="#1e40af" strokeWidth="0.9" />
                <line x1="27" y1="21" x2="53" y2="21" stroke={c.primary} strokeWidth="0.4" opacity="0.35" />

                {/* Left eye */}
                <g className="guardian-eye" filter="url(#grd-bloom)">
                    <rect x="26" y="25" width="11" height="11" rx="3.5" fill="#0f172a" stroke={c.primary} strokeWidth="0.7" />
                    <circle cx="31.5" cy="30.5" r="3.8" fill="url(#grd-eye)" />
                    <circle cx="32.5" cy="29.5" r="1" fill="white" opacity="0.8" />
                </g>
                {/* Right eye */}
                <g className="guardian-eye-r" filter="url(#grd-bloom)">
                    <rect x="43" y="25" width="11" height="11" rx="3.5" fill="#0f172a" stroke={c.primary} strokeWidth="0.7" />
                    <circle cx="48.5" cy="30.5" r="3.8" fill="url(#grd-eye)" />
                    <circle cx="49.5" cy="29.5" r="1" fill="white" opacity="0.8" />
                </g>

                {/* Mouth */}
                <path d={mood === 'alert' || mood === 'warning'
                    ? "M 32 38 Q 40 36 48 38"  // flat/frown
                    : "M 32 38 Q 40 42 48 38"   // smile
                } stroke={c.ring} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.75" />

                {/* Neck */}
                <rect x="35" y="44" width="10" height="4" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />

                {/* Body */}
                <rect x="22" y="47" width="36" height="32" rx="6" fill="url(#grd-body)" stroke="#1e40af" strokeWidth="0.9" />

                {/* Chest core */}
                <circle cx="40" cy="61" r="8" fill="url(#grd-core)" className="guardian-core" filter="url(#grd-core-bloom)" />
                <circle cx="40" cy="61" r="4.5" fill="none" stroke={c.ring} strokeWidth="0.9" opacity="0.8" />
                <circle cx="40" cy="61" r="2.2" fill={c.ring} opacity="0.9" />

                {/* Scan beam */}
                <g clipPath="url(#grd-clip)">
                    <rect x="22" y="40" width="36" height="2.5" fill={c.ring} opacity="0.3" className="guardian-scan" />
                </g>

                {/* Body detail lines */}
                <line x1="28" y1="53" x2="34" y2="53" stroke="#334155" strokeWidth="0.45" opacity="0.5" />
                <line x1="46" y1="53" x2="52" y2="53" stroke="#334155" strokeWidth="0.45" opacity="0.5" />

                {/* Arms */}
                <circle cx="20" cy="51" r="3" fill="#1e293b" stroke="#334155" strokeWidth="0.7" />
                <rect x="11" y="48" width="10" height="21" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="0.6" />
                <rect x="9" y="67" width="14" height="6" rx="3" fill="#1e293b" stroke={c.primary} strokeWidth="0.4" />

                <circle cx="60" cy="51" r="3" fill="#1e293b" stroke="#334155" strokeWidth="0.7" />
                <rect x="59" y="48" width="10" height="21" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="0.6" />
                <rect x="57" y="67" width="14" height="6" rx="3" fill="#1e293b" stroke={c.primary} strokeWidth="0.4" />

                {/* Legs */}
                <rect x="26" y="77" width="10" height="17" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="0.6" />
                <rect x="24" y="91" width="14" height="6" rx="3" fill="#0f172a" stroke={c.primary} strokeWidth="0.4" />

                <rect x="44" y="77" width="10" height="17" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="0.6" />
                <rect x="42" y="91" width="14" height="6" rx="3" fill="#0f172a" stroke={c.primary} strokeWidth="0.4" />
            </g>

            {/* Energy particles from antenna */}
            <circle cx="38" cy="10" r="1.2" fill={c.ring} opacity="0" className="guardian-antenna" />
            <circle cx="42" cy="8"  r="0.9" fill={c.primary} opacity="0" className="guardian-antenna2" />
        </svg>
    )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function RootXGuardian() {
    const location = useLocation()
    const [minimized, setMinimized] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [tipIndex, setTipIndex] = useState(0)
    const [corner, setCorner] = useState<Corner>('br')
    const tipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const styleInjectedRef = useRef(false)

    // Current route config
    const route = ROUTE_CONFIG[location.pathname] ?? {
        mood: 'idle' as Mood,
        title: 'RootX Guardian',
        tips: [
            'I keep watch so you can focus.',
            'Navigate to any feature to get contextual tips.',
            'Tap me to see guidance for this page.',
        ],
    }
    const mood = route.mood
    const colors = MOOD_COLORS[mood]

    // Inject CSS once
    useEffect(() => {
        if (styleInjectedRef.current) return
        if (!document.getElementById('rootx-guardian-css')) {
            const el = document.createElement('style')
            el.id = 'rootx-guardian-css'
            el.textContent = GUARDIAN_CSS
            document.head.appendChild(el)
        }
        styleInjectedRef.current = true
    }, [])

    // Rotate tips every 5 seconds
    useEffect(() => {
        if (tipTimerRef.current) clearInterval(tipTimerRef.current)
        setTipIndex(0)
        tipTimerRef.current = setInterval(() => {
            setTipIndex((i) => (i + 1) % route.tips.length)
        }, 5000)
        return () => { if (tipTimerRef.current) clearInterval(tipTimerRef.current) }
    }, [location.pathname, route.tips.length])

    // Drift corner based on mood
    useEffect(() => {
        setCorner(MOOD_CORNERS[mood])
    }, [mood])

    if (dismissed) return null

    const pos = CORNER_POS[corner]
    const moodLabel: Record<Mood, string> = {
        idle: 'Standby',
        scanning: 'Scanning',
        alert: 'Alert',
        happy: 'All Clear',
        warning: 'Warning',
    }

    return (
        <motion.div
            key={corner}
            style={{
                position: 'fixed',
                zIndex: 9999,
                ...pos,
                // CSS variable for glow animation
                ['--grd-clr' as string]: colors.primary,
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            layout
        >
            <AnimatePresence mode="wait">
                {minimized ? (
                    /* ── Minimised orb ── */
                    <motion.button
                        key="orb"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => setMinimized(false)}
                        aria-label="Expand RootX Guardian"
                        className="guardian-orb guardian-glow rounded-full flex items-center justify-center shadow-xl"
                        style={{
                            width: 48,
                            height: 48,
                            background: `radial-gradient(circle, ${colors.ring}33, ${colors.glow}22)`,
                            border: `2px solid ${colors.primary}`,
                        }}
                    >
                        <svg width="22" height="22" viewBox="0 0 80 100" aria-hidden="true">
                            <circle cx="40" cy="40" r="18" fill={colors.glow} opacity="0.4" />
                            <circle cx="40" cy="40" r="10" fill={colors.primary} />
                            <circle cx="44" cy="36" r="3" fill="white" opacity="0.7" />
                        </svg>
                    </motion.button>
                ) : (
                    /* ── Expanded widget ── */
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, scale: 0.85, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 12 }}
                        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                        className="flex flex-col items-center gap-1"
                        style={{ minWidth: 210 }}
                    >
                        {/* Tip bubble */}
                        <motion.div
                            layout
                            className="rounded-2xl border px-3.5 py-2.5 shadow-2xl backdrop-blur-md w-full relative"
                            style={{
                                background: 'rgba(15,23,42,0.92)',
                                borderColor: `${colors.primary}55`,
                                boxShadow: `0 0 20px ${colors.primary}30, 0 4px 24px rgba(0,0,0,0.5)`,
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-2 gap-2">
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                                        style={{ background: colors.ring }}
                                    />
                                    <span
                                        className="text-[9px] font-mono font-bold uppercase tracking-[0.2em]"
                                        style={{ color: colors.ring }}
                                    >
                                        {moodLabel[mood]}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setMinimized(true)}
                                        aria-label="Minimise Guardian"
                                        className="p-0.5 rounded hover:opacity-70 transition-opacity text-slate-400"
                                    >
                                        <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => setDismissed(true)}
                                        aria-label="Dismiss Guardian"
                                        className="p-0.5 rounded hover:opacity-70 transition-opacity text-slate-400"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Page title */}
                            <p className="text-[10.5px] font-semibold text-slate-300 mb-1.5 leading-tight">
                                {route.title}
                            </p>

                            {/* Rotating tip */}
                            <div className="min-h-[38px] flex items-start">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={tipIndex}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.35 }}
                                        className="text-[11px] leading-[1.55] text-slate-400"
                                    >
                                        <span style={{ color: colors.ring }} className="mr-1">▶</span>
                                        {route.tips[tipIndex]}
                                    </motion.p>
                                </AnimatePresence>
                            </div>

                            {/* Tip dots */}
                            <div className="flex gap-1 mt-2 justify-center">
                                {route.tips.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setTipIndex(i)}
                                        aria-label={`Tip ${i + 1}`}
                                        className="rounded-full transition-all duration-200"
                                        style={{
                                            width: i === tipIndex ? 14 : 5,
                                            height: 5,
                                            background: i === tipIndex ? colors.ring : '#334155',
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Triangle pointer */}
                            <span
                                className="absolute -bottom-[5px] right-6 w-2.5 h-2.5 rotate-45"
                                style={{
                                    background: 'rgba(15,23,42,0.92)',
                                    borderRight: `1px solid ${colors.primary}55`,
                                    borderBottom: `1px solid ${colors.primary}55`,
                                }}
                            />
                        </motion.div>

                        {/* Robot */}
                        <div className="guardian-glow rounded-2xl p-1" style={{ ['--grd-clr' as string]: colors.primary }}>
                            <RobotSVG mood={mood} size={62} />
                        </div>

                        {/* Label */}
                        <p
                            className="text-[8.5px] font-mono font-bold uppercase tracking-[0.22em] opacity-60"
                            style={{ color: colors.ring }}
                        >
                            ⬡ RootX Guardian
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
