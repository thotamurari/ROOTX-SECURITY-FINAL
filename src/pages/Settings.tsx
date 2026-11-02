import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Settings as SettingsIcon,
    User,
    Bell,
    Shield,
    Palette,
    Trash2,
    LogOut,
    Monitor,
    Smartphone,
    Edit2,
    Check,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuth } from '@/hooks/useAuth'
import { useDeviceSessions } from '@/hooks/useDeviceSessions'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardHeader, CardTitle } from '@/components/shared/Card'
import { Switch } from '@/components/shared/Switch'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Button } from '@/components/shared/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import api from '@/services/axios'
import toast from 'react-hot-toast'

/** Small section heading used inside each settings Card. */
function SectionTitle({ icon: Icon, title }: { icon: typeof Bell; title: string }) {
    return (
        <CardHeader className="mb-1">
            <CardTitle className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
                <Icon className="w-3.5 h-3.5" />
                {title}
            </CardTitle>
        </CardHeader>
    )
}

const section = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
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
    const {
        sessions,
        isLoading: sessionsLoading,
        isError: sessionsError,
        revoke,
        isRevoking,
        revokeOthers,
        isRevokingOthers,
    } = useDeviceSessions()
    const otherSessionsCount = sessions.filter((s) => !s.current).length

    const [isEditingEmail, setIsEditingEmail] = useState(false)
    const [newEmail, setNewEmail] = useState('')
    const [isSavingEmail, setIsSavingEmail] = useState(false)

    const handleSaveEmail = async () => {
        const trimmed = newEmail.trim().toLowerCase()
        if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
            toast.error('Please enter a valid email address')
            return
        }
        setIsSavingEmail(true)
        try {
            await api.put('/auth/email', { email: trimmed })
            if (user) {
                useAuthStore.getState().setUser({ ...user, email: trimmed })
            }
            toast.success('Email updated and synced across devices!', { icon: '🛡️' })
            setIsEditingEmail(false)
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update email. Please try again.')
        } finally {
            setIsSavingEmail(false)
        }
    }

    return (
        <div className="pb-32 lg:pb-8 max-w-2xl mx-auto px-4 pt-6 sm:pt-8">
            <PageHeader
                title="Settings"
                description="Configure RootX for your security needs"
                icon={<SettingsIcon className="w-5 h-5" />}
            />

            <div className="space-y-4">
                {/* Profile */}
                <motion.div {...section} transition={{ duration: 0.25 }}>
                    <Card padding="lg">
                        <SectionTitle icon={User} title="Account" />
                        <div className="flex items-center justify-between gap-4 pt-3">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="relative shrink-0">
                                    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-[22px] font-bold text-white">
                                        {user?.email?.charAt(0).toUpperCase() || 'A'}
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success ring-4 ring-surface-1" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[15px] font-semibold text-text-primary tracking-tight truncate">
                                        {user?.email || 'Agent'}
                                    </p>
                                    <span className="inline-flex mt-1.5 text-[10.5px] font-bold bg-accent-soft text-accent px-2 py-0.5 rounded-full uppercase tracking-widest">
                                        {user?.plan || 'Standard'} plan
                                    </span>
                                </div>
                            </div>
                            {!isEditingEmail && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setNewEmail(user?.email || '')
                                        setIsEditingEmail(true)
                                    }}
                                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                                >
                                    Edit Email
                                </Button>
                            )}
                        </div>

                        {/* Inline Edit Email Form */}
                        {isEditingEmail && (
                            <div className="pt-4 border-t border-border mt-3 space-y-3">
                                <label htmlFor="edit-email-input" className="block text-[12px] font-medium text-text-secondary">
                                    New Account Email
                                </label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        id="edit-email-input"
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="Enter new email..."
                                        className="flex-1 px-3 py-2 text-[14px] rounded-xl bg-surface-2 border border-border text-text-primary focus:outline-none focus:border-accent"
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={handleSaveEmail}
                                            isLoading={isSavingEmail}
                                            leftIcon={<Check className="w-3.5 h-3.5" />}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditingEmail(false)}
                                            disabled={isSavingEmail}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-[11.5px] text-text-tertiary">
                                    Changes take effect immediately and synchronize with your mobile session.
                                </p>
                            </div>
                        )}
                    </Card>
                </motion.div>

                {/* Appearance */}
                <motion.div {...section} transition={{ duration: 0.25, delay: 0.05 }}>
                    <Card padding="lg">
                        <SectionTitle icon={Palette} title="Appearance" />
                        <ThemeToggle variant="row" />
                    </Card>
                </motion.div>

                {/* Notifications */}
                <motion.div {...section} transition={{ duration: 0.25, delay: 0.1 }}>
                    <Card padding="lg">
                        <SectionTitle icon={Bell} title="Notifications" />
                        <div className="divide-y divide-border">
                            <Switch
                                id="setting-notifications"
                                checked={notifications}
                                onChange={setNotifications}
                                label="Push notifications"
                                description="Get alerted the moment a threat is detected"
                            />
                            <Switch
                                id="setting-sound-alerts"
                                checked={soundAlerts}
                                onChange={setSoundAlerts}
                                label="Sound alerts"
                                description="Play an audible tone for critical alerts"
                            />
                        </div>
                    </Card>
                </motion.div>

                {/* Protection */}
                <motion.div {...section} transition={{ duration: 0.25, delay: 0.15 }}>
                    <Card padding="lg">
                        <SectionTitle icon={Shield} title="Protection" />
                        <div className="divide-y divide-border">
                            <Switch
                                id="setting-realtime-scanning"
                                checked={realTimeScanning}
                                onChange={setRealTimeScanning}
                                label="Real-time scanning"
                                description="Continuously scan device and app activity"
                            />
                            <Switch
                                id="setting-auto-block"
                                checked={autoBlock}
                                onChange={setAutoBlock}
                                label="Auto-block"
                                description="Automatically block flagged connections"
                            />
                        </div>
                    </Card>
                </motion.div>

                {/* Active devices */}
                <motion.div {...section} transition={{ duration: 0.25, delay: 0.18 }}>
                    <Card padding="lg">
                        <SectionTitle icon={Monitor} title="Active devices" />
                        <div className="pt-3">
                            {sessionsLoading ? (
                                <div className="py-4 flex justify-center">
                                    <LoadingSpinner size="sm" />
                                </div>
                            ) : sessionsError ? (
                                <p className="text-[13px] text-text-secondary py-2">
                                    Couldn't load your devices right now.
                                </p>
                            ) : sessions.length === 0 ? (
                                <p className="text-[13px] text-text-secondary py-2">
                                    No other active devices found.
                                </p>
                            ) : (
                                <ul className="divide-y divide-border -mx-1">
                                    {sessions.map((s) => {
                                        const Icon = s.platform === 'web' ? Monitor : Smartphone
                                        return (
                                            <li key={s.id} className="flex items-center gap-3 px-1 py-3">
                                                <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                                                    <Icon className="w-4 h-4 text-text-secondary" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13.5px] font-medium text-text-primary truncate">
                                                        {s.deviceName}
                                                        {s.current && (
                                                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-success">
                                                                This device
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-[12px] text-text-tertiary">
                                                        Last active {new Date(s.lastSeenAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                {!s.current && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="!text-danger hover:!bg-danger-soft shrink-0"
                                                        isLoading={isRevoking}
                                                        onClick={() => revoke(s.id)}
                                                    >
                                                        Log out
                                                    </Button>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}

                            {otherSessionsCount > 0 && (
                                <Button
                                    variant="secondary"
                                    size="md"
                                    fullWidth
                                    className="mt-2"
                                    isLoading={isRevokingOthers}
                                    onClick={() => revokeOthers()}
                                >
                                    Log out all other devices ({otherSessionsCount})
                                </Button>
                            )}
                        </div>
                    </Card>
                </motion.div>

                {/* Danger zone */}
                <motion.div {...section} transition={{ duration: 0.25, delay: 0.2 }}>
                    <Card padding="lg">
                        <CardHeader className="mb-1">
                            <CardTitle className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-danger">
                                <Trash2 className="w-3.5 h-3.5" />
                                Danger zone
                            </CardTitle>
                        </CardHeader>
                        <div className="space-y-2.5 pt-3">
                            <Button
                                variant="secondary"
                                size="lg"
                                fullWidth
                                onClick={() => logout()}
                                leftIcon={<LogOut className="w-4 h-4" />}
                            >
                                Log out
                            </Button>
                            <Button variant="ghost" size="md" fullWidth className="!text-danger hover:!bg-danger-soft">
                                Permanently delete account
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
