import { useQuery } from '@tanstack/react-query'
import { behaviorAPI } from '@/services/api'

export function useBehavioralDNA() {
    const profileQuery = useQuery({
        queryKey: ['behavior', 'profile'],
        queryFn: behaviorAPI.getProfile,
        retry: 1,
        staleTime: 5 * 60_000, // Cache for 5 minutes
        gcTime: 10 * 60_000,   // Keep in cache for 10 minutes
        // Provide placeholder data so Dashboard never blocks on loading
        placeholderData: {
            userId: 'local',
            baseline: {
                appUsage: 60,
                locationVariance: 10,
                networkActivity: 45,
                timePattern: 80,
                permissionUsage: 30,
                contactAccess: 5,
                cameraUsage: 8,
                paymentActivity: 2,
            },
            today: {
                appUsage: 55,
                locationVariance: 12,
                networkActivity: 40,
                timePattern: 75,
                permissionUsage: 28,
                contactAccess: 4,
                cameraUsage: 6,
                paymentActivity: 1,
            },
            anomalyScore: 8,
            lastUpdated: new Date().toISOString(),
        },
    })

    const anomaliesQuery = useQuery({
        queryKey: ['behavior', 'anomalies'],
        queryFn: behaviorAPI.getAnomalies,
        retry: 1,
        staleTime: 5 * 60_000,
        enabled: false, // Only fetch when explicitly needed — not on Dashboard
    })

    const reportQuery = useQuery({
        queryKey: ['behavior', 'report'],
        queryFn: behaviorAPI.getReport,
        retry: 1,
        staleTime: 5 * 60_000,
        enabled: false, // Only fetch when explicitly needed — not on Dashboard
    })

    return {
        profile: profileQuery.data,
        isLoadingProfile: profileQuery.isLoading && !profileQuery.isPlaceholderData,
        anomalies: anomaliesQuery.data,
        isLoadingAnomalies: anomaliesQuery.isLoading,
        report: reportQuery.data,
        isLoadingReport: reportQuery.isLoading,
    }
}
