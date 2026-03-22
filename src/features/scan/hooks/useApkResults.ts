import { useMemo, useState } from 'react'
import type { ApkScanResult } from '../types/apk.types'

type SortKey = 'risk' | 'name' | 'size' | 'lastUsed'
type FilterLevel = 'all' | 'safe' | 'caution' | 'risky' | 'critical'

export function useApkResults(results: ApkScanResult[]) {
    const [filter, setFilter] = useState<FilterLevel>('all')
    const [sort, setSort] = useState<SortKey>('risk')

    const filtered = useMemo(() => {
        let items = [...results]

        if (filter !== 'all') {
            items = items.filter((r) => r.riskLevel === filter)
        }

        items.sort((a, b) => {
            switch (sort) {
                case 'risk':
                    return b.riskScore - a.riskScore
                case 'name':
                    return a.appName.localeCompare(b.appName)
                case 'size':
                    return b.apkSize - a.apkSize
                case 'lastUsed':
                    return 0 // keep original order
                default:
                    return 0
            }
        })

        return items
    }, [results, filter, sort])

    const counts = useMemo(() => ({
        all: results.length,
        safe: results.filter((r) => r.riskLevel === 'safe').length,
        caution: results.filter((r) => r.riskLevel === 'caution').length,
        risky: results.filter((r) => r.riskLevel === 'risky').length,
        critical: results.filter((r) => r.riskLevel === 'critical').length,
    }), [results])

    return { filtered, counts, filter, setFilter, sort, setSort }
}
