import { motion } from 'framer-motion'

interface SwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label?: string
    description?: string
    disabled?: boolean
    id?: string
}

/**
 * Accessible toggle switch used for Settings rows and the theme toggle.
 * Renders a visually-hidden native checkbox so it behaves correctly for
 * screen readers and keyboard users (Space/Enter to toggle, focus ring).
 */
export function Switch({ checked, onChange, label, description, disabled, id }: SwitchProps) {
    const control = (
        <span
            role="switch"
            aria-checked={checked}
            className={[
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
                checked ? 'bg-accent' : 'bg-surface-3',
                disabled ? 'opacity-50' : 'cursor-pointer',
            ].join(' ')}
        >
            <motion.span
                className="inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm"
                style={{ height: 18, width: 18 }}
                animate={{ x: checked ? 22 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            />
        </span>
    )

    const input = (
        <input
            id={id}
            type="checkbox"
            role="presentation"
            tabIndex={-1}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
        />
    )

    if (!label) {
        return (
            <label className="inline-flex items-center focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2 rounded-full">
                {input}
                {control}
            </label>
        )
    }

    return (
        <label
            htmlFor={id}
            className="flex items-center justify-between gap-4 py-3 cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2 rounded-lg"
        >
            <span className="min-w-0">
                <span className="block text-[13.5px] font-medium text-text-primary">{label}</span>
                {description && <span className="block text-[12px] text-text-secondary mt-0.5">{description}</span>}
            </span>
            {input}
            {control}
        </label>
    )
}
