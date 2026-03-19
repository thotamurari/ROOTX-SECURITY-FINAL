import { useQuery } from '@tanstack/react-query'
import { behaviorAPI } from '@/services/api'

export function useBehavioralDNA() {
    const profileQuery = useQuery({
        queryKey: ['behavior', 'profile'],
        queryFn: behaviorAPI.getProfile,
    })

    const anomaliesQuery = useQuery({
        queryKey: ['behavior', 'anomalies'],
        queryFn: behaviorAPI.getAnomalies,
    })

    const reportQuery = useQuery({
        queryKey: ['behavior', 'report'],
        queryFn: behaviorAPI.getReport,
    })

    return {
        profile: profileQuery.data,
        isLoadingProfile: profileQuery.isLoading,
        anomalies: anomaliesQuery.data,
        isLoadingAnomalies: anomaliesQuery.isLoading,
        report: reportQuery.data,
        isLoadingReport: reportQuery.isLoading,
    }
}
