import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Scan,
    Dna,
    Map,
    MoreHorizontal,
    Smartphone,
    BrainCircuit,
    Settings,
    X,
    Shield,
} from 'lucide-react'
import { useState } from 'react'

const mainTabs = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/android-sec', label: 'Android', icon: Smartphone },
    { path: '/scan', label: 'Scan', icon: Scan },
    { path: '/rootx-ai', label: 'RootX-AI', icon: BrainCircuit },
]

const drawerItems = [
    { path: '/behavioral-dna', label: 'APK Scanner', icon: Shield },
    { path: '/tracker-map', label: 'Tracker Map', icon: Map },
    { path: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
    const location = useLocation()
    const [showMore, setShowMore] = useState(false)

    return (
        <>
            {/* Drawer backdrop */}
            <AnimatePresence>
                {showMore && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[55] md:hidden"
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
                        className="fixed bottom-0 left-0 right-0 z-[60] md:hidden
                                   bg-[#0D0D14] border-t border-[#2A2A40] rounded-t-[20px]
                                   shadow-[0_-10px_40px_rgba(0,0,0,0.6)]"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-[#2A2A40]" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3">
                            <span className="text-[14px] font-sans font-semibold text-[#F0F0FF]">More</span>
                            <button onClick={() => setShowMore(false)} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)]">
                                <X className="w-5 h-5 text-[#8888AA]" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="px-4 pb-6 space-y-1" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
                            {drawerItems.map((item) => {
                                const isActive = location.pathname === item.path
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setShowMore(false)}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-[14px] font-sans font-medium transition-all
                                            ${isActive
                                                ? 'bg-[rgba(0,245,255,0.08)] text-[#00F5FF] border border-[rgba(0,245,255,0.2)]'
                                                : 'text-[#8888AA] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#F0F0FF] border border-transparent'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${isActive ? 'text-[#00F5FF]' : 'text-[#44445A]'}`}
                                            style={isActive ? { filter: 'drop-shadow(0 0 4px #00F5FF)' } : {}}
                                        />
                                        {item.label}
                                    </NavLink>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom nav bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
                style={{
                    background: 'rgba(13,13,20,0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderTop: '1px solid #1E1E30',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                <div className="flex items-center justify-around h-16 px-1">
                    {mainTabs.map((tab) => {
                        const isActive = location.pathname === tab.path
                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                className="relative flex flex-col items-center justify-center gap-1 min-w-[52px] py-1"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-active"
                                        className="absolute -top-2.5 w-8 h-[3px] rounded-full bg-[#00F5FF]"
                                        style={{ boxShadow: '0 0 8px #00F5FF' }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <tab.icon
                                    className="w-[22px] h-[22px] transition-colors"
                                    style={{
                                        color: isActive ? '#00F5FF' : '#44445A',
                                        filter: isActive ? 'drop-shadow(0 0 4px #00F5FF)' : 'none',
                                    }}
                                />
                                <span
                                    className="text-[10px] font-sans transition-colors"
                                    style={{
                                        color: isActive ? '#00F5FF' : '#44445A',
                                        fontWeight: isActive ? 600 : 500,
                                    }}
                                >
                                    {tab.label}
                                </span>
                            </NavLink>
                        )
                    })}

                    {/* More button */}
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className="relative flex flex-col items-center justify-center gap-1 min-w-[52px] py-1"
                    >
                        <MoreHorizontal
                            className="w-[22px] h-[22px] transition-colors"
                            style={{
                                color: showMore ? '#00F5FF' : '#44445A',
                                filter: showMore ? 'drop-shadow(0 0 4px #00F5FF)' : 'none',
                            }}
                        />
                        <span
                            className="text-[10px] font-sans transition-colors"
                            style={{
                                color: showMore ? '#00F5FF' : '#44445A',
                                fontWeight: showMore ? 600 : 500,
                            }}
                        >
                            More
                        </span>
                    </button>
                </div>
            </nav>
        </>
    )
}
