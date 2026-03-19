import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { communityAPI } from '@/services/api'

export function useCommunityFeed() {
    const queryClient = useQueryClient()

    const feedQuery = useQuery({
        queryKey: ['community', 'feed'],
        queryFn: () => communityAPI.getFeed(),
    })

    const voteMutation = useMutation({
        mutationFn: communityAPI.vote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community', 'feed'] })
        },
    })

    const reportMutation = useMutation({
        mutationFn: communityAPI.submitReport,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community', 'feed'] })
        },
    })

    return {
        feed: feedQuery.data?.data ?? [],
        isLoading: feedQuery.isLoading,
        total: feedQuery.data?.total ?? 0,
        vote: voteMutation.mutate,
        submitReport: reportMutation.mutate,
        isSubmitting: reportMutation.isPending,
    }
}
