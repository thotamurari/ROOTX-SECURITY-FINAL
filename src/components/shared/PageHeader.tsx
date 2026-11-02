import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PageHeaderProps {
    title: string
    description?: string
    icon?: ReactNode
    actions?: ReactNode
}

/**
 * Consistent page-level heading used at the top of every route so title
 * size, spacing, and the title/description/actions layout stop varying
 * page to page.
 */
export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
        >
            <div className="flex items-center gap-3 min-w-0">
                {icon && (
                    <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                        {icon}
                    </span>
                )}
                <div className="min-w-0">
                    <h1 className="text-[19px] sm:text-[22px] font-bold text-text-primary tracking-tight truncate">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-[13px] text-text-secondary mt-0.5 truncate">{description}</p>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </motion.div>
    )
}
