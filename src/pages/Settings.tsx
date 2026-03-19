import { motion } from 'framer-motion'
import { Settings as SettingsIcon, User, Bell, Shield, Download, Trash2, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuth } from '@/hooks/useAuth'

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-cyan' : 'bg-surface border border-border'
                }`}
        >
            <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                animate={{ left: enabled ? '22px' : '2px' }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
        </button>
    )
}

export default function Settings() {
    const user = useAuthStore((s) => s.user)
    const { logout } = useAuth()
    const {
        notifications,
        soundAlerts,
        realTimeScanning,
        autoBlock,
        setNotifications,
        setSoundAlerts,
        setRealTimeScanning,
        setAutoBlock,
    } = useSettingsStore()

    const settings = [
        { label: 'Push Notifications', description: 'Receive alerts for threats', value: notifications, onChange: setNotifications },
        { label: 'Sound Alerts', description: 'Audio alerts for critical threats', value: soundAlerts, onChange: setSoundAlerts },
        { label: 'Real-time Scanning', description: 'Automatically scan incoming links', value: realTimeScanning, onChange: setRealTimeScanning },
        { label: 'Auto-block', description: 'Automatically block flagged connections', value: autoBlock, onChange: setAutoBlock },
    ]

    const handleExportPDF = () => {
        import('jspdf').then(({ jsPDF }) => {
            const doc = new jsPDF()
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(20)
            doc.text('SafeOpen Scan History Report', 20, 30)
            doc.setFontSize(12)
            doc.setFont('helvetica', 'normal')
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45)
            doc.text(`User: ${user?.email || 'N/A'}`, 20, 55)
            doc.text(`Plan: ${user?.plan || 'free'}`, 20, 65)
            doc.save('safeopen-report.pdf')
        })
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-3">
                    <SettingsIcon className="w-7 h-7 text-cyan" />
                    Settings
                </h1>
                <p className="text-sm text-text-secondary font-body mt-1">Manage your preferences and account</p>
            </motion.div>

            {/* Profile Section */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-ui font-semibold text-text-secondary mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                </h3>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-cyan/10 flex items-center justify-center text-2xl font-display font-bold text-cyan">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <p className="text-lg font-ui font-semibold text-text-primary">{user?.email || 'User'}</p>
                        <p className="text-xs font-body text-cyan uppercase">{user?.plan || 'free'} plan</p>
                        <p className="text-xs font-body text-text-muted mt-0.5">
                            Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Settings Toggles */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-ui font-semibold text-text-secondary mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Preferences
                </h3>
                <div className="space-y-4">
                    {settings.map((s) => (
                        <div key={s.label} className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm font-ui text-text-primary">{s.label}</p>
                                <p className="text-xs font-body text-text-muted">{s.description}</p>
                            </div>
                            <ToggleSwitch enabled={s.value} onChange={s.onChange} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-ui font-semibold text-text-secondary mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Actions
                </h3>
                <div className="space-y-3">
                    <button
                        onClick={handleExportPDF}
                        className="btn-ghost w-full flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export Scan History (PDF)
                    </button>
                    <button
                        onClick={() => logout()}
                        className="btn-ghost w-full flex items-center justify-center gap-2 hover:border-neon-orange/50 hover:text-neon-orange"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                    <button className="btn-danger w-full flex items-center justify-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    )
}
