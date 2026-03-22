import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    ScanLine,
    Dna,
    Globe,
    Smartphone,
    BrainCircuit,
    Settings2,
    Shield,
    LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/android-sec', label: 'AndroidSEC', icon: Smartphone },
    { path: '/scan', label: 'Scan Engine', icon: ScanLine },
    { path: '/rootx-ai', label: 'RootX-AI', icon: BrainCircuit },
    { path: '/behavioral-dna', label: 'APK Scanner', icon: Shield },
    { path: '/tracker-map', label: 'Tracker Map', icon: Globe },
    { path: '/settings', label: 'Settings', icon: Settings2 },
]

export function Sidebar({ isOpen = false }: { isOpen?: boolean }) {
    const location = useLocation()
    const user = useAuthStore((s) => s.user)
    const { logout } = useAuth()

    return (
        <aside
            className={`
                fixed left-0 top-0 h-full z-50
                flex flex-col
                transition-all duration-300
                lg:w-[240px] lg:translate-x-0
                md:w-[240px] ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                -translate-x-full
            `}
            style={{
                background: '#0D0D14',
                borderRight: '1px solid #1E1E30',
            }}
        >
            {/* Logo — top */}
            <div className="px-5 py-6 border-b border-[#1E1E30]">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-[#00F5FF]" style={{ filter: 'drop-shadow(0 0 8px #00F5FF)' }} />
                    <div>
                        <p className="text-[16px] font-orbitron font-bold text-[#00F5FF]" style={{ textShadow: '0 0 20px rgba(0,245,255,0.6)' }}>
                            SafeOpen
                        </p>
                        <p className="text-[10px] text-[#44445A] font-sans uppercase" style={{ letterSpacing: '0.2em' }}>
                            Security Guardian
                        </p>
                    </div>
                </div>
            </div>

            {/* Nav items — grows to fill space */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="relative flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl mb-1 text-[14px] font-sans transition-all duration-200"
                            style={{
                                background: isActive ? 'rgba(0,245,255,0.08)' : 'transparent',
                                color: isActive ? '#00F5FF' : '#8888AA',
                                fontWeight: isActive ? 500 : 400,
                                borderLeft: isActive ? '2px solid #00F5FF' : '2px solid transparent',
                            }}
                        >
                            <item.icon
                                className="w-[18px] h-[18px] transition-colors"
                                style={{
                                    color: isActive ? '#00F5FF' : '#44445A',
                                    filter: isActive ? 'drop-shadow(0 0 4px #00F5FF)' : 'none',
                                }}
                            />
                            <span>{item.label}</span>
                        </NavLink>
                    )
                })}
            </nav>

            {/* User account — PINNED TO BOTTOM always */}
            <div className="border-t border-[#1E1E30] p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                            background: '#00F5FF',
                            boxShadow: '0 0 10px rgba(0,245,255,0.4)',
                        }}
                    >
                        <span className="font-orbitron text-sm font-bold text-[#060608]">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-[#F0F0FF] font-sans truncate leading-tight" style={{ maxWidth: '140px' }}>
                            {user?.email || 'User'}
                        </p>
                        <span
                            className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase"
                            style={{
                                color: '#FF8C00',
                                background: 'rgba(255,140,0,0.1)',
                                border: '1px solid rgba(255,140,0,0.2)',
                                letterSpacing: '0.1em',
                            }}
                        >
                            {user?.plan || 'FREE'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#FF3366] text-[13px] font-sans font-medium hover:bg-[rgba(255,51,102,0.08)] transition-colors duration-200"
                >
                    <LogOut className="w-[15px] h-[15px]" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
