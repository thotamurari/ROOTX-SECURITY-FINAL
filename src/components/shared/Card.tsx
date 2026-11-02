import { forwardRef } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    interactive?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
    children?: ReactNode
}

const PADDING_CLASSES = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
}

/**
 * Base surface used for every card / panel across the app. Keeps radius,
 * border, background and elevation consistent so pages don't hand-roll
 * `bg-[#121214] border border-white/5 rounded-xl` ad hoc.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
    { interactive = false, padding = 'md', className = '', children, ...props },
    ref
) {
    return (
        <div
            ref={ref}
            className={[
                'bg-surface-1 border border-border rounded-2xl shadow-xs',
                PADDING_CLASSES[padding],
                interactive
                    ? 'transition-all duration-200 hover:border-border-strong hover:shadow-sm cursor-pointer'
                    : '',
                className,
            ].join(' ')}
            {...props}
        >
            {children}
        </div>
    )
})

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={['flex items-center justify-between gap-3 mb-4', className].join(' ')} {...props}>
            {children}
        </div>
    )
}

export function CardTitle({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={['text-[14px] font-semibold text-text-primary tracking-tight', className].join(' ')} {...props}>
            {children}
        </h3>
    )
}

export function CardDescription({ className = '', children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={['text-[12.5px] text-text-secondary mt-0.5', className].join(' ')} {...props}>
            {children}
        </p>
    )
}
