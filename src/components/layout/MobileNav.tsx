import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    ScanLine,
    Shield,
    Smartphone,
    BrainCircuit,
    MoreHorizontal,
    X,
    Globe,
    Settings,
    LogOut,
    Newspaper,
    MessageSquare,
    Users,
    History,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { ThemeToggle } from '../shared/ThemeToggle'

const mainTabs = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/android-sec', label: 'Android', icon: Smartphone },
    { path: '/scan', label: 'Scan', icon: ScanLine },
    { path: '/rootx-ai', label: 'RootX-AI', icon: BrainCircuit },
]

interface DrawerItem {
    path: string
    label: string
    icon: any
    badge?: string
    isExternal?: boolean
}

const drawerItems: DrawerItem[] = [
    { path: '/scan-history', label: 'Scan History', icon: History },
    { path: '/apk-scanner', label: 'APK Scanner', icon: Shield },
    { path: '/inbox', label: 'Tactical Inbox', icon: MessageSquare },
    { path: '/news', label: 'Cyber Intel', icon: Newspaper },
    { path: '/community', label: 'RootX Community', icon: Users, badge: 'WhatsApp' },
    { path: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
    const location = useLocation()
    const [showMore, setShowMore] = useState(false)
    const logout = useAuthStore((s) => s.logout)

    return (
        <>
            {/* Drawer backdrop */}
            <AnimatePresence>
                {showMore && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-overlay z-[55] lg:hidden"
                        onClick={() => setShowMore(false)}
                    />
                )}
            </AnimatePresence>

            {/* Slide-up drawer */}
            <AnimatePresence>
                {showMore && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden
                                   bg-surface-1 border-t border-border rounded-t-[24px]
                                   shadow-lg"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-border-strong" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <span className="text-[15px] font-bold text-text-primary uppercase tracking-tight">Security Ops</span>
                            <button
                                onClick={() => setShowMore(false)}
                                aria-label="Close menu"
                                className="p-2 rounded-full bg-surface-2 hover:bg-surface-3 transition-colors"
                            >
                                <X className="w-4 h-4 text-text-secondary" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="px-4 pb-2 space-y-1">
                            {drawerItems.map((item) => {
                                if (item.isExternal) {
                                    return (
                                        <a
                                            key={item.path}
                                            href={item.path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setShowMore(false)}
                                            className="flex items-center justify-between px-5 py-4 rounded-2xl text-[14px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <item.icon className="w-5 h-5 text-emerald-400" />
                                                <span>{item.label}</span>
                                            </div>
                                            <span className="bg-emerald-500/20 text-emerald-400 text-2xs font-bold px-2 py-0.5 rounded-full">
                                                WhatsApp Group
                                            </span>
                                        </a>
                                    )
                                }
                                const isActive = location.pathname === item.path
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setShowMore(false)}
                                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[14px] font-medium transition-all
                                            ${isActive
                                                ? 'bg-accent text-white shadow-sm'
                                                : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-text-tertiary'}`} />
                                        {item.label}
                                    </NavLink>
                                )
                            })}

                            <div className="flex items-center justify-between px-5 py-2 mt-1">
                                <ThemeToggle variant="row" />
                            </div>

                            {/* Logout Option */}
                            <button
                                onClick={() => {
                                    logout()
                                    setShowMore(false)
                                }}
                                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[14px] font-medium text-danger hover:bg-danger-soft transition-all mt-1"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </div>
                        <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom nav bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface-1 border-t border-border"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                aria-label="Primary"
            >
                <div className="flex items-center justify-around h-16 px-2">
                    {mainTabs.map((tab) => {
                        const isActive = location.pathname === tab.path
                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                className="relative flex flex-col items-center justify-center gap-1 flex-1 py-1 group"
                            >
                                <div className="relative">
                                    {isActive && (
                                        <motion.div
                                            layoutId="pill"
                                            className="absolute inset-x-[-12px] inset-y-[-4px] bg-accent-soft rounded-full z-0"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <tab.icon
                                        className={`w-6 h-6 relative z-10 transition-colors duration-200 ${isActive ? 'text-accent' : 'text-text-tertiary group-active:text-text-secondary'}`}
                                    />
                                </div>
                                <span
                                    className={`text-2xs font-bold mt-0.5 tracking-tight transition-colors duration-200 ${isActive ? 'text-accent' : 'text-text-tertiary'}`}
                                >
                                    {tab.label}
                                </span>
                            </NavLink>
                        )
                    })}

                    {/* More button */}
                    <button
                        onClick={() => setShowMore(!showMore)}
                        aria-label="More options"
                        aria-expanded={showMore}
                        className="relative flex flex-col items-center justify-center gap-1 flex-1 py-1 group"
                    >
                        <div className="relative">
                            {showMore && (
                                <motion.div
                                    layoutId="pill"
                                    className="absolute inset-x-[-12px] inset-y-[-4px] bg-accent-soft rounded-full z-0"
                                />
                            )}
                            <MoreHorizontal
                                className={`w-6 h-6 relative z-10 transition-colors duration-200 ${showMore ? 'text-accent' : 'text-text-tertiary'}`}
                            />
                        </div>
                        <span
                            className={`text-2xs font-bold mt-0.5 tracking-tight transition-colors duration-200 ${showMore ? 'text-accent' : 'text-text-tertiary'}`}
                        >
                            More
                        </span>
                    </button>
                </div>
            </nav>
        </>
    )
}
