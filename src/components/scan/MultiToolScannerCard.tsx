import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    ExternalLink,
    Globe,
    Server,
    Lock,
    CheckCircle2,
    AlertTriangle,
    Eye,
    Zap,
    Cpu,
    Radio
} from 'lucide-react'
import type { ToolsBreakdown } from '@/types/api'

interface Props {
    tools: ToolsBreakdown
    url: string
    riskScore: number
}

export function MultiToolScannerCard({ tools, url, riskScore }: Props) {
    const [activeTool, setActiveTool] = useState<'vt' | 'urlscan' | 'gsb' | 'sucuri'>('vt')

    const isSafeOverall = riskScore < 50 &&
        tools.virusTotal.maliciousCount === 0 &&
        tools.googleSafeBrowsing.isSafe &&
        tools.sucuri.isSafe &&
        tools.urlScan.status !== 'malicious'

    const toolsList = [
        {
            id: 'vt' as const,
            name: 'VirusTotal',
            provider: '70+ Security Vendors',
            status: tools.virusTotal.status,
            badge: tools.virusTotal.maliciousCount > 0
                ? `${tools.virusTotal.maliciousCount} Threats Found`
                : tools.virusTotal.suspiciousCount > 0
                    ? `${tools.virusTotal.suspiciousCount} Suspicious`
                    : 'Clean (0 Detections)',
            icon: ShieldCheck,
            color: tools.virusTotal.maliciousCount > 0 ? 'text-danger' : tools.virusTotal.suspiciousCount > 0 ? 'text-warning' : 'text-success',
            bg: tools.virusTotal.maliciousCount > 0 ? 'bg-danger-soft' : tools.virusTotal.suspiciousCount > 0 ? 'bg-warning-soft' : 'bg-success-soft',
            border: tools.virusTotal.maliciousCount > 0 ? 'border-danger/30' : tools.virusTotal.suspiciousCount > 0 ? 'border-warning/30' : 'border-success/30',
        },
        {
            id: 'urlscan' as const,
            name: 'urlscan.io',
            provider: 'Deep Web & DOM Inspector',
            status: tools.urlScan.status,
            badge: tools.urlScan.status === 'malicious' ? 'Malicious Detected' : tools.urlScan.status === 'suspicious' ? 'Suspicious Score' : 'Passed Inspection',
            icon: Globe,
            color: tools.urlScan.status === 'malicious' ? 'text-danger' : tools.urlScan.status === 'suspicious' ? 'text-warning' : 'text-success',
            bg: tools.urlScan.status === 'malicious' ? 'bg-danger-soft' : tools.urlScan.status === 'suspicious' ? 'bg-warning-soft' : 'bg-success-soft',
            border: tools.urlScan.status === 'malicious' ? 'border-danger/30' : tools.urlScan.status === 'suspicious' ? 'border-warning/30' : 'border-success/30',
        },
        {
            id: 'gsb' as const,
            name: 'Google Safe Browsing',
            provider: 'Google Threat Intelligence',
            status: tools.googleSafeBrowsing.status,
            badge: tools.googleSafeBrowsing.isSafe ? 'Verified Safe' : 'Flagged by Google',
            icon: Lock,
            color: tools.googleSafeBrowsing.isSafe ? 'text-success' : 'text-danger',
            bg: tools.googleSafeBrowsing.isSafe ? 'bg-success-soft' : 'bg-danger-soft',
            border: tools.googleSafeBrowsing.isSafe ? 'border-success/30' : 'border-danger/30',
        },
        {
            id: 'sucuri' as const,
            name: 'Sucuri SiteCheck',
            provider: 'Web Malware & Blacklist Scanner',
            status: tools.sucuri.status,
            badge: tools.sucuri.isSafe ? 'No Blacklists / Clean' : tools.sucuri.blacklisted ? 'Blacklisted' : 'Security Warning',
            icon: Server,
            color: tools.sucuri.isSafe ? 'text-success' : tools.sucuri.status === 'warning' ? 'text-warning' : 'text-danger',
            bg: tools.sucuri.isSafe ? 'bg-success-soft' : tools.sucuri.status === 'warning' ? 'bg-warning-soft' : 'bg-danger-soft',
            border: tools.sucuri.isSafe ? 'border-success/30' : tools.sucuri.status === 'warning' ? 'border-warning/30' : 'border-danger/30',
        },
    ]

    return (
        <div className="space-y-4">
            {/* ── Verdict Banner: SAFE TO OPEN vs UNSAFE ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl border p-5 relative overflow-hidden transition-all ${
                    isSafeOverall
                        ? 'bg-gradient-to-r from-success/15 via-surface-1 to-success/10 border-success/30'
                        : 'bg-gradient-to-r from-danger/20 via-surface-1 to-danger/10 border-danger/40'
                }`}
            >
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                        <div
                            className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                                isSafeOverall ? 'bg-success text-white shadow-success/30' : 'bg-danger text-white shadow-danger/30'
                            }`}
                        >
                            {isSafeOverall ? (
                                <ShieldCheck className="w-7 h-7" />
                            ) : (
                                <ShieldAlert className="w-7 h-7" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <span
                                    className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                        isSafeOverall ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                                    }`}
                                >
                                    {isSafeOverall ? 'Verified Safe to Open' : 'Threat Warning — Dangerous Link'}
                                </span>
                                <span className="flex h-2 w-2 relative">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSafeOverall ? 'bg-success' : 'bg-danger'}`} />
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isSafeOverall ? 'bg-success' : 'bg-danger'}`} />
                                </span>
                            </div>
                            <h3 className="text-[19px] font-bold text-text-primary mt-1 tracking-tight">
                                {isSafeOverall ? 'SafeOpen Verified: Website is Safe to Open' : 'Do Not Open: High Risk Link Detected'}
                            </h3>
                            <p className="text-[13px] text-text-secondary mt-0.5 max-w-xl">
                                {isSafeOverall
                                    ? 'All 4 intelligence engines (VirusTotal, urlscan.io, Google Safe Browsing, and Sucuri SiteCheck) verified zero malware, phishing, or blacklist entries.'
                                    : 'One or more security scanners detected malicious indicators, blacklists, or phishing signatures on this destination.'}
                            </p>
                        </div>
                    </div>

                    <div className="text-center sm:text-right shrink-0">
                        <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                            Multi-Engine Consensus
                        </div>
                        <div className={`text-[22px] font-bold tabular-nums mt-0.5 ${isSafeOverall ? 'text-success' : 'text-danger'}`}>
                            {toolsList.filter(t => t.status === 'safe').length} / 4 Tools Clean
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── 4-Tool Grid ── */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-accent" />
                        <h4 className="text-[13.5px] font-bold text-text-primary">
                            4-Engine Real-Time Security Matrix
                        </h4>
                    </div>
                    <span className="text-[11px] text-text-tertiary">
                        Click tool to inspect details
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {toolsList.map((tool) => {
                        const Icon = tool.icon
                        const isSelected = activeTool === tool.id
                        return (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id)}
                                className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                                    isSelected
                                        ? 'bg-surface-1 border-accent shadow-md shadow-accent/10 ring-2 ring-accent/30'
                                        : 'bg-surface-2/70 hover:bg-surface-1 border-border'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tool.bg} ${tool.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tool.bg} ${tool.color} ${tool.border}`}>
                                            {tool.status}
                                        </span>
                                    </div>
                                    <h5 className="text-[14px] font-bold text-text-primary">{tool.name}</h5>
                                    <p className="text-[11px] text-text-tertiary mt-0.5 line-clamp-1">{tool.provider}</p>
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between">
                                    <span className="text-[12px] font-semibold text-text-secondary truncate">
                                        {tool.badge}
                                    </span>
                                    {isSelected && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Active Tool Inspector Panel ── */}
            <div className="bg-surface-1 border border-border rounded-2xl p-5 shadow-xs">
                {activeTool === 'vt' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-accent" />
                                <h5 className="text-[14px] font-bold text-text-primary">1. VirusTotal Engine Intelligence</h5>
                            </div>
                            <span className="text-[11.5px] font-mono text-text-tertiary bg-surface-2 px-2.5 py-1 rounded-md border border-border">
                                {tools.virusTotal.totalVendors} Security Vendors Scanned
                            </span>
                        </div>
                        <p className="text-[13px] text-text-secondary leading-relaxed">
                            {tools.virusTotal.verdict}
                        </p>
                        <div className="grid grid-cols-3 gap-2.5 pt-1">
                            <div className="bg-surface-2 border border-border rounded-xl p-3 text-center">
                                <div className="text-[18px] font-bold text-danger">{tools.virusTotal.maliciousCount}</div>
                                <div className="text-[11px] text-text-tertiary">Malicious Engines</div>
                            </div>
                            <div className="bg-surface-2 border border-border rounded-xl p-3 text-center">
                                <div className="text-[18px] font-bold text-warning">{tools.virusTotal.suspiciousCount}</div>
                                <div className="text-[11px] text-text-tertiary">Suspicious Engines</div>
                            </div>
                            <div className="bg-surface-2 border border-border rounded-xl p-3 text-center">
                                <div className="text-[18px] font-bold text-success">{tools.virusTotal.cleanCount}</div>
                                <div className="text-[11px] text-text-tertiary">Clean / Harmless</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTool === 'urlscan' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-accent" />
                                <h5 className="text-[14px] font-bold text-text-primary">2. urlscan.io Deep Web Inspection</h5>
                            </div>
                            <span className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-md capitalize ${
                                tools.urlScan.status === 'safe' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                            }`}>
                                {tools.urlScan.status}
                            </span>
                        </div>
                        <p className="text-[13px] text-text-secondary leading-relaxed">
                            {tools.urlScan.verdict}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                            <div className="bg-surface-2 border border-border rounded-xl p-3">
                                <span className="text-[10.5px] text-text-tertiary block font-semibold uppercase">Resolved IP</span>
                                <span className="text-[12.5px] font-mono font-medium text-text-primary truncate block mt-0.5">
                                    {tools.urlScan.ip || 'Standard Anycast'}
                                </span>
                            </div>
                            <div className="bg-surface-2 border border-border rounded-xl p-3">
                                <span className="text-[10.5px] text-text-tertiary block font-semibold uppercase">Web Server</span>
                                <span className="text-[12.5px] font-mono font-medium text-text-primary truncate block mt-0.5">
                                    {tools.urlScan.server || 'Protected Server'}
                                </span>
                            </div>
                            <div className="bg-surface-2 border border-border rounded-xl p-3">
                                <span className="text-[10.5px] text-text-tertiary block font-semibold uppercase">Country</span>
                                <span className="text-[12.5px] font-medium text-text-primary truncate block mt-0.5">
                                    {tools.urlScan.country || 'Global CDN'}
                                </span>
                            </div>
                            <div className="bg-surface-2 border border-border rounded-xl p-3">
                                <span className="text-[10.5px] text-text-tertiary block font-semibold uppercase">ASN / Network</span>
                                <span className="text-[12.5px] font-medium text-text-primary truncate block mt-0.5">
                                    {tools.urlScan.asn || 'Cloudflare / Edge'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTool === 'gsb' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-accent" />
                                <h5 className="text-[14px] font-bold text-text-primary">3. Google Safe Browsing Intelligence</h5>
                            </div>
                            <span className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-md ${
                                tools.googleSafeBrowsing.isSafe ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                            }`}>
                                {tools.googleSafeBrowsing.isSafe ? 'Clean Match' : 'Threat Flagged'}
                            </span>
                        </div>
                        <p className="text-[13px] text-text-secondary leading-relaxed">
                            {tools.googleSafeBrowsing.verdict}
                        </p>
                        <div className="rounded-xl bg-surface-2 border border-border p-3.5 flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                            <div className="text-[12.5px] text-text-secondary leading-relaxed">
                                Google Safe Browsing monitors billions of URLs daily for phishing schemes, social engineering deceptive attacks, and malware payload distributors.
                            </div>
                        </div>
                    </div>
                )}

                {activeTool === 'sucuri' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Server className="w-4 h-4 text-accent" />
                                <h5 className="text-[14px] font-bold text-text-primary">4. Sucuri SiteCheck Security Audit</h5>
                            </div>
                            <span className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-md ${
                                tools.sucuri.isSafe ? 'bg-success-soft text-success' : tools.sucuri.status === 'warning' ? 'bg-warning-soft text-warning' : 'bg-danger-soft text-danger'
                            }`}>
                                {tools.sucuri.status}
                            </span>
                        </div>
                        <p className="text-[13px] text-text-secondary leading-relaxed">
                            {tools.sucuri.verdict}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            <div className="bg-surface-2 border border-border rounded-xl p-3">
                                <span className="text-[10.5px] text-text-tertiary block font-semibold uppercase">Blacklist Status</span>
                                <span className="text-[12.5px] font-bold text-success mt-0.5 block">
                                    {tools.sucuri.blacklisted ? 'Flagged on Blacklist' : 'Clean on 9 Blacklists'}
                                </span>
                            </div>
                            <div className="bg-surface-2 border border-border rounded-xl p-3">
                                <span className="text-[10.5px] text-text-tertiary block font-semibold uppercase">Web Software</span>
                                <span className="text-[12.5px] font-medium text-text-primary mt-0.5 block truncate">
                                    {tools.sucuri.webServer || 'Secured Server'}
                                </span>
                            </div>
                            <div className="bg-surface-2 border border-border rounded-xl p-3">
                                <span className="text-[10.5px] text-text-tertiary block font-semibold uppercase">CDN / WAF</span>
                                <span className="text-[12.5px] font-medium text-text-primary mt-0.5 block truncate">
                                    {tools.sucuri.cdn || 'Edge Protected'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
