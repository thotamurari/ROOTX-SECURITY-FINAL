import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield,
    AlertTriangle,
    CheckCircle2,
    Sparkles,
    ScanLine,
    BrainCircuit,
    ChevronRight,
    X,
    Minimize2,
    Maximize2,
    History,
    Smartphone,
    Eye,
} from 'lucide-react'
import type { ScanHistoryItem } from '@/stores/scanHistoryStore'

export type CatMood = 'idle' | 'happy' | 'alert' | 'scanning'

interface CyberCatAssistantProps {
    scans?: ScanHistoryItem[]
    securityScore?: number
    isScanning?: boolean
    embedded?: boolean
    onNavigate?: (path: string) => void
}

/**
 * Robot Cat Mascot SVG with animated LED eyes, cyber-ears, whiskers,
 * glowing collar crest, and articulated cyber-tail.
 */
export function RobotCatSVG({
    mood = 'idle',
    size = 120,
    className = '',
}: {
    mood?: CatMood
    size?: number
    className?: string
}) {
    // Dynamic palette based on cyber state
    const colors = {
        idle: { primary: '#22d3ee', glow: '#06b6d4', eyeGlow: '#38bdf8', aura: 'rgba(34, 211, 238, 0.15)' },
        happy: { primary: '#10b981', glow: '#059669', eyeGlow: '#34d399', aura: 'rgba(16, 185, 129, 0.18)' },
        alert: { primary: '#ef4444', glow: '#dc2626', eyeGlow: '#f87171', aura: 'rgba(239, 68, 68, 0.22)' },
        scanning: { primary: '#3b82f6', glow: '#2563eb', eyeGlow: '#60a5fa', aura: 'rgba(59, 130, 246, 0.2)' },
    }[mood]

    return (
        <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size * 1.1 }}>
            {/* Ambient Holographic Ring */}
            <div
                className="absolute inset-x-2 bottom-0 h-4 rounded-full blur-sm transition-all duration-500"
                style={{
                    background: `radial-gradient(ellipse at center, ${colors.primary} 0%, transparent 70%)`,
                    opacity: mood === 'alert' ? 0.8 : 0.45,
                }}
            />

            <svg
                viewBox="0 0 120 130"
                width={size}
                height={size * 1.08}
                className="overflow-visible"
                style={{ filter: `drop-shadow(0 4px 14px ${colors.aura})` }}
                aria-hidden="true"
            >
                <defs>
                    {/* Metal body gradients */}
                    <linearGradient id="cat-body-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="60%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#090d16" />
                    </linearGradient>

                    <linearGradient id="cat-head-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="40%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>

                    <linearGradient id="cat-ear-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>

                    {/* Visor shield gradient */}
                    <linearGradient id="cat-visor-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#020617" />
                        <stop offset="100%" stopColor="#0b1329" />
                    </linearGradient>

                    {/* Laser filter */}
                    <filter id="cat-neon-glow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="1.8" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* ── Hover Platform Disks ── */}
                <g className="cat-hover-pad">
                    <ellipse cx="60" cy="116" rx="36" ry="6" fill="#090d16" stroke={colors.primary} strokeWidth="0.8" opacity="0.6" />
                    <ellipse cx="60" cy="116" rx="26" ry="4" fill="none" stroke={colors.eyeGlow} strokeWidth="0.5" strokeDasharray="3 3" opacity="0.8" />
                </g>

                {/* ── Animated Cyber Cat Body Group ── */}
                <g className="cat-floating-body">
                    {/* Tail: segmented robotic tail swaying behind */}
                    <g className="cat-tail">
                        <path
                            d="M 82 92 Q 106 88 100 68 Q 96 52 108 42"
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="4"
                            strokeLinecap="round"
                        />
                        <path
                            d="M 82 92 Q 106 88 100 68 Q 96 52 108 42"
                            fill="none"
                            stroke={colors.primary}
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            opacity="0.7"
                        />
                        {/* Glowing tip of tail */}
                        <circle cx="108" cy="42" r="3.5" fill={colors.eyeGlow} filter="url(#cat-neon-glow)" />
                        <circle cx="108" cy="42" r="1.5" fill="#ffffff" />
                    </g>

                    {/* Cat Torso / Chassis */}
                    <rect x="36" y="68" width="48" height="42" rx="14" fill="url(#cat-body-grad)" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.4" />

                    {/* Chest Armor Plate */}
                    <path
                        d="M 44 74 L 76 74 L 70 96 L 50 96 Z"
                        fill="#0b1329"
                        stroke={colors.primary}
                        strokeWidth="0.6"
                        opacity="0.7"
                    />

                    {/* Central Core Reactor / Shield Crest */}
                    <g filter="url(#cat-neon-glow)">
                        <circle cx="60" cy="85" r="5" fill="#090d16" stroke={colors.primary} strokeWidth="1" />
                        <circle cx="60" cy="85" r="2.8" fill={colors.eyeGlow} className="cat-core-pulse" />
                    </g>

                    {/* Cyber Collar with RootX Shield */}
                    <rect x="42" y="62" width="36" height="5.5" rx="2.5" fill="#0b1329" stroke={colors.primary} strokeWidth="0.8" />
                    <circle cx="60" cy="65" r="2.5" fill={colors.eyeGlow} />

                    {/* Front Paws */}
                    <ellipse cx="46" cy="110" rx="8" ry="5.5" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                    <line x1="44" y1="110" x2="44" y2="114" stroke={colors.primary} strokeWidth="0.6" opacity="0.6" />
                    <line x1="48" y1="110" x2="48" y2="114" stroke={colors.primary} strokeWidth="0.6" opacity="0.6" />

                    <ellipse cx="74" cy="110" rx="8" ry="5.5" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                    <line x1="72" y1="110" x2="72" y2="114" stroke={colors.primary} strokeWidth="0.6" opacity="0.6" />
                    <line x1="76" y1="110" x2="76" y2="114" stroke={colors.primary} strokeWidth="0.6" opacity="0.6" />

                    {/* ── Robotic Cat Ears ── */}
                    {/* Left Ear */}
                    <g className="cat-ear-left">
                        <path d="M 32 30 L 46 8 L 52 28 Z" fill="url(#cat-ear-grad)" stroke="#3b82f6" strokeWidth="0.9" strokeOpacity="0.5" />
                        <path d="M 36 27 L 46 13 L 50 26 Z" fill="#090d16" />
                        <line x1="46" y1="15" x2="46" y2="24" stroke={colors.primary} strokeWidth="1" opacity="0.8" />
                    </g>

                    {/* Right Ear */}
                    <g className="cat-ear-right">
                        <path d="M 68 28 L 74 8 L 88 30 Z" fill="url(#cat-ear-grad)" stroke="#3b82f6" strokeWidth="0.9" strokeOpacity="0.5" />
                        <path d="M 70 26 L 74 13 L 84 27 Z" fill="#090d16" />
                        <line x1="74" y1="15" x2="74" y2="24" stroke={colors.primary} strokeWidth="1" opacity="0.8" />
                    </g>

                    {/* Antenna Transmitter Node on top of head */}
                    <line x1="60" y1="20" x2="60" y2="12" stroke="#475569" strokeWidth="1.2" />
                    <circle cx="60" cy="11" r="2" fill={colors.eyeGlow} filter="url(#cat-neon-glow)" />

                    {/* ── Head Chassis ── */}
                    <rect x="28" y="24" width="64" height="42" rx="18" fill="url(#cat-head-grad)" stroke="#3b82f6" strokeWidth="1.2" strokeOpacity="0.4" />

                    {/* Cyber Cheeks Highlight */}
                    <path d="M 30 42 Q 33 50 38 56" fill="none" stroke={colors.primary} strokeWidth="0.8" opacity="0.3" />
                    <path d="M 90 42 Q 87 50 82 56" fill="none" stroke={colors.primary} strokeWidth="0.8" opacity="0.3" />

                    {/* ── LED Visor Display Screen ── */}
                    <rect x="36" y="32" width="48" height="24" rx="8" fill="url(#cat-visor-grad)" stroke="#1e293b" strokeWidth="0.9" />

                    {/* Visor Scanline Effect */}
                    <line x1="38" y1="38" x2="82" y2="38" stroke={colors.primary} strokeWidth="0.3" opacity="0.25" />
                    <line x1="38" y1="44" x2="82" y2="44" stroke={colors.primary} strokeWidth="0.3" opacity="0.25" />
                    <line x1="38" y1="50" x2="82" y2="50" stroke={colors.primary} strokeWidth="0.3" opacity="0.25" />

                    {/* ── EXPRESSIVE LED EYES (Mood-Aware) ── */}
                    {mood === 'happy' && (
                        /* Happy joyful curved eyes: ^ ^ */
                        <g filter="url(#cat-neon-glow)">
                            <path d="M 44 47 Q 49 39 54 47" fill="none" stroke={colors.eyeGlow} strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M 66 47 Q 71 39 76 47" fill="none" stroke={colors.eyeGlow} strokeWidth="2.5" strokeLinecap="round" />
                        </g>
                    )}

                    {mood === 'alert' && (
                        /* Alert sharp eyes + warning flash: > < */
                        <g filter="url(#cat-neon-glow)" className="cat-eye-blink">
                            {/* Left sharp eye */}
                            <path d="M 43 41 L 53 45 L 45 49 Z" fill={colors.eyeGlow} />
                            {/* Right sharp eye */}
                            <path d="M 77 41 L 67 45 L 75 49 Z" fill={colors.eyeGlow} />
                        </g>
                    )}

                    {mood === 'scanning' && (
                        /* Scanning laser visor beam */
                        <g>
                            <circle cx="49" cy="44" r="5" fill="none" stroke={colors.eyeGlow} strokeWidth="1.5" filter="url(#cat-neon-glow)" />
                            <circle cx="49" cy="44" r="2" fill="#ffffff" />
                            <circle cx="71" cy="44" r="5" fill="none" stroke={colors.eyeGlow} strokeWidth="1.5" filter="url(#cat-neon-glow)" />
                            <circle cx="71" cy="44" r="2" fill="#ffffff" />
                            {/* Sweeping laser bar */}
                            <rect x="36" y="32" width="48" height="2" fill={colors.primary} className="cat-laser-scan" filter="url(#cat-neon-glow)" opacity="0.8" />
                        </g>
                    )}

                    {mood === 'idle' && (
                        /* Normal blinking LED oculars */
                        <g filter="url(#cat-neon-glow)" className="cat-eye-blink">
                            {/* Left Eye */}
                            <circle cx="49" cy="44" r="4.5" fill={colors.eyeGlow} />
                            <circle cx="50.5" cy="42.5" r="1.4" fill="#ffffff" />

                            {/* Right Eye */}
                            <circle cx="71" cy="44" r="4.5" fill={colors.eyeGlow} />
                            <circle cx="72.5" cy="42.5" r="1.4" fill="#ffffff" />
                        </g>
                    )}

                    {/* Little robotic cat nose */}
                    <polygon points="58,52 62,52 60,54" fill={colors.primary} opacity="0.8" />

                    {/* Cute cyber cat mouth: :3 */}
                    <path
                        d="M 56 55 Q 58 58 60 56 Q 62 58 64 55"
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        opacity="0.85"
                    />

                    {/* ── Optical Fiber Whiskers ── */}
                    {/* Left Whiskers */}
                    <g className="cat-whiskers-left">
                        <line x1="36" y1="48" x2="16" y2="44" stroke={colors.primary} strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
                        <circle cx="16" cy="44" r="1" fill={colors.eyeGlow} />

                        <line x1="36" y1="52" x2="14" y2="52" stroke={colors.primary} strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
                        <circle cx="14" cy="52" r="1" fill={colors.eyeGlow} />

                        <line x1="36" y1="56" x2="18" y2="60" stroke={colors.primary} strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
                        <circle cx="18" cy="60" r="1" fill={colors.eyeGlow} />
                    </g>

                    {/* Right Whiskers */}
                    <g className="cat-whiskers-right">
                        <line x1="84" y1="48" x2="104" y2="44" stroke={colors.primary} strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
                        <circle cx="104" cy="44" r="1" fill={colors.eyeGlow} />

                        <line x1="84" y1="52" x2="106" y2="52" stroke={colors.primary} strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
                        <circle cx="106" cy="52" r="1" fill={colors.eyeGlow} />

                        <line x1="84" y1="56" x2="102" y2="60" stroke={colors.primary} strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
                        <circle cx="102" cy="60" r="1" fill={colors.eyeGlow} />
                    </g>
                </g>
            </svg>

            {/* Embedded CSS keyframe animations for cat mascot */}
            <style>{`
                @keyframes catHover {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-7px); }
                }
                @keyframes catTailSway {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(-8deg); }
                }
                @keyframes catBlink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                }
                @keyframes catLaser {
                    0% { transform: translateY(0); opacity: 0.9; }
                    50% { opacity: 0.4; }
                    100% { transform: translateY(22px); opacity: 0.9; }
                }
                @keyframes catCorePulse {
                    0%, 100% { transform: scale(1); opacity: 0.7; }
                    50% { transform: scale(1.3); opacity: 1; }
                }
                .cat-floating-body {
                    animation: catHover 3.2s ease-in-out infinite;
                    transform-origin: center;
                }
                .cat-tail {
                    animation: catTailSway 2.8s ease-in-out infinite;
                    transform-origin: 82px 92px;
                }
                .cat-eye-blink {
                    animation: catBlink 4.5s ease-in-out infinite;
                    transform-origin: 60px 44px;
                }
                .cat-laser-scan {
                    animation: catLaser 1.8s ease-in-out infinite;
                }
                .cat-core-pulse {
                    animation: catCorePulse 2s ease-in-out infinite;
                    transform-origin: 60px 85px;
                }
                @media (prefers-reduced-motion: reduce) {
                    .cat-floating-body, .cat-tail, .cat-eye-blink, .cat-laser-scan, .cat-core-pulse {
                        animation: none !important;
                    }
                }
            `}</style>
        </div>
    )
}

