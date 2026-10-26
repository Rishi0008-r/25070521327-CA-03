import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import {
  Train,
  Gauge,
  MapPin,
  Clock,
  Compass,
  AlertCircle,
  Zap,
  Activity,
  CheckCircle,
} from 'lucide-react';

const LiveTrackerMap = ({ selectedTrainNumber, onSelectTrain }) => {
  const { liveTrains, isConnected, triggerDelaySimulation } = useSocket();
  const [delayInput, setDelayInput] = useState(15);

  if (!liveTrains || liveTrains.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center text-slate-400">
        <Activity className="w-8 h-8 mx-auto text-cyan-400 animate-spin mb-3" />
        <p>Awaiting live GPS telemetry stream from Railway WebSocket Server...</p>
      </div>
    );
  }

  // Active selected train or first train
  const activeTrain =
    liveTrains.find((t) => t.trainNumber === selectedTrainNumber) || liveTrains[0];

  const currentRoute = activeTrain.route || [];
  const currentLegIndex = activeTrain.currentLegIndex || 0;
  const currentStation = currentRoute[currentLegIndex] || currentRoute[0];
  const nextStation = currentRoute[currentLegIndex + 1] || currentRoute[currentRoute.length - 1];

  // Calculate overall total route progress
  const totalLegs = Math.max(1, currentRoute.length - 1);
  const totalProgress = Math.min(
    100,
    Math.round(
      ((currentLegIndex + (activeTrain.progressPercentage || 0) / 100) / totalLegs) * 100
    )
  );

  return (
    <div className="space-y-6">
      {/* Train Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2.5 pb-2 border-b border-slate-800">
        {liveTrains.map((train) => {
          const isSelected = train.trainNumber === activeTrain.trainNumber;
          return (
            <button
              key={train.trainNumber}
              onClick={() => onSelectTrain && onSelectTrain(train.trainNumber)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Train className={`w-4 h-4 ${isSelected ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
              <div className="text-left">
                <span className="block font-mono text-[11px] font-bold text-white">
                  {train.trainNumber}
                </span>
                <span className="block text-[10px] opacity-75">{train.trainName}</span>
              </div>
              <span
                className={`w-2 h-2 rounded-full ml-1 ${
                  train.delayMinutes > 0 ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Main Real-Time Telemetry Dashboard Card */}
      <div className="glass-panel-glow rounded-2xl p-6 relative overflow-hidden">
        {/* Card Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-mono font-bold">
                {activeTrain.trainNumber}
              </span>
              <h2 className="text-xl font-extrabold text-white">{activeTrain.trainName}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Origin: <strong className="text-slate-200">{currentRoute[0]?.name}</strong></span>
              <span>➔</span>
              <span>Terminus: <strong className="text-slate-200">{currentRoute[currentRoute.length - 1]?.name}</strong></span>
            </p>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">SPEED:</span>
              <span className="text-white font-bold">{activeTrain.speedKmH} km/h</span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                activeTrain.delayMinutes > 0
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {activeTrain.delayMinutes > 0 ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>DELAYED +{activeTrain.delayMinutes} MINS</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ON TIME (PLATFORM {activeTrain.platform || '1'})</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Route Track Graphic */}
        <div className="my-8 py-4">
          <div className="relative">
            {/* The Railway Track Background Bar */}
            <div className="h-3 w-full bg-slate-900 rounded-full border border-slate-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 transition-all duration-1000 ease-linear shadow-lg shadow-cyan-500/30"
                style={{ width: `${totalProgress}%` }}
              />
            </div>

            {/* Station nodes on track */}
            <div className="absolute -top-3 left-0 right-0 flex justify-between pointer-events-none">
              {currentRoute.map((stn, idx) => {
                const isPassed = idx <= currentLegIndex;
                const isCurrentLeg = idx === currentLegIndex;
                const isNext = idx === currentLegIndex + 1;

                return (
                  <div key={stn.name} className="flex flex-col items-center pointer-events-auto">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-300 ${
                        isPassed
                          ? 'bg-cyan-500 border-white text-slate-950 shadow-md shadow-cyan-500/50 scale-105'
                          : isNext
                          ? 'bg-slate-900 border-cyan-400 text-cyan-300 animate-pulse'
                          : 'bg-slate-950 border-slate-700 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-[11px] font-semibold mt-2 max-w-[90px] text-center leading-tight ${
                        isCurrentLeg || isNext ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {stn.name.split(' (')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {stn.km} km
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Leg Telemetry Card */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Station */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-400 block flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Last Departed Station
            </span>
            <p className="text-base font-bold text-white mt-1">{currentStation?.name}</p>
            <span className="text-xs text-emerald-400 font-mono block mt-1">
              Departed on Schedule
            </span>
          </div>

          {/* In-Transit Progress */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Inter-Station Leg
              </span>
              <span className="text-cyan-400 font-bold">{activeTrain.progressPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full my-2 overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-700"
                style={{ width: `${activeTrain.progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-300 font-mono flex items-center justify-between">
              <span>Telemetry:</span>
              <span className="text-slate-400 text-[10px]">
                {activeTrain.currentLat?.toFixed(3) || '26.449'}° N,{' '}
                {activeTrain.currentLng?.toFixed(3) || '80.331'}° E
              </span>
            </p>
          </div>

          {/* Next Approaching Station */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-400 block flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Next Destination Stop
            </span>
            <p className="text-base font-bold text-white mt-1">{nextStation?.name}</p>
            <span className="text-xs text-cyan-400 font-mono block mt-1">
              ETA: ~{Math.max(5, Math.round(25 * (1 - (activeTrain.progressPercentage || 0) / 100)))} mins
            </span>
          </div>
        </div>

        {/* Live Simulator Delay Trigger Box for Evaluator / Demo */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs text-slate-300 font-mono">
              Live Socket.io Feed: {isConnected ? 'Active (Tick: 3s)' : 'Reconnecting...'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Simulate Delay:
            </span>
            <select
              value={delayInput}
              onChange={(e) => setDelayInput(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="0">0m (On Time)</option>
              <option value="10">+10 mins</option>
              <option value="25">+25 mins</option>
              <option value="45">+45 mins</option>
            </select>
            <button
              onClick={() =>
                triggerDelaySimulation(
                  activeTrain.trainNumber,
                  delayInput,
                  Number(delayInput) > 0 ? 'DELAYED' : 'ON TIME'
                )
              }
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              Broadcast Delay via Socket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackerMap;
