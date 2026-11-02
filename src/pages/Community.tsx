import { motion } from 'framer-motion'
import {
    Users, ChevronLeft, MessageSquare, Instagram, Youtube, MessageCircle,
    ExternalLink, ShieldCheck, Zap, BellRing, Sparkles, BookOpen, Share2, Award
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { PageHeader } from '@/components/shared/PageHeader'

const OFFICIAL_CHANNELS = [
    {
        id: 'discord',
        name: 'Discord Cyber Command',
        tag: '@RootXSecurity',
        url: 'https://discord.com/channels/1540071910627614844/1540071911848022029',
        description: 'Join real-time incident analysis rooms, live malware discussions, reverse engineering sessions, and security intelligence exchanges.',
        badge: 'Active Hub',
        accentColor: 'from-[#5865F2]/20 to-surface-1 border-[#5865F2]/40',
        textColor: 'text-[#5865F2]',
        buttonClass: 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
        icon: MessageSquare,
        metrics: '24/7 Security Ops & Chat',
    },
    {
        id: 'instagram',
        name: 'Instagram Intelligence',
        tag: '@murari_tech_world_75',
        url: 'https://www.instagram.com/murari_tech_world_75/',
        description: 'Daily cybersecurity awareness reels, scam exposure breakdowns, privacy tips, and modern cyber defense tutorials for mobile & web.',
        badge: 'Official Creator',
        accentColor: 'from-[#E1306C]/20 to-surface-1 border-[#E1306C]/40',
        textColor: 'text-[#E1306C]',
        buttonClass: 'bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white',
        icon: Instagram,
        metrics: 'Daily Cyber Tips & Updates',
    },
    {
        id: 'youtube',
        name: 'YouTube Defense Labs',
        tag: '@Ethical.Hacker.Murari',
        url: 'https://www.youtube.com/@Ethical.Hacker.Murari',
        description: 'Comprehensive video tutorials on ethical hacking, zero-day threat analysis, APK security audits, and penetration testing.',
        badge: 'Video Masterclasses',
        accentColor: 'from-[#FF0000]/20 to-surface-1 border-[#FF0000]/40',
        textColor: 'text-[#FF0000]',
        buttonClass: 'bg-[#FF0000] hover:bg-[#CC0000] text-white',
        icon: Youtube,
        metrics: 'In-Depth Hacking Tutorials',
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp Incident Alerts',
        tag: 'RootX Cyber Defense Group',
        url: 'https://chat.whatsapp.com/DaPw8TGiNHQHf3jEwCag7W',
        description: 'Instant alerts on active phishing campaigns, high-risk malware APKs, scam numbers, and direct guidance from security researchers.',
        badge: 'Instant Alerts',
        accentColor: 'from-emerald-500/20 to-surface-1 border-emerald-500/40',
        textColor: 'text-emerald-400',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        icon: MessageCircle,
        metrics: 'Fastest Breaking Alert Network',
    },
]

export default function Community() {
    const navigate = useNavigate()

    return (
        <div className="pb-32 lg:pb-8 max-w-4xl mx-auto space-y-6">
            {/* Back link */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
                className="-ml-2"
            >
                Dashboard
            </Button>

            {/* Header */}
            <PageHeader
                title="RootX Community & Research Network"
                description="Connect with cybersecurity researchers, stream video breakdowns, join live discord threat rooms, and access official guidance."
                icon={<Users className="w-5 h-5 text-accent" />}
            />

            {/* Hero Hub Overview */}
            <Card padding="lg" className="relative overflow-hidden bg-gradient-to-br from-accent/15 via-surface-1 to-surface-1 border-accent/30 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0 border border-accent/40 shadow-inner">
                            <Sparkles className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold text-text-primary">Official Research & Social Channels</h2>
                                <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent text-[10px] font-extrabold uppercase tracking-wide border border-accent/30">
                                    Verified
                                </span>
                            </div>
                            <p className="text-xs sm:text-[13px] text-text-secondary mt-1 max-w-xl leading-relaxed">
                                Join our multi-channel cyber intelligence network led by ethical hacker Murari. Stay ahead of malware, fraud techniques, and zero-day exploits.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Community Highlights Bar */}
                <div className="mt-5 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                        <span>Curated by Ethical Hackers</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <Zap className="w-4 h-4 text-accent shrink-0" />
                        <span>Live Security Breakdowns</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <BellRing className="w-4 h-4 text-warning shrink-0" />
                        <span>Instant Community Alerts</span>
                    </div>
                </div>
            </Card>

            {/* Official Channels Grid */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-text-tertiary">
                        Connect with Official Channels
                    </h3>
                    <span className="text-[11px] text-text-tertiary">4 Official Platforms</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {OFFICIAL_CHANNELS.map((ch, idx) => {
                        const Icon = ch.icon
                        return (
                            <motion.div
                                key={ch.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: idx * 0.05 }}
                            >
                                <Card
                                    padding="lg"
                                    className={`h-full flex flex-col justify-between relative overflow-hidden bg-gradient-to-br ${ch.accentColor} transition-all duration-200 hover:scale-[1.01] hover:shadow-md border`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-11 h-11 rounded-xl bg-surface-2 flex items-center justify-center shrink-0 border border-border ${ch.textColor}`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[15px] font-bold text-text-primary leading-tight">
                                                        {ch.name}
                                                    </h4>
                                                    <p className={`text-[11.5px] font-medium font-mono ${ch.textColor} mt-0.5`}>
                                                        {ch.tag}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text-secondary shrink-0 uppercase tracking-wide">
                                                {ch.badge}
                                            </span>
                                        </div>

                                        <p className="text-[12.5px] text-text-secondary leading-relaxed">
                                            {ch.description}
                                        </p>
                                    </div>

                                    <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between gap-3">
                                        <span className="text-[11px] font-medium text-text-tertiary flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-accent" />
                                            {ch.metrics}
                                        </span>

                                        <a
                                            href={ch.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${ch.buttonClass}`}
                                        >
                                            <span>Join / Follow</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* Educational & Community Guidelines Card */}
            <Card padding="md" className="bg-surface-2/60 border-border">
                <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-4 h-4 text-accent shrink-0" />
                    <h4 className="text-[13px] font-semibold text-text-primary">Community Safety &amp; Ethics</h4>
                </div>
                <p className="text-[12px] text-text-secondary leading-relaxed">
                    RootX community channels are dedicated exclusively to ethical cybersecurity research, defense strategies, vulnerability remediation, and educational awareness. Unauthorized testing or malicious activity is strictly prohibited.
                </p>
            </Card>
        </div>
    )
}
