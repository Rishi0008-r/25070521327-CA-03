import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAudio } from '../context/AudioContext';
import LiveTrackerMap from '../components/LiveTrackerMap';
import IndiaRailwayMap from '../components/IndiaRailwayMap';
import {
  Navigation,
  Train,
  Radio,
  Terminal,
  Clock,
  Compass,
  MapPin,
  Activity,
  Layers,
  Map,
  Route,
} from 'lucide-react';

const LiveTracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { liveTrains, isConnected } = useSocket();
  const { playClick, playStationChime } = useAudio();

  const initialTrain = searchParams.get('train') || '22436';
  const [selectedTrainNumber, setSelectedTrainNumber] = useState(initialTrain);
  const [packetLogs, setPacketLogs] = useState([]);
  const [activeMapView, setActiveMapView] = useState('india-map'); // 'india-map' | 'linear-track'

  // Play iconic Indian Railways station announcement chime when entering radar!
  useEffect(() => {
    playStationChime();
  }, []);

  useEffect(() => {
    const param = searchParams.get('train');
    if (param) setSelectedTrainNumber(param);
  }, [searchParams]);

  const handleSelectTrain = (trainNo) => {
    playClick();
    setSelectedTrainNumber(trainNo);
    setSearchParams({ train: trainNo });
  };

  // Build telemetry log from live updates
  useEffect(() => {
    if (liveTrains && liveTrains.length > 0) {
      const active = liveTrains.find((t) => t.trainNumber === selectedTrainNumber) || liveTrains[0];
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        trainNumber: active.trainNumber,
        speed: active.speedKmH,
        progress: active.progressPercentage,
        currentStn: active.currentStationName || 'In Transit',
        nextStn: active.nextStationName || 'Terminal',
        status: active.status,
      };

      setPacketLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    }
  }, [liveTrains, selectedTrainNumber]);

  const activeTrain =
    liveTrains.find((t) => t.trainNumber === selectedTrainNumber) || liveTrains[0];

  return (
    <div className="space-y-8 py-6">
      {/* Page Title & View Switcher */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-cyan-400" />
              <span>All-India Train Fleet Radar & Live Tracking</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time GPS coordinate telemetry, inter-station progression, and animated transit across India's railway trunk network.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveMapView('india-map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeMapView === 'india-map'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>🇮🇳 All-India Map</span>
            </button>
            <button
              onClick={() => setActiveMapView('linear-track')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeMapView === 'linear-track'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>🛤️ Station Route Radar</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span className={isConnected ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
              {isConnected ? 'GPS LIVE' : 'CONNECTING'}
            </span>
          </div>
        </div>
      </div>

      {/* Conditionally Render Selected View */}
      {activeMapView === 'india-map' ? (
        <IndiaRailwayMap
          selectedTrainNumber={selectedTrainNumber}
          onSelectTrain={handleSelectTrain}
        />
      ) : (
        <LiveTrackerMap
          selectedTrainNumber={selectedTrainNumber}
          onSelectTrain={handleSelectTrain}
        />
      )}

      {/* Bottom Section: Real-Time Telemetry Event Log + Station Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-time Telemetry Packet Log */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-xs font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>LIVE TELEMETRY PACKET FEED (WebSocket)</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              3s Interval
            </span>
          </div>

          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 font-mono text-[11px] h-64 overflow-y-auto space-y-2">
            {packetLogs.length === 0 ? (
              <div className="text-slate-600 text-center py-10">Listening for telemetry packets...</div>
            ) : (
              packetLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded bg-slate-900/60 border border-slate-800/50 flex flex-col gap-1 text-slate-300"
                >
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="text-cyan-400 font-bold">[{log.time}]</span>
                    <span>TRAIN #{log.trainNumber}</span>
                    <span
                      className={
                        log.status === 'DELAYED'
                          ? 'text-amber-400 font-bold'
                          : 'text-emerald-400 font-bold'
                      }
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-200">
                    <span className="text-slate-500">SPD:</span> {log.speed} km/h |{' '}
                    <span className="text-slate-500">LEG:</span> {log.progress}% |{' '}
                    <span className="text-slate-500">APPROACHING:</span> {log.nextStn}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detailed Route Stations List */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-xs font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>ACTIVE ROUTE CORRIDOR ({activeTrain?.trainName})</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {activeTrain?.route?.length || 0} Scheduled Halts
            </span>
          </div>

          <div className="space-y-3">
            {activeTrain?.route?.map((stn, index) => {
              const isPassed = index <= (activeTrain.currentLegIndex || 0);

              return (
                <div
                  key={stn.name}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                    isPassed
                      ? 'bg-slate-900/80 border-slate-700 text-white'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                        isPassed
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200 block">{stn.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Coordinates: {stn.lat.toFixed(2)}°N, {stn.lng.toFixed(2)}°E
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-cyan-400 font-bold block">{stn.km} km</span>
                    <span className="text-[10px] text-slate-500">
                      {index === 0
                        ? 'Origin'
                        : index === activeTrain.route.length - 1
                        ? 'Destination'
                        : 'Scheduled Stop'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
