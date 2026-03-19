import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { useRealTimeAlerts } from '@/hooks/useRealTimeAlerts'
import { useState } from 'react'
import { Menu } from 'lucide-react'

export function AppShell() {
    useRealTimeAlerts()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-[#060608] bg-grid">
            {/* Hamburger for tablet (md) */}
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed top-4 right-4 z-[45] p-2 rounded-lg bg-surface border border-border hidden md:block lg:hidden"
            >
                <Menu className="w-5 h-5 text-text-secondary" />
            </button>

            {/* Overlay for tablet sidebar */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 hidden md:block lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={sidebarOpen} />
            
            <main className={`
                flex-1 min-h-screen 
                lg:ml-[240px]
                mb-16 md:mb-0
                p-4 sm:p-6 lg:p-8
                w-full
            `}>
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
            <MobileNav />
        </div>
    )
}
