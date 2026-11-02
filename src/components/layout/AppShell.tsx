import { Outlet, useLocation, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { useRealTimeAlerts } from '@/hooks/useRealTimeAlerts'
import { Suspense, useState, useEffect } from 'react'
import { Menu, X, Shield, Bell, Search, Globe, ChevronDown, MoreVertical } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { ThemeToggle } from '../shared/ThemeToggle'
import { LoadingSpinner } from '../shared/LoadingSpinner'

export function AppShell() {
    useRealTimeAlerts()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [time, setTime] = useState(new Date())
    const location = useLocation()
    const user = useAuthStore((s) => s.user)

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(t)
    }, [])

    return (
        <div className="flex min-h-screen bg-base font-sans">
            <Sidebar isOpen={sidebarOpen} />

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-overlay z-[45] lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-[248px]">

                {/* Desktop Top Bar */}
                <header className="hidden lg:flex h-16 bg-surface-1/80 backdrop-blur-md border-b border-border items-center px-6 xl:px-8 gap-6 sticky top-0 z-30">
                    <div className="flex items-center gap-3 text-text-secondary">
                        <button
                            className="p-1.5 rounded-lg hover:bg-surface-2 hover:text-text-primary transition-colors"
                            aria-label="Switch cluster"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-accent transition-colors" />
                            <input
                                type="text"
                                placeholder="Quick search..."
                                aria-label="Quick search"
                                className="bg-surface-2 border border-transparent rounded-lg pl-9 pr-4 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary w-[220px] xl:w-[260px] focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-end gap-2.5">
                        {/* Alliance / Cluster */}
                        <div className="hidden xl:flex items-center gap-2 bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
                            <Globe className="w-3.5 h-3.5 text-accent" />
                            <span className="text-2xs font-bold text-text-primary uppercase tracking-wide">Vanguard Cluster-7</span>
                            <ChevronDown className="w-3 h-3 text-text-tertiary" />
                        </div>

                        {/* Threat Score */}
                        <div className="flex items-center gap-2 bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
                            <span className="w-2 h-2 rounded-full bg-success" />
                            <span className="text-2xs font-bold text-text-primary tracking-tight whitespace-nowrap">Threat Score: 12</span>
                        </div>

                        {/* Notifications */}
                        <button className="flex items-center gap-2 bg-danger-soft px-3 py-1.5 rounded-lg border border-danger/20 hover:bg-danger/20 transition-colors">
                            <span className="text-2xs font-bold text-danger uppercase tracking-wide hidden xl:inline">Must respond</span>
                            <span className="bg-danger text-white text-2xs font-bold px-1.5 py-0.5 rounded leading-tight">3</span>
                        </button>

                        <ThemeToggle />

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* User Profile */}
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden xl:block">
                                <p className="text-2xs font-bold text-text-primary tracking-tight leading-none">
                                    {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                                <p className="text-2xs text-text-tertiary font-medium uppercase mt-1">
                                    {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[12px] font-bold text-white relative shrink-0">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-surface-1 rounded-full" />
                            </div>
                            <button aria-label="Account menu" className="text-text-tertiary hover:text-text-primary transition-colors">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Mobile Top Bar */}
                <div className="fixed top-0 left-0 right-0 z-40 lg:hidden flex items-center justify-between px-4 h-[60px] bg-surface-1/90 backdrop-blur-xl border-b border-border">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
                        className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
                    >
                        {sidebarOpen ? (
                            <X className="w-5 h-5 text-text-secondary" />
                        ) : (
                            <Menu className="w-5 h-5 text-text-secondary" />
                        )}
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center p-1.5 shadow-sm">
                            <Shield className="w-full h-full text-white" />
                        </div>
                        <span className="text-[15px] font-bold tracking-tight uppercase text-text-primary">
                            RootX-<span className="text-accent">Security</span>
                        </span>
                    </div>

                    <Link
                        to="/inbox"
                        aria-label="Inbox"
                        className={`p-2 rounded-lg transition-colors relative ${location.pathname === '/inbox' ? 'bg-accent-soft text-accent' : 'hover:bg-surface-2 text-text-tertiary'}`}
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-surface-1" />
                    </Link>
                </div>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pt-[76px] lg:pt-6 pb-24 lg:pb-8">
                    <div className="max-w-7xl mx-auto">
                        {/*
                          Single Suspense boundary for ALL lazy route chunks,
                          placed OUTSIDE AnimatePresence. This is the fix for the
                          "navigate to /scan, right panel stays blank until refresh"
                          bug: when the boundary lived inside the animated
                          motion.div (per-route), framer-motion's mode="wait" and
                          the suspending lazy import raced and the panel never
                          mounted. With Suspense outside, a navigating route that's
                          still loading shows this spinner, then mounts and animates
                          in cleanly once resolved.
                        */}
                        <Suspense fallback={<div className="py-20"><LoadingSpinner size="lg" text="Loading..." /></div>}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={location.pathname}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Outlet />
                                </motion.div>
                            </AnimatePresence>
                        </Suspense>
                    </div>
                </main>
            </div>

            <MobileNav />
        </div>
    )
}
