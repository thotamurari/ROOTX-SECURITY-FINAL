import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

/**
 * Mirrors the persisted `darkMode` setting onto <html class="dark|light">.
 * Every color in src/index.css is defined as a CSS variable keyed off that
 * class, so this one hook is all that's needed to theme the entire app —
 * no component-level light/dark branching required.
 *
 * The inline script in index.html applies the class before first paint
 * (avoiding a flash); this hook keeps it in sync afterwards whenever the
 * user flips the toggle.
 */
export function useThemeSync() {
    const darkMode = useSettingsStore((s) => s.darkMode)

    useEffect(() => {
        const root = document.documentElement
        root.classList.remove('dark', 'light')
        root.classList.add(darkMode ? 'dark' : 'light')

        const meta = document.querySelector('meta[name="theme-color"]:not([media])')
        if (meta) {
            meta.setAttribute('content', darkMode ? '#0a0b0d' : '#f6f7f9')
        }
    }, [darkMode])
}
