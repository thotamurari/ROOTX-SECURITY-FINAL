import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    Scan,
    Dna,
    Map,
    MessageSquareWarning,
    Ear,
    Smartphone,
    Users,
    Settings,
    Shield,
    LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/scan', label: 'Scan Engine', icon: Scan },
    { path: '/behavioral-dna', label: 'Behavioral DNA', icon: Dna },
    { path: '/tracker-map', label: 'Tracker Map', icon: Map },
    { path: '/social-shield', label: 'Social Shield', icon: MessageSquareWarning },
    { path: '/android-sec', label: 'AndroidSEC', icon: Smartphone },
    { path: '/community', label: 'Community', icon: Users },
    { path: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ isOpen = false }: { isOpen?: boolean }) {
    const location = useLocation()
    const user = useAuthStore((s) => s.user)
    const { logout } = useAuth()

    return (
        <aside className={`
            fixed left-0 top-0 h-full border-r border-cyan/20
            bg-[linear-gradient(180deg,#0A0F1E_0%,#080B14_50%,#0A0F1E_100%)]
            shadow-[4px_0_24px_rgba(0,255,255,0.05)]
            transition-all duration-300 z-50
            lg:w-[240px] lg:translate-x-0
            md:w-[240px] ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            -translate-x-full
        `}>
            {/* Logo */}
            <div className="px-6 py-8 border-b border-cyan/10">
                <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-cyan drop-shadow-[0_0_8px_#00FFFF]" />
                    <div className="flex flex-col">
                        <h1 className="text-[22px] font-orbitron font-extrabold text-cyan tracking-[2px]" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(0, 255, 255, 0.4)' }}>
                            SafeOpen
                        </h1>
                        <p className="text-[10px] text-[#B0BEC5] font-sans uppercase tracking-[3px] mt-0.5">
                            Security Guardian
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                relative flex items-center gap-3 px-4 py-3 rounded-[10px] text-[14px] font-sans font-medium transition-all duration-200 group border
                                ${isActive 
                                    ? 'bg-[linear-gradient(135deg,rgba(0,255,255,0.15)_0%,rgba(0,255,255,0.05)_100%)] text-cyan border-cyan/30 shadow-[0_0_20px_rgba(0,255,255,0.1),inset_0_0_20px_rgba(0,255,255,0.05)]' 
                                    : 'text-[#B0BEC5] border-transparent hover:bg-[rgba(0,255,255,0.08)] hover:text-white hover:border-cyan/15'}
                            `}
                        >
                            <item.icon
                                className={`relative w-5 h-5 transition-colors ${
                                    isActive ? 'text-cyan drop-shadow-[0_0_6px_#00FFFF]' : 'text-[#607D8B]'
                                }`}
                            />
                            <span className="relative">
                                {item.label}
                            </span>
                        </NavLink>
                    )
                })}
            </nav>

            {/* User section */}
            <div className="px-4 py-5 border-t border-cyan/10 bg-[#0A0F1E]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan to-bright-blue flex items-center justify-center text-[#080B14] text-sm font-orbitron font-extrabold shadow-[0_0_10px_rgba(0,255,255,0.4)]">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-white truncate font-sans">{user?.email || 'User'}</p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-[rgba(255,224,0,0.15)] border border-[rgba(255,224,0,0.4)] rounded text-[10px] text-bright-yellow font-bold uppercase tracking-wider">
                            {user?.plan || 'free'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-2 text-bright-pink hover:brightness-125 text-sm font-sans font-medium transition-colors w-full px-2"
                >
                    <LogOut className="w-[18px] h-[18px] drop-shadow-[0_0_4px_#FF4081]" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
