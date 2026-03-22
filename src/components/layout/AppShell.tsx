import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { useRealTimeAlerts } from '@/hooks/useRealTimeAlerts'
import { useState } from 'react'
import { Menu, X, Shield, Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export function AppShell() {
    useRealTimeAlerts()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()
    const user = useAuthStore((s) => s.user)

    return (
        <div className="flex min-h-screen bg-[#060608] font-sans">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[45] lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            <Sidebar isOpen={sidebarOpen} />

            {/* Mobile Top Bar */}
            <div
                className="fixed top-0 left-0 right-0 z-40 lg:hidden flex items-center justify-between px-4"
                style={{
                    height: '56px',
                    background: 'rgba(13,13,20,0.9)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: '1px solid #1E1E30',
                }}
            >
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                    {sidebarOpen ? (
                        <X className="w-5 h-5 text-[#8888AA]" />
                    ) : (
                        <Menu className="w-5 h-5 text-[#8888AA]" />
                    )}
                </button>

                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#00F5FF]" style={{ filter: 'drop-shadow(0 0 4px #00F5FF)' }} />
                    <span className="text-[14px] font-orbitron font-bold text-[#00F5FF]">SafeOpen</span>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors relative">
                        <Bell className="w-5 h-5 text-[#44445A]" />
                    </button>
                    <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-orbitron font-bold"
                        style={{ background: '#00F5FF', color: '#060608' }}
                    >
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div>
            </div>

            <main
                className={`
                    flex-1 min-h-screen
                    lg:ml-[240px]
                    pt-[56px] lg:pt-0
                    pb-[80px] md:pb-0
                    p-4 sm:p-6 lg:p-8
                    w-full
                `}
            >
                <div className="max-w-7xl mx-auto">
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
                </div>
            </main>

            <MobileNav />
        </div>
    )
}
