import { Globe } from 'lucide-react'
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Line,
} from 'react-simple-maps'
import { Card } from '@/components/shared/Card'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const markers = [
    { coordinates: [77.5946, 12.9716] as [number, number], flagged: false, label: 'Bangalore' },
    { coordinates: [-74.006, 40.7128] as [number, number], flagged: true, label: 'New York' },
    { coordinates: [116.4074, 39.9042] as [number, number], flagged: true, label: 'Beijing' },
    { coordinates: [37.6173, 55.7558] as [number, number], flagged: true, label: 'Moscow' },
    { coordinates: [2.3522, 48.8566] as [number, number], flagged: false, label: 'Paris' },
    { coordinates: [151.2093, -33.868] as [number, number], flagged: false, label: 'Sydney' },
    { coordinates: [-43.1729, -22.906] as [number, number], flagged: false, label: 'Rio' },
    { coordinates: [28.9784, 41.0082] as [number, number], flagged: false, label: 'Istanbul' },
    { coordinates: [139.6917, 35.6895] as [number, number], flagged: false, label: 'Tokyo' },
    { coordinates: [18.4241, -33.9249] as [number, number], flagged: false, label: 'Cape Town' },
]

const connections = [
    { from: [77.5946, 12.9716] as [number, number], to: [-74.006, 40.7128] as [number, number], flagged: true },
    { from: [77.5946, 12.9716] as [number, number], to: [116.4074, 39.9042] as [number, number], flagged: true },
    { from: [77.5946, 12.9716] as [number, number], to: [2.3522, 48.8566] as [number, number], flagged: false },
    { from: [77.5946, 12.9716] as [number, number], to: [139.6917, 35.6895] as [number, number], flagged: false },
]

const DANGER = 'var(--danger)'
const ACCENT = 'var(--accent)'

export function WorldThreatMapMini() {
    const flaggedCount = markers.filter((m) => m.flagged).length

    return (
        <Card padding="none" className="overflow-hidden h-full flex flex-col">
            <div className="flex items-center gap-2 px-5 pt-4 pb-3">
                <span className="w-7 h-7 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0" aria-hidden="true">
                    <Globe className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-[14px] font-semibold text-text-primary tracking-tight truncate">
                    Global Threat Map
                </h3>
            </div>

            {/* Fluid width, capped height — the projection scales with the
                container so the map stays usable on narrow phone viewports. */}
            <div className="relative w-full h-[180px] sm:h-[220px] md:h-[240px] border-t border-border bg-base">
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ scale: 110, center: [20, 20] }}
                    style={{ width: '100%', height: '100%' }}
                    aria-hidden="true"
                    focusable="false"
                >
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="var(--bg-surface-2)"
                                    stroke="var(--border-default)"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: 'none' },
                                        hover: { fill: 'var(--bg-surface-3)', outline: 'none' },
                                        pressed: { outline: 'none' },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* Connection lines */}
                    {connections.map((conn, i) => (
                        <Line
                            key={i}
                            from={conn.from}
                            to={conn.to}
                            stroke={conn.flagged ? DANGER : ACCENT}
                            strokeWidth={1}
                            strokeLinecap="round"
                            style={{ strokeDasharray: '4 2', opacity: 0.55 }}
                        />
                    ))}

                    {/* Markers */}
                    {markers.map((m, i) => (
                        <Marker key={i} coordinates={m.coordinates}>
                            <circle
                                r={3.5}
                                fill={m.flagged ? DANGER : ACCENT}
                                opacity={0.95}
                            />
                            <circle
                                r={7}
                                fill="none"
                                stroke={m.flagged ? DANGER : ACCENT}
                                strokeWidth={1}
                                opacity={0.3}
                                className="animate-[map-ping_2s_ease-out_infinite]"
                            />
                        </Marker>
                    ))}
                </ComposableMap>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border mt-auto">
                <span className="text-[11.5px] text-text-secondary tabular-nums">
                    {markers.length} connections
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" aria-hidden="true" />
                    <span className="text-[11.5px] font-semibold text-danger tabular-nums">
                        {flaggedCount} flagged
                    </span>
                </span>
            </div>

            <span className="sr-only">
                Global threat map: {markers.length} monitored connections, {flaggedCount} flagged as malicious.
            </span>
        </Card>
    )
}
