import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { sessionsAPI } from '@/services/api'

export function useDeviceSessions() {
    const queryClient = useQueryClient()

    const sessionsQuery = useQuery({
        queryKey: ['auth', 'sessions'],
        queryFn: sessionsAPI.list,
    })

    const revokeMutation = useMutation({
        mutationFn: sessionsAPI.revoke,
        onSuccess: () => {
            toast.success('Device logged out')
            queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] })
        },
        onError: () => toast.error('Failed to log out that device'),
    })

    const revokeOthersMutation = useMutation({
        mutationFn: sessionsAPI.revokeOthers,
        onSuccess: () => {
            toast.success('Logged out of all other devices')
            queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] })
        },
        onError: () => toast.error('Failed to log out other devices'),
    })

    return {
        sessions: sessionsQuery.data ?? [],
        isLoading: sessionsQuery.isLoading,
        isError: sessionsQuery.isError,
        revoke: revokeMutation.mutate,
        isRevoking: revokeMutation.isPending,
        revokeOthers: revokeOthersMutation.mutate,
        isRevokingOthers: revokeOthersMutation.isPending,
    }
}
