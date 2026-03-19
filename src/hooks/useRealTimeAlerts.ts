import { useEffect } from 'react'
import { getSocket } from '@/services/socket'
import toast from 'react-hot-toast'
import type { ThreatDetectedEvent, BehaviorAnomalyEvent } from '@/types/api'

export function useRealTimeAlerts() {
    useEffect(() => {
        const socket = getSocket()

        const onThreatDetected = (data: ThreatDetectedEvent) => {
            toast.error(
                `🚨 Threat Detected: ${data.message}`,
                {
                    duration: 8000,
                    style: {
                        background: '#1a0a0f',
                        color: '#FF3366',
                        border: '1px solid rgba(255, 51, 102, 0.3)',
                    },
                }
            )
        }

        const onBehaviorAnomaly = (data: BehaviorAnomalyEvent) => {
            toast(
                `⚠️ Anomaly: ${data.anomaly.description}`,
                {
                    duration: 6000,
                    style: {
                        background: '#1a150a',
                        color: '#FF8C00',
                        border: '1px solid rgba(255, 140, 0, 0.3)',
                    },
                }
            )
        }

        socket.on('threat:detected', onThreatDetected)
        socket.on('behavior:anomaly', onBehaviorAnomaly)

        return () => {
            socket.off('threat:detected', onThreatDetected)
            socket.off('behavior:anomaly', onBehaviorAnomaly)
        }
    }, [])
}
