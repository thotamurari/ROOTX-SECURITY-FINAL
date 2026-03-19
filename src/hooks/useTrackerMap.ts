import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trackerAPI } from '@/services/api'
import { getSocket } from '@/services/socket'
import type { TrackerConnection } from '@/types/api'

export function useTrackerMap() {
    const queryClient = useQueryClient()
    const [newConnection, setNewConnection] = useState<TrackerConnection | null>(null)

    const connectionsQuery = useQuery({
        queryKey: ['tracker', 'connections'],
        queryFn: trackerAPI.getConnections,
    })

    useEffect(() => {
        const socket = getSocket()

        const onNewConnection = (data: { connection: TrackerConnection }) => {
            setNewConnection(data.connection)
            queryClient.setQueryData<TrackerConnection[]>(
                ['tracker', 'connections'],
                (old) => (old ? [data.connection, ...old] : [data.connection])
            )
        }

        socket.on('tracker:new_connection', onNewConnection)
        return () => {
            socket.off('tracker:new_connection', onNewConnection)
        }
    }, [queryClient])

    const blockMutation = useMutation({
        mutationFn: trackerAPI.toggleBlock,
        onMutate: async (req) => {
            await queryClient.cancelQueries({ queryKey: ['tracker', 'connections'] })
            const prev = queryClient.getQueryData<TrackerConnection[]>(['tracker', 'connections'])
            queryClient.setQueryData<TrackerConnection[]>(
                ['tracker', 'connections'],
                (old) =>
                    old?.map((c) =>
                        c.id === req.connectionId ? { ...c, isBlocked: req.blocked } : c
                    ) ?? []
            )
            return { prev }
        },
        onError: (_err, _vars, context) => {
            if (context?.prev) {
                queryClient.setQueryData(['tracker', 'connections'], context.prev)
            }
        },
    })

    return {
        connections: connectionsQuery.data ?? [],
        isLoading: connectionsQuery.isLoading,
        newConnection,
        toggleBlock: blockMutation.mutate,
    }
}
