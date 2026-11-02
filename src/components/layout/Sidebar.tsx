import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    ScanLine,
    Shield,
    Smartphone,
    BrainCircuit,
    Globe,
    Settings2,
    LogOut,
    Newspaper,
    MessageSquare,
    Calendar,
    Users,
    History,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { ThemeToggle } from '../shared/ThemeToggle'
import logoImg from '@/assets/logo.png'

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/android-sec', label: 'AndroidSEC', icon: Smartphone },
    { path: '/scan', label: 'Scan Engine', icon: ScanLine },
    { path: '/scan-history', label: 'Scan History', icon: History },
    { path: '/rootx-ai', label: 'RootX-AI', icon: BrainCircuit },
    { path: '/apk-scanner', label: 'APK Scanner', icon: Shield },
    { path: '/settings', label: 'Settings', icon: Settings2 },
]

const opsItems = [
    { label: 'Inbox', icon: MessageSquare, path: '/inbox', badge: 7 },
    { label: 'News', icon: Newspaper, path: '/news', badge: 12 },
    {
        label: 'Community',
        icon: Users,
        path: '/community',
        badge: 'New',
    },
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
                bg-surface-1 border-r border-border
                transition-transform duration-300
                lg:w-[248px] lg:translate-x-0
                w-[248px]
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            {/* Logo Section */}
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <img 
                    src={logoImg} 
                    alt="RootX Logo" 
                    className="w-8 h-8 rounded-lg object-cover shadow-sm ring-1 ring-accent/30 shrink-0" 
                />
                <span className="text-[14.5px] font-bold tracking-tight text-text-primary uppercase truncate">
                    RootX-<span className="text-accent">Security</span>
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4" aria-label="Primary">
                <div className="px-3 space-y-0.5">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium
                                transition-colors duration-150
                                ${isActive
                                    ? 'bg-accent-soft text-accent'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                                }
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-accent" />
                                    )}
                                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>

                <div className="mt-6 px-3">
                    <p className="text-2xs font-bold text-text-tertiary uppercase tracking-widest mb-2 px-3.5">
                        Operations
                    </p>
                    <div className="space-y-0.5">
                        {opsItems.map((subItem) => {
                            if (subItem.isExternal) {
                                return (
                                    <a
                                        key={subItem.label}
                                        href={subItem.path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between px-3.5 py-2 rounded-lg text-[12.5px] transition-colors duration-150 group text-text-secondary hover:text-text-primary hover:bg-surface-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <subItem.icon className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                                            <span>{subItem.label}</span>
                                        </div>
                                        {subItem.badge && (
                                            <span className="bg-emerald-500/20 text-emerald-400 text-2xs font-bold px-1.5 py-0.5 rounded-full text-center leading-tight">
                                                {subItem.badge}
                                            </span>
                                        )}
                                    </a>
                                )
                            }
                            return (
                                <NavLink
                                    key={subItem.label}
                                    to={subItem.path}
                                    className={({ isActive }) => `
                                        flex items-center justify-between px-3.5 py-2 rounded-lg text-[12.5px] transition-colors duration-150 group
                                        ${isActive ? 'text-accent bg-accent-soft' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'}
                                    `}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <subItem.icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
                                                <span>{subItem.label}</span>
                                            </div>
                                            {subItem.badge && (
                                                <span className="bg-danger text-white text-2xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                                                    {subItem.badge}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            )
                        })}
                    </div>
                </div>
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-border p-3 bg-surface-2/50">
                <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl bg-surface-1 border border-border">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[12px] font-bold text-white shrink-0">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] font-bold text-text-primary truncate">{user?.email || 'Agent'}</p>
                        <p className="text-2xs text-text-tertiary uppercase tracking-tight">Security Node #042</p>
                    </div>
                    <ThemeToggle />
                </div>
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:text-danger hover:bg-danger-soft text-[12.5px] font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                    <LogOut className="w-[15px] h-[15px]" />
                    <span>Log out</span>
                </button>
            </div>
        </aside>
    )
}
