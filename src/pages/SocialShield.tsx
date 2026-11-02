import { motion } from 'framer-motion'
import { MessageSquareWarning } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { SocialEngineeringScanner } from '@/features/scan/components/SocialEngineeringScanner'

/**
 * NOTE: this route was removed from App.tsx — the feature now lives inside the
 * Scan Engine's "Social Intel" tab, which renders the same
 * <SocialEngineeringScanner />. The page is kept as a thin wrapper so any
 * lingering deep link still renders the current UI rather than a stale copy.
 */
export default function SocialShield() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="max-w-3xl mx-auto w-full pb-8"
        >
            <PageHeader
                title="Social Engineering Shield"
                description="Detect manipulation tactics in messages, emails and SMS"
                icon={<MessageSquareWarning className="w-5 h-5" />}
            />
            <SocialEngineeringScanner />
        </motion.div>
    )
}
