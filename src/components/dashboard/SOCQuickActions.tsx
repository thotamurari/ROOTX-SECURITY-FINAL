import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    ScanLine,
    Smartphone,
    FileCode,
    History,
    BrainCircuit,
    Bell,
    ChevronRight,
    Zap,
} from 'lucide-react'
import { Card, CardTitle, CardDescription } from '@/components/shared/Card'

export function SOCQuickActions() {
    const navigate = useNavigate()

    const actions = [
        {
            title: 'Launch Security Scan',
            description: 'Sweep URLs, domains, and suspicious IPs',
            path: '/scan',
            icon: ScanLine,
            color: '#3b82f6',
            badge: 'Primary Sweep',
            tone: 'bg-accent-soft text-accent border-accent/20',
        },
        {
            title: 'AndroidSEC Hardening',
            description: 'Evaluate permissions, root posture & OS risks',
            path: '/android-sec',
            icon: Smartphone,
            color: '#10b981',
            badge: 'OS Shield',
            tone: 'bg-success-soft text-success border-success/20',
        },
        {
            title: 'APK Static Analyzer',
            description: 'Decompile packages, inspect manifests & hashes',
            path: '/apk-scanner',
            icon: FileCode,
            color: '#a855f7',
            badge: 'Binary Audit',
            tone: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        },
        {
            title: 'Audit Scan History',
            description: 'Inspect synchronized cloud scan records',
            path: '/scan-history',
            icon: History,
            color: '#38bdf8',
            badge: 'Cloud Sync',
            tone: 'bg-info-soft text-info border-info/20',
        },
        {
            title: 'RootX-AI Intelligence',
            description: 'Behavioral consultation with neural engine',
            path: '/rootx-ai',
            icon: BrainCircuit,
            color: '#6366f1',
            badge: 'AI Guardian',
            tone: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        },
        {
            title: 'Threat Alerts & Inbox',
            description: 'Review critical CVE advisories and notifications',
            path: '/inbox',
            icon: Bell,
            color: '#ef4444',
            badge: 'Security Feed',
            tone: 'bg-danger-soft text-danger border-danger/20',
        },
    ]

    return (
        <Card padding="md">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                    </span>
                    <div>
                        <CardTitle className="text-[15px]">Security Operations Shortcuts</CardTitle>
                        <CardDescription className="text-[12px]">Direct tactical command modules</CardDescription>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {actions.map((act, i) => (
                    <motion.button
                        key={act.title}
                        type="button"
                        onClick={() => navigate(act.path)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        className="group relative flex flex-col justify-between p-3.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border hover:border-accent/40 text-left transition-all duration-150 shadow-xs"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <span
                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border"
                                style={{ backgroundColor: `${act.color}15`, color: act.color }}
                            >
                                <act.icon className="w-4 h-4" />
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${act.tone}`}>
                                {act.badge}
                            </span>
                        </div>

                        <div className="mt-3">
                            <p className="text-[13.5px] font-semibold text-text-primary group-hover:text-accent transition-colors">
                                {act.title}
                            </p>
                            <p className="text-[11.5px] text-text-secondary mt-0.5 line-clamp-2">
                                {act.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-border/60 text-[11px] text-text-tertiary group-hover:text-text-primary">
                            <span>Execute Module</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:text-accent transition-all" />
                        </div>
                    </motion.button>
                ))}
            </div>
        </Card>
    )
}
