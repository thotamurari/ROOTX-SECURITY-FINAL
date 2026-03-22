import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Line,
} from 'react-simple-maps'

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

export function WorldThreatMapMini() {
    const flaggedCount = markers.filter((m) => m.flagged).length

    return (
        <div className="rounded-[16px] bg-[rgba(13,13,20,0.75)] backdrop-blur-[20px] border border-[#2A2A40] overflow-hidden transition-all hover:border-[rgba(0,245,255,0.15)] hover:shadow-[0_0_24px_rgba(0,245,255,0.06)]">
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00F5FF]" style={{ filter: 'drop-shadow(0 0 6px #00F5FF)' }} />
                <h3 className="text-[15px] font-sans font-semibold text-[#F0F0FF]">Global Threat Map</h3>
            </div>

            <div className="relative h-[180px] sm:h-[220px] md:h-[240px]">
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ scale: 110, center: [20, 20] }}
                    style={{ width: '100%', height: '100%' }}
                >
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#1A1A2E"
                                    stroke="#2A2A40"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: 'none' },
                                        hover: { fill: '#2A2A40', outline: 'none' },
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
                            stroke={conn.flagged ? '#FF3366' : '#00F5FF'}
                            strokeWidth={1}
                            strokeLinecap="round"
                            style={{ strokeDasharray: '4 2', opacity: 0.6 }}
                        />
                    ))}

                    {/* Markers */}
                    {markers.map((m, i) => (
                        <Marker key={i} coordinates={m.coordinates}>
                            <circle
                                r={3.5}
                                fill={m.flagged ? '#FF3366' : '#00F5FF'}
                                opacity={0.9}
                                style={{ filter: `drop-shadow(0 0 4px ${m.flagged ? '#FF3366' : '#00F5FF'})` }}
                            />
                            <circle
                                r={7}
                                fill="none"
                                stroke={m.flagged ? '#FF3366' : '#00F5FF'}
                                strokeWidth={1}
                                opacity={0.3}
                                className="animate-[map-ping_2s_ease-out_infinite]"
                            />
                        </Marker>
                    ))}
                </ComposableMap>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#1E1E30]">
                <span className="text-[11px] font-mono text-[#8888AA]">{markers.length} connections</span>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF3366] animate-[live-pulse_1.5s_ease-in-out_infinite]" />
                    <span className="text-[11px] font-mono font-semibold text-[#FF3366]">{flaggedCount} flagged</span>
                </div>
            </div>
        </div>
    )
}
