import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import {
  Train,
  MapPin,
  Compass,
  Gauge,
  Radio,
  Sparkles,
  Info,
  Maximize2,
  Navigation,
} from 'lucide-react';

// Geographic Coordinate bounds for India
// Lng: 68.0°E (West - Gujarat) to 96.0°E (East - Assam)
// Lat: 8.0°N (South - Kanyakumari) to 36.0°N (North - Kashmir)
const MAP_BOUNDS = {
  minLng: 68.0,
  maxLng: 96.0,
  minLat: 8.0,
  maxLat: 36.0,
  svgWidth: 800,
  svgHeight: 900,
};

// Coordinate projection helper
export const projectGeoToSvg = (lat, lng) => {
  const x =
    ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) *
    MAP_BOUNDS.svgWidth;
  const y =
    ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) *
    MAP_BOUNDS.svgHeight;
  return { x: Math.round(x), y: Math.round(y) };
};

// Major Indian Railway Junctions with real geo-coordinates
const MAJOR_STATIONS = [
  { code: 'NDLS', name: 'New Delhi', lat: 28.6139, lng: 77.2090, zone: 'Northern' },
  { code: 'CNB', name: 'Kanpur Central', lat: 26.4499, lng: 80.3319, zone: 'North Central' },
  { code: 'PRYJ', name: 'Prayagraj Jn', lat: 25.4358, lng: 81.8463, zone: 'North Central' },
  { code: 'BSB', name: 'Varanasi Jn', lat: 25.3176, lng: 82.9739, zone: 'North Eastern' },
  { code: 'HWH', name: 'Kolkata Howrah', lat: 22.5697, lng: 88.3697, zone: 'Eastern' },
  { code: 'MMCT', name: 'Mumbai Central', lat: 18.9696, lng: 72.8193, zone: 'Western' },
  { code: 'BRC', name: 'Vadodara Jn', lat: 22.3072, lng: 73.1812, zone: 'Western' },
  { code: 'KOTA', name: 'Kota Jn', lat: 25.1800, lng: 75.8300, zone: 'West Central' },
  { code: 'AGC', name: 'Agra Cantt', lat: 27.1593, lng: 78.0063, zone: 'North Central' },
  { code: 'GWL', name: 'Gwalior Jn', lat: 26.2183, lng: 78.1828, zone: 'North Central' },
  { code: 'BPL', name: 'Bhopal Jn', lat: 23.2599, lng: 77.4126, zone: 'West Central' },
  { code: 'MAS', name: 'Chennai Central', lat: 13.0827, lng: 80.2707, zone: 'Southern' },
  { code: 'SBC', name: 'Bengaluru City', lat: 12.9716, lng: 77.5946, zone: 'South Western' },
  { code: 'SC', name: 'Secunderabad', lat: 17.3850, lng: 78.4867, zone: 'South Central' },
  { code: 'ADI', name: 'Ahmedabad Jn', lat: 23.0225, lng: 72.5714, zone: 'Western' },
  { code: 'JP', name: 'Jaipur Jn', lat: 26.9124, lng: 75.7873, zone: 'North Western' },
  { code: 'PNBE', name: 'Patna Jn', lat: 25.5941, lng: 85.1376, zone: 'East Central' },
  { code: 'GHY', name: 'Guwahati', lat: 26.1445, lng: 91.7362, zone: 'Northeast Frontier' },
  { code: 'JAT', name: 'Jammu Tawi', lat: 32.7266, lng: 74.8570, zone: 'Northern' },
  { code: 'MAO', name: 'Madgaon (Goa)', lat: 15.2741, lng: 73.9582, zone: 'Konkan' },
];

// Major Indian Railway Network Trunk Lines
const TRUNK_CORRIDORS = [
  // Delhi - Varanasi - Kolkata Corridor (Vande Bharat / Duronto)
  ['NDLS', 'CNB', 'PRYJ', 'BSB', 'PNBE', 'HWH'],
  // Delhi - Mumbai Rajdhani Route
  ['NDLS', 'KOTA', 'BRC', 'MMCT'],
  // Delhi - Bhopal Shatabdi Route
  ['NDLS', 'AGC', 'GWL', 'BPL'],
  // Delhi - Jaipur - Ahmedabad Route
  ['NDLS', 'JP', 'ADI', 'BRC'],
  // Mumbai - Goa - Bengaluru
  ['MMCT', 'MAO', 'SBC'],
  // North-South Corridor (Delhi - Bhopal - Secunderabad - Chennai - Bengaluru)
  ['BPL', 'SC', 'MAS', 'SBC'],
  // Northern Extension
  ['JAT', 'NDLS'],
  // Eastern Extension
  ['HWH', 'GHY'],
];