/**
 * Interactive Cyber-Cat Assistant for RootX-Security Dashboard.
 * Can be docked embedded in the dashboard or floating above the bottom navigation.
 */
export function CyberCatAssistant({
    scans = [],
    securityScore = 92,
    isScanning = false,
    embedded = false,
    onNavigate,
}: CyberCatAssistantProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [speechIndex, setSpeechIndex] = useState(0)

    // Compute dynamic telemetry from actual scans
    const stats = useMemo(() => {
        const total = scans.length
        const threats = scans.filter(
            (s) => s.riskScore >= 50 || s.threatLevel === 'high' || s.threatLevel === 'critical'
        )
        const safeCount = scans.filter(
            (s) => s.riskScore < 30 || s.threatLevel === 'safe'
        ).length
        const latestThreat = threats[0] || null

        let currentMood: CatMood = 'idle'
        if (isScanning) {
            currentMood = 'scanning'
        } else if (threats.length > 0) {
            currentMood = 'alert'
        } else if (total > 0 && threats.length === 0) {
            currentMood = 'happy'
        }

        return { total, threats, safeCount, latestThreat, currentMood }
    }, [scans, isScanning])

    // Dynamic, contextual messages based on REAL scan state
    const speechMessages = useMemo(() => {
        if (isScanning) {
            return [
                "Scanning live perimeter telemetry... analyzing target payloads!",
                "Neural heuristics active. Checking signatures against global threat intelligence.",
            ]
        }
        if (stats.threats.length > 0) {
            return [
                `Warning! Detected ${stats.threats.length} high-severity threat${stats.threats.length > 1 ? 's' : ''} requiring your review.`,
                `Critical finding on "${stats.latestThreat?.input || 'target'}" (Risk: ${stats.latestThreat?.riskScore || 79}). Mitigation advised!`,
                "Tap 'Review Threats' below to inspect malicious indicators and quarantine rules.",
            ]
        }
        if (stats.total > 0) {
            return [
                `Purr-fect security posture! All ${stats.total} verified scans are clean.`,
                `Security Score: ${securityScore}/100. Behavioral shields operating optimally.`,
                "Device telemetry is stable. No rogue processes or network anomalies detected.",
            ]
        }
        return [
            "Hey Agent! I'm your RootX Cyber-Cat. Ready to patrol your perimeter?",
            "Run your first core scan to activate real-time threat intelligence.",
            "I'll actively monitor all URL sweeps, APK analyses, and device hardening states.",
        ]
    }, [stats, securityScore, isScanning])

    // Cycle messages periodically
    useEffect(() => {
        if (speechMessages.length <= 1) return
        const timer = setInterval(() => {
            setSpeechIndex((prev) => (prev + 1) % speechMessages.length)
        }, 6500)
        return () => clearInterval(timer)
    }, [speechMessages.length])

    const handleAction = (path: string) => {
        if (onNavigate) {
            onNavigate(path)
        }
    }

    // ── EMBEDDED DASHBOARD BANNER MODE ──
    if (embedded) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-surface-1 border border-border p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-accent/30">
                {/* Ambient glow accent */}
                <div
                    className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full blur-3xl pointer-events-none"
                    style={{
                        background:
                            stats.currentMood === 'alert'
                                ? 'rgba(239, 68, 68, 0.12)'
                                : 'rgba(34, 211, 238, 0.12)',
                    }}
                />

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    {/* Interactive Cat Mascot */}
                    <div
                        onClick={() => setIsOpen(!isOpen)}
                        className="cursor-pointer group relative shrink-0 transition-transform hover:scale-105 active:scale-95"
                        role="button"
                        tabIndex={0}
                        aria-label="Interact with RootX Cyber-Cat assistant"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                setIsOpen(!isOpen)
                            }
                        }}
                    >
                        <RobotCatSVG mood={stats.currentMood} size={90} />
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold tracking-wider uppercase bg-surface-2 border border-border text-text-secondary whitespace-nowrap shadow-xs">
                            Unit-01
                        </span>
                    </div>

                    {/* Speech / Assistant Dialogue */}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-accent-soft text-accent border border-accent/20">
                                <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
                                CYBER-CAT ASSISTANT
                            </span>
                            <span
                                className={`text-[10.5px] font-medium font-mono uppercase px-2 py-0.5 rounded-full border ${
                                    stats.currentMood === 'alert'
                                        ? 'bg-danger-soft text-danger border-danger/30'
                                        : stats.currentMood === 'happy'
                                        ? 'bg-success-soft text-success border-success/30'
                                        : 'bg-info-soft text-info border-info/30'
                                }`}
                            >
                                {stats.currentMood === 'alert'
                                    ? '● THREAT ALERT'
                                    : stats.currentMood === 'happy'
                                    ? '● ALL SAFE'
                                    : '● PATROLLING'}
                            </span>
                        </div>

                        <p className="text-[13.5px] font-medium text-text-primary leading-relaxed">
                            {speechMessages[speechIndex % speechMessages.length]}
                        </p>

                        {/* Quick action buttons right inside the banner */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3.5">
                            <button
                                type="button"
                                onClick={() => handleAction('/scan')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-accent text-white hover:bg-accent-hover transition-colors shadow-xs"
                            >
                                <ScanLine className="w-3.5 h-3.5" />
                                Run Scan
                            </button>

                            {stats.threats.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => handleAction('/scan-history')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-danger-soft text-danger border border-danger/30 hover:bg-danger/20 transition-colors"
                                >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Review {stats.threats.length} Threat{stats.threats.length > 1 ? 's' : ''}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleAction('/rootx-ai')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-surface-2 text-text-primary border border-border hover:border-border-strong transition-colors"
                                >
                                    <BrainCircuit className="w-3.5 h-3.5 text-accent" />
                                    Ask RootX-AI
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => handleAction('/android-sec')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-surface-2 text-text-secondary border border-border hover:text-text-primary transition-colors"
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                AndroidSEC
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ── FLOATING COMPANION MODE (Desktop & Mobile Safe Position) ──
    return (
        <aside aria-label="RootX Cyber-Cat Security Assistant">
            {/* Mascot Avatar Trigger (Desktop bottom-right; Mobile above bottom navigation) */}
            <div
                className="fixed z-40 transition-all duration-300 right-4 sm:right-6 bottom-20 lg:bottom-6"
            >
                <AnimatePresence>
                    {!isOpen && (
                        <motion.button
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setIsOpen(true)}
                            aria-expanded={isOpen}
                            aria-label={`RootX Cyber-Cat Assistant (${stats.currentMood} mood). Click to open security companion panel.`}
                            className="group relative flex items-center justify-center p-2 rounded-2xl bg-surface-1/90 backdrop-blur-xl border border-border hover:border-accent shadow-md transition-all duration-200"
                        >
                            {/* Notification pip if active threats */}
                            {stats.threats.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center border-2 border-surface-1 animate-pulse">
                                    {stats.threats.length}
                                </span>
                            )}

                            <RobotCatSVG mood={stats.currentMood} size={64} />

                            {/* Tooltip hint on hover */}
                            <span className="sr-only">Open RootX Assistant</span>
                            <span
                                className="pointer-events-none absolute right-full mr-3 px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-[11px] font-medium text-text-primary shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap hidden sm:block"
                                aria-hidden="true"
                            >
                                Chat with Cyber-Cat
                            </span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Interactive Assistant Flyout Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cybercat-title"
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="fixed z-50 right-3 sm:right-6 bottom-20 lg:bottom-6 w-[94vw] sm:w-[380px] max-h-[82vh] flex flex-col rounded-2xl bg-surface-1/95 backdrop-blur-xl border border-border shadow-lg overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-surface-2/80 border-b border-border">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-accent" />
                                </div>
                                <div className="min-w-0">
                                    <h3 id="cybercat-title" className="text-[13px] font-bold text-text-primary uppercase tracking-wide truncate">
                                        RootX Cyber-Cat
                                    </h3>
                                    <p className="text-[10.5px] text-text-tertiary font-mono">
                                        Tactical Assistant // v2.6
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-3 transition-colors"
                                    aria-label={isMinimized ? "Expand panel" : "Minimize panel"}
                                >
                                    {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-3 transition-colors"
                                    aria-label="Close assistant"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {/* Cat Avatar & Speech Bubble */}
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0 pt-1">
                                        <RobotCatSVG mood={stats.currentMood} size={68} />
                                    </div>
                                    <div className="flex-1 bg-surface-2 border border-border rounded-2xl p-3 shadow-xs">
                                        <p className="text-[12.5px] text-text-primary leading-relaxed">
                                            {speechMessages[speechIndex % speechMessages.length]}
                                        </p>
                                        <span className="block text-[10px] text-text-tertiary mt-1.5 font-mono">
                                            Telemetry synced • Score: {securityScore}
                                        </span>
                                    </div>
                                </div>

                                {/* Live Security Snapshot Grid */}
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
                                        <p className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider">Score</p>
                                        <p className="text-[16px] font-bold text-accent mt-0.5">{securityScore}</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
                                        <p className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider">Scans</p>
                                        <p className="text-[16px] font-bold text-text-primary mt-0.5">{stats.total}</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
                                        <p className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider">Threats</p>
                                        <p className={`text-[16px] font-bold mt-0.5 ${stats.threats.length > 0 ? 'text-danger' : 'text-success'}`}>
                                            {stats.threats.length}
                                        </p>
                                    </div>
                                </div>

                                {/* Active Threat Highlight (if detected) */}
                                {stats.latestThreat && (
                                    <div className="p-3 rounded-xl bg-danger-soft border border-danger/30 space-y-2">
                                        <div className="flex items-center gap-2 text-danger">
                                            <AlertTriangle className="w-4 h-4 shrink-0" />
                                            <span className="text-[11.5px] font-bold uppercase tracking-wider">
                                                Active Threat Alert
                                            </span>
                                        </div>
                                        <p className="text-[12px] font-mono text-text-primary truncate">
                                            {stats.latestThreat.input}
                                        </p>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-danger font-semibold">
                                                Risk Score: {stats.latestThreat.riskScore}/100
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsOpen(false)
                                                    handleAction('/scan-history')
                                                }}
                                                className="text-text-primary hover:text-accent font-semibold underline underline-offset-2 flex items-center gap-1"
                                            >
                                                Inspect <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Suggested Quick Commands */}
                                <div className="space-y-1.5 pt-1">
                                    <p className="text-[11px] font-bold uppercase text-text-tertiary tracking-wider px-1">
                                        Suggested Operations
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsOpen(false)
                                            handleAction('/scan')
                                        }}
                                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border hover:border-accent/40 text-left transition-all group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                                                <ScanLine className="w-4 h-4" />
                                            </span>
                                            <div>
                                                <p className="text-[12.5px] font-semibold text-text-primary">Run Core Sweep</p>
                                                <p className="text-[10.5px] text-text-secondary">Scan URL, IP, or APK payload</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsOpen(false)
                                            handleAction('/scan-history')
                                        }}
                                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border hover:border-accent/40 text-left transition-all group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-info-soft text-info flex items-center justify-center">
                                                <History className="w-4 h-4" />
                                            </span>
                                            <div>
                                                <p className="text-[12.5px] font-semibold text-text-primary">Audit Scan Logs</p>
                                                <p className="text-[10.5px] text-text-secondary">Review synchronized cloud telemetry</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-info transition-colors" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsOpen(false)
                                            handleAction('/rootx-ai')
                                        }}
                                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border hover:border-accent/40 text-left transition-all group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-success-soft text-success flex items-center justify-center">
                                                <BrainCircuit className="w-4 h-4" />
                                            </span>
                                            <div>
                                                <p className="text-[12.5px] font-semibold text-text-primary">Ask RootX-AI</p>
                                                <p className="text-[10.5px] text-text-secondary">AI behavioural threat consultation</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-success transition-colors" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsOpen(false)
                                            handleAction('/apk-scanner')
                                        }}
                                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border hover:border-accent/40 text-left transition-all group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-warning-soft text-warning flex items-center justify-center">
                                                <Shield className="w-4 h-4" />
                                            </span>
                                            <div>
                                                <p className="text-[12.5px] font-semibold text-text-primary">APK Static Analyzer</p>
                                                <p className="text-[10.5px] text-text-secondary">Inspect packages and hidden permissions</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-warning transition-colors" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    )
}
