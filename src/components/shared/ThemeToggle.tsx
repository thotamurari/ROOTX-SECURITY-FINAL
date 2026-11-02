import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSettingsStore } from '@/stores/settingsStore'

interface ThemeToggleProps {
    className?: string
    /** compact = icon-only pill (topbar); default = icon+label row (drawers/settings) */
    variant?: 'compact' | 'row'
}

/**
 * Reuses the existing `darkMode` flag in useSettingsStore (already present
 * and persisted) instead of introducing a second source of truth. The
 * useThemeSync hook (see src/hooks/useThemeSync.ts) mirrors this flag onto
 * <html class="dark|light">, which is what every CSS variable in
 * src/index.css keys off of.
 */
export function ThemeToggle({ className = '', variant = 'compact' }: ThemeToggleProps) {
    const darkMode = useSettingsStore((s) => s.darkMode)
    const setDarkMode = useSettingsStore((s) => s.setDarkMode)

    if (variant === 'row') {
        return (
            <button
                onClick={() => setDarkMode(!darkMode)}
                className={[
                    'w-full flex items-center justify-between gap-4 py-3 px-1 text-left',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-lg',
                    className,
                ].join(' ')}
                aria-label="Toggle color theme"
            >
                <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-text-secondary">
                        {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </span>
                    <span className="text-[13.5px] font-medium text-text-primary">
                        {darkMode ? 'Dark mode' : 'Light mode'}
                    </span>
                </span>
                <span
                    className={[
                        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
                        darkMode ? 'bg-accent' : 'bg-surface-3',
                    ].join(' ')}
                >
                    <motion.span
                        className="inline-block rounded-full bg-white shadow-sm"
                        style={{ height: 18, width: 18 }}
                        animate={{ x: darkMode ? 22 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    />
                </span>
            </button>
        )
    }

    return (
        <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            className={[
                'w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary',
                'bg-surface-2 border border-border hover:text-text-primary hover:bg-surface-3 transition-colors duration-150',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
                className,
            ].join(' ')}
        >
            <motion.span
                key={darkMode ? 'moon' : 'sun'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="inline-flex"
            >
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </motion.span>
        </button>
    )
}