const IndiaRailwayMap = ({ selectedTrainNumber, onSelectTrain, zoneFilter }) => {
  const { liveTrains, isConnected } = useSocket();
  const [hoveredStation, setHoveredStation] = useState(null);
  const [hoveredTrain, setHoveredTrain] = useState(null);
  const [internalZone, setInternalZone] = useState('ALL');

  const currentZone = zoneFilter || internalZone;

  // Filtered stations based on zone
  const displayedStations =
    !currentZone || currentZone === 'ALL'
      ? MAJOR_STATIONS
      : MAJOR_STATIONS.filter((s) => s.zone.toLowerCase().includes(currentZone.toLowerCase()));

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden">
      {/* Map Header & Controls (if not controlled externally) */}
      {!zoneFilter && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                <span>Interactive All-India Railway Geographic Radar</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Real-time geospatial tracking across Indian Railways trunk corridors with live Socket.io telemetry.
            </p>
          </div>

          {/* Zone Filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {['ALL', 'Northern', 'Western', 'Central', 'Eastern', 'Southern'].map((zone) => (
              <button
                key={zone}
                onClick={() => setInternalZone(zone)}
                className={`px-3 py-1 rounded-lg transition ${
                  internalZone === zone
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 my-4 py-2 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-600 border border-white shadow-xs" />
            <span className="text-slate-700">Station Junction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 rounded-full bg-cyan-500" />
            <span className="text-slate-700">Electrified Trunk Line</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-emerald-700 font-bold">Active Live Locomotive</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-600' : 'text-rose-500'}`} />
          <span className="font-bold">{isConnected ? 'LIVE TELEMETRY STREAM' : 'OFFLINE'}</span>
        </div>
      </div>


      {/* Main SVG Geospatial Canvas */}
      <div className="relative w-full aspect-[4/4.5] max-h-[680px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl flex items-center justify-center">
        {/* Subtle Map Coordinate Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <svg
          viewBox={`0 0 ${MAP_BOUNDS.svgWidth} ${MAP_BOUNDS.svgHeight}`}
          className="w-full h-full object-contain filter drop-shadow-lg"
        >
          <defs>
            {/* Glow Filters */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Linear gradients for corridors */}
            <linearGradient id="corridor-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* India Boundary Outline Silhouette */}
          <path
            d="M 230 110 
               C 270 90, 310 95, 320 130 
               C 340 180, 420 190, 460 230 
               C 520 240, 580 230, 660 250 
               C 710 260, 740 290, 720 330 
               C 690 350, 640 340, 610 380 
               C 570 420, 550 480, 550 540 
               C 520 620, 480 700, 430 780 
               C 400 830, 380 840, 360 810 
               C 330 750, 270 650, 260 580 
               C 240 500, 220 440, 190 400 
               C 160 380, 140 370, 160 340 
               C 180 320, 200 270, 210 220 
               Z"
            fill="#0f172a"
            fillOpacity="0.35"
            stroke="#1e293b"
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />

          {/* Railway Trunk Lines (Corridors) */}
          {TRUNK_CORRIDORS.map((corridor, cIdx) => {
            const points = corridor
              .map((code) => {
                const stn = MAJOR_STATIONS.find((s) => s.code === code);
                if (!stn) return null;
                const { x, y } = projectGeoToSvg(stn.lat, stn.lng);
                return `${x},${y}`;
              })
              .filter(Boolean)
              .join(' ');

            return (
              <polyline
                key={cIdx}
                points={points}
                fill="none"
                stroke="url(#corridor-gradient)"
                strokeWidth="2.5"
                strokeOpacity="0.6"
                strokeDasharray="4 2"
                className="transition-all duration-300 hover:stroke-cyan-300"
              />
            );
          })}

          {/* Major Station Junction Nodes */}
          {displayedStations.map((station) => {
            const { x, y } = projectGeoToSvg(station.lat, station.lng);
            const isHovered = hoveredStation?.code === station.code;

            return (
              <g
                key={station.code}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredStation(station)}
                onMouseLeave={() => setHoveredStation(null)}
              >
                {/* Station circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 8 : 5}
                  fill={isHovered ? '#38bdf8' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-200"
                  filter={isHovered ? 'url(#glow-cyan)' : ''}
                />

                {/* Station Code Label */}
                <text
                  x={x + 8}
                  y={y - 6}
                  fill={isHovered ? '#ffffff' : '#94a3b8'}
                  fontSize={isHovered ? '12' : '10'}
                  fontWeight={isHovered ? 'bold' : '600'}
                  fontFamily="monospace"
                  className="pointer-events-none select-none transition-all duration-200"
                >
                  {station.code}
                </text>
              </g>
            );
          })}

          {/* Live Moving Locomotives from Socket.io Stream */}
          {liveTrains.map((train) => {
            // Determine geographic position from live telemetry
            let lat = train.currentLat;
            let lng = train.currentLng;

            if (!lat || !lng) {
              const route = train.route || [];
              const legIdx = train.currentLegIndex || 0;
              const cur = route[legIdx] || route[0];
              const next = route[legIdx + 1] || cur;
              const frac = (train.progressPercentage || 0) / 100;

              lat = cur.lat + (next.lat - cur.lat) * frac;
              lng = cur.lng + (next.lng - cur.lng) * frac;
            }

            const { x, y } = projectGeoToSvg(lat, lng);
            const isSelected = train.trainNumber === selectedTrainNumber;

            return (
              <g
                key={train.trainNumber}
                className="cursor-pointer"
                onClick={() => onSelectTrain && onSelectTrain(train.trainNumber)}
                onMouseEnter={() => setHoveredTrain(train)}
                onMouseLeave={() => setHoveredTrain(null)}
              >
                {/* Outer animated radar pulse ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 18 : 12}
                  fill="none"
                  stroke={train.delayMinutes > 0 ? '#f59e0b' : '#10b981'}
                  strokeWidth="2"
                  opacity="0.8"
                  className="animate-ping"
                />

                {/* Locomotive Center Core */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 9 : 7}
                  fill={train.delayMinutes > 0 ? '#f59e0b' : '#38bdf8'}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  filter="url(#glow-gold)"
                />

                {/* Train Badge Label */}
                <rect
                  x={x - 28}
                  y={y + 11}
                  width="56"
                  height="16"
                  rx="4"
                  fill="#030712"
                  fillOpacity="0.9"
                  stroke={isSelected ? '#38bdf8' : '#334155'}
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={y + 22}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="pointer-events-none select-none"
                >
                  #{train.trainNumber}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Live Train Floating Inspector Card (on click/hover) */}
        {(hoveredTrain || selectedTrainNumber) && (
          <div className="absolute top-4 right-4 z-20 max-w-xs glass-panel p-4 rounded-2xl border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-fade-in">
            {(() => {
              const active =
                hoveredTrain ||
                liveTrains.find((t) => t.trainNumber === selectedTrainNumber) ||
                liveTrains[0];
              if (!active) return null;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                      {active.trainNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        active.delayMinutes > 0
                          ? 'bg-amber-950 text-amber-300 border border-amber-500'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                      }`}
                    >
                      {active.delayMinutes > 0 ? `+${active.delayMinutes}m DELAY` : 'ON TIME'}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm">{active.trainName}</h4>

                  <div className="text-[11px] text-slate-300 space-y-1 py-1 border-y border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Current Station:</span>
                      <span className="font-medium text-white">
                        {active.currentStationName?.split(' (')[0] || 'In Transit'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Next Stop:</span>
                      <span className="font-medium text-cyan-400">
                        {active.nextStationName?.split(' (')[0] || 'Terminal'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                      {active.speedKmH} km/h
                    </span>
                    <span className="text-cyan-400 font-bold">
                      Leg: {active.progressPercentage}%
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Hovered Station Tooltip */}
        {hoveredStation && (
          <div className="absolute bottom-4 left-4 z-20 glass-panel px-4 py-2.5 rounded-xl border border-slate-700 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{hoveredStation.name} ({hoveredStation.code})</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Zone: {stationZoneName(hoveredStation.zone)} • Coordinates: {hoveredStation.lat}°N, {hoveredStation.lng}°E
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const stationZoneName = (zone) => `${zone} Railway Zone`;

export default IndiaRailwayMap;
