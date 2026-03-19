import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface Props {
    icon?: LucideIcon
    title?: string
    message?: string
}

export function EmptyState({
    icon: Icon = Inbox,
    title = 'No data yet',
    message = 'There is nothing to display at the moment.',
}: Props) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 text-text-muted" />
            </div>
            <h3 className="text-lg font-ui font-semibold text-text-secondary mb-1">{title}</h3>
            <p className="text-sm text-text-muted font-body max-w-xs">{message}</p>
        </div>
    )
}
