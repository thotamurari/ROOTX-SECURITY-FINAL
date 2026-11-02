import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface Props {
    icon?: LucideIcon
    title?: string
    message?: string
    action?: ReactNode
}

export function EmptyState({
    icon: Icon = Inbox,
    title = 'No data yet',
    message = 'There is nothing to display at the moment.',
    action,
}: Props) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 text-text-tertiary" />
            </div>
            <h3 className="text-[15px] font-ui font-semibold text-text-secondary mb-1">{title}</h3>
            <p className="text-[13px] text-text-tertiary font-body max-w-xs">{message}</p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    )
}
