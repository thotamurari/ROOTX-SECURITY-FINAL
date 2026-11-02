import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    variant?: Variant
    size?: Size
    isLoading?: boolean
    leftIcon?: ReactNode
    rightIcon?: ReactNode
    fullWidth?: boolean
    children?: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
    primary:
        'bg-accent text-white shadow-sm hover:bg-accent-hover active:bg-accent-active disabled:hover:bg-accent',
    secondary:
        'bg-surface-2 text-text-primary border border-border hover:bg-surface-3',
    outline:
        'bg-transparent text-text-primary border border-border hover:bg-surface-2',
    ghost:
        'bg-transparent text-text-secondary hover:bg-surface-2 hover:text-text-primary',
    danger:
        'bg-danger text-white shadow-sm hover:bg-danger-hover',
}

const SIZE_CLASSES: Record<Size, string> = {
    sm: 'h-8 px-3 text-[12.5px] gap-1.5 rounded-md',
    md: 'h-10 px-4 text-[13.5px] gap-2 rounded-lg',
    lg: 'h-12 px-5 text-[14.5px] gap-2 rounded-lg',
    icon: 'h-10 w-10 rounded-lg justify-center',
}

/**
 * Shared button primitive. Purely presentational — pass any native button
 * props (onClick, type, disabled, etc.) straight through so existing click
 * handlers / form submissions keep working unchanged.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        variant = 'primary',
        size = 'md',
        isLoading = false,
        leftIcon,
        rightIcon,
        fullWidth = false,
        disabled,
        className = '',
        children,
        ...props
    },
    ref
) {
    return (
        <motion.button
            ref={ref}
            whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
            transition={{ duration: 0.12 }}
            disabled={disabled || isLoading}
            className={[
                'inline-flex items-center font-semibold transition-colors duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
                VARIANT_CLASSES[variant],
                SIZE_CLASSES[size],
                fullWidth ? 'w-full justify-center' : '',
                className,
            ].join(' ')}
            {...(props as HTMLMotionProps<'button'>)}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
            )}
            {children && <span className="truncate">{children}</span>}
            {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </motion.button>
    )
})
