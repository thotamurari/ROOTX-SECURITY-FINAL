import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, ExternalLink, ShieldAlert, MessageSquare } from 'lucide-react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'

interface NewsItem {
    id: string
    title: string
    summary: string
    date: string
    source: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    category: string
}

const MOCK_NEWS: NewsItem[] = [
    {
        id: '1',
        title: 'New Android Spyware "Vultur" Targets Banking Apps',
        summary: 'A sophisticated malware is using screen recording and keylogging to steal credentials from over 200 banking applications.',
        date: '2h ago',
        source: 'SecurityWeek',
        severity: 'critical',
        category: 'Malware'
    },
    {
        id: '2',
        title: 'WhatsApp Fixes Zero-Day Vulnerability in Latest Update',
        summary: 'Meta has released a patch for a critical vulnerability that allowed remote code execution via a malicious GIF.',
        date: '5h ago',
        source: 'The Hacker News',
        severity: 'high',
        category: 'Vulnerability'
    },
    {
        id: '3',
        title: 'Stealth Mobile Spyware Campaign Targets Android Users',
        summary: 'Researchers discover targeted spyware disguised as system utilities attempting privilege escalation.',
        date: '10h ago',
        source: 'ThreatPost',
        severity: 'high',
        category: 'Spyware'
    },
    {
        id: '4',
        title: 'Google Play Protect Enhanced with Real-time App Scanning',
        summary: 'Google is rolling out new AI-driven features to detect malicious behavior in apps before they are installed.',
        date: '1d ago',
        source: 'TechRadar',
        severity: 'low',
        category: 'Security Update'
    }
]

export function CybersecurityNews() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [showSMS, setShowSMS] = useState(false)
    const [latestSMS, setLatestSMS] = useState<NewsItem | null>(null)

    useEffect(() => {
        // Load news
        setNews(MOCK_NEWS)

        // Simulate a "new" news item after 12 seconds for the SMS demo
        const timer = setTimeout(() => {
            const newItem: NewsItem = {
                id: '5',
                title: 'CRITICAL: New Zero-Day exploit found in Android Kernel',
                summary: 'Immediate update required to prevent privilege escalation attacks on all Android 12+ devices.',
                date: 'Just now',
                source: 'RootX Sentinel',
                severity: 'critical',
                category: 'Critical Alert'
            }

            setNews(prev => [newItem, ...prev])
            setLatestSMS(newItem)
            setShowSMS(true)

            // Auto hide SMS after 8 seconds
            setTimeout(() => setShowSMS(false), 8000)
        }, 12000)

        return () => clearTimeout(timer)
    }, [])

    return (
        <section aria-label="Intelligence feed">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0" aria-hidden="true">
                        <Newspaper className="w-4 h-4" />
                    </span>
                    <h2 className="text-[15px] font-semibold text-text-primary tracking-tight truncate">
                        Intelligence Feed
                    </h2>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary bg-surface-2 border border-border px-2.5 py-1 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
                    Live
                </span>
            </div>

            <div className="space-y-3">
                {news.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.25, ease: 'easeOut' }}
                    >
                        <Card interactive padding="sm" className="group">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-[0.1em] ${
                                    item.severity === 'critical' ? 'bg-danger-soft text-danger' :
                                    item.severity === 'high' ? 'bg-warning-soft text-warning' :
                                    'bg-accent-soft text-accent'
                                }`}>
                                    {item.category}
                                </span>
                                <span className="text-[11px] font-medium text-text-tertiary shrink-0">{item.date}</span>
                            </div>

                            <h3 className="text-[14px] font-semibold text-text-primary leading-snug mb-1.5 group-hover:text-accent transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-[12.5px] text-text-secondary leading-relaxed line-clamp-2">{item.summary}</p>

                            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3">
                                <span className="text-[11px] text-text-tertiary truncate">via {item.source}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-accent hover:text-accent shrink-0"
                                    rightIcon={<ExternalLink className="w-3 h-3" aria-hidden="true" />}
                                >
                                    Read intel
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Simulated SMS notification */}
            <AnimatePresence>
                {showSMS && latestSMS && (
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        role="status"
                        aria-live="polite"
                        className="fixed bottom-24 left-4 right-4 z-[100] max-w-sm mx-auto"
                    >
                        <div className="bg-surface-1 border border-border rounded-2xl shadow-lg overflow-hidden">
                            <div className="bg-surface-2 px-4 py-2 flex items-center justify-between border-b border-border">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3 text-accent" aria-hidden="true" />
                                    <span className="text-[10px] font-semibold text-text-primary uppercase tracking-[0.14em]">Messages</span>
                                </div>
                                <span className="text-[10px] font-medium text-text-tertiary">now</span>
                            </div>

                            <div className="p-4 flex gap-3">
                                <span className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shrink-0" aria-hidden="true">
                                    <ShieldAlert className="w-5 h-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-text-primary mb-0.5">RootX Sentinel</p>
                                    <p className="text-[12.5px] text-text-secondary leading-snug">{latestSMS.title}</p>
                                    <p className="text-[11px] text-text-tertiary mt-2">Tap to open security module</p>
                                </div>
                            </div>

                            <div className="h-1 bg-accent-soft relative" aria-hidden="true">
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 8, ease: 'linear' }}
                                    className="absolute inset-y-0 left-0 bg-accent"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
