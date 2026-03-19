import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    Scan,
    Dna,
    Map,
    Users,
    MoreHorizontal,
} from 'lucide-react'
import { useState } from 'react'
import {
    MessageSquareWarning,
    Ear,
    Smartphone,
    Settings,
} from 'lucide-react'

const mainTabs = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/scan', label: 'Scan', icon: Scan },
    { path: '/behavioral-dna', label: 'DNA', icon: Dna },
    { path: '/tracker-map', label: 'Map', icon: Map },
    { path: '/community', label: 'Feed', icon: Users },
]

const moreTabs = [
    { path: '/social-shield', label: 'Social Shield', icon: MessageSquareWarning },
    { path: '/eavesdrop', label: 'Eavesdrop', icon: Ear },
    { path: '/android-sec', label: 'AndroidSEC', icon: Smartphone },
    { path: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
    const location = useLocation()
    const [showMore, setShowMore] = useState(false)

    return (
        <>
            {/* More overlay */}
            {showMore && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-20 left-4 right-4 z-50 p-3 space-y-1 md:hidden
                               bg-[linear-gradient(135deg,rgba(17,24,39,0.95)_0%,rgba(13,17,23,0.90)_100%)]
                               backdrop-blur-[20px] border border-cyan/15 rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
                >
                    {moreTabs.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            onClick={() => setShowMore(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans font-medium transition-all
                                ${isActive
                                    ? 'bg-[linear-gradient(135deg,rgba(0,255,255,0.15)_0%,rgba(0,255,255,0.05)_100%)] text-cyan border border-cyan/30 shadow-[0_0_20px_rgba(0,255,255,0.1)]'
                                    : 'text-[#B0BEC5] hover:bg-[rgba(0,255,255,0.08)] hover:text-white border border-transparent'}
                            `}
                        >
                            <tab.icon className={`w-5 h-5 ${location.pathname === tab.path ? 'drop-shadow-[0_0_6px_#00FFFF]' : ''}`} />
                            {tab.label}
                        </NavLink>
                    ))}
                </motion.div>
            )}

            {/* Bottom nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[linear-gradient(135deg,#0A0F1E_0%,#080B14_100%)] border-t border-cyan/20 md:hidden shadow-[0_-4px_24px_rgba(0,255,255,0.05)]">
                <div className="flex items-center justify-around px-2 py-3">
                    {mainTabs.map((tab) => {
                        const isActive = location.pathname === tab.path
                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                className="relative flex flex-col items-center gap-1 py-1 px-3"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-active"
                                        className="absolute -top-3 w-8 h-[3px] bg-cyan shadow-[0_0_8px_#00FFFF] rounded-full"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <tab.icon
                                    className={`w-[22px] h-[22px] transition-colors ${
                                        isActive ? 'text-cyan drop-shadow-[0_0_8px_#00FFFF]' : 'text-[#607D8B]'
                                    }`}
                                />
                                <span
                                    className={`text-[10px] font-sans transition-colors ${
                                        isActive ? 'text-cyan font-bold drop-shadow-[0_0_4px_#00FFFF]' : 'text-[#607D8B] font-medium'
                                    }`}
                                >
                                    {tab.label}
                                </span>
                            </NavLink>
                        )
                    })}
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className="flex flex-col items-center gap-1 py-1 px-3"
                    >
                        <MoreHorizontal className={`w-[22px] h-[22px] transition-colors ${showMore ? 'text-cyan drop-shadow-[0_0_8px_#00FFFF]' : 'text-[#607D8B]'}`} />
                        <span className={`text-[10px] font-sans transition-colors ${showMore ? 'text-cyan font-bold drop-shadow-[0_0_4px_#00FFFF]' : 'text-[#607D8B] font-medium'}`}>
                            More
                        </span>
                    </button>
                </div>
            </nav>
        </>
    )
}
