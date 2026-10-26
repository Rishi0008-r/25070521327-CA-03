import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { playStationChime } from '../utils/audio';
import {
  Clock,
  Train,
  MapPin,
  Search,
  RefreshCw,
  Radio,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Volume2,
  Megaphone,
} from 'lucide-react';

const ScheduleBoard = () => {
  const navigate = useNavigate();
  const { socket, isConnected, triggerDelaySimulation } = useSocket();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdatedScheduleId, setLastUpdatedScheduleId] = useState(null);
  const [announcementText, setAnnouncementText] = useState(
    'Attention Passengers: Train 22436 Vande Bharat Express to Varanasi Jn is departing on schedule from Platform 1.'
  );

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trains/schedules');
      setSchedules(res.data);
    } catch (err) {
      console.error('Fetch schedules error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Real-time socket event updates
  useEffect(() => {
    if (!socket) return;

    const handleScheduleUpdate = (update) => {
      setSchedules((prev) =>
        prev.map((item) => {
          if (
            item._id === update.scheduleId ||
            item.train?.trainNumber === update.trainNumber
          ) {
            setLastUpdatedScheduleId(item._id);
            setTimeout(() => setLastUpdatedScheduleId(null), 3000);

            if (update.delayMinutes > 0) {
              setAnnouncementText(
                `May I have your attention please: Train ${item.train?.trainNumber} ${item.train?.name} is running ${update.delayMinutes} minutes behind schedule. Inconvenience is regretted.`
              );
            } else {
              setAnnouncementText(
                `Attention Passengers: Train ${item.train?.trainNumber} ${item.train?.name} is running on time on ${update.platform || 'Platform 1'}.`
              );
            }

            return {
              ...item,
              delayMinutes: update.delayMinutes !== undefined ? update.delayMinutes : item.delayMinutes,
              currentStatus: update.currentStatus || (update.delayMinutes > 0 ? 'DELAYED' : item.currentStatus),
              platform: update.platform || item.platform,
              availableSeatsCount:
                update.availableSeatsCount !== undefined
                  ? update.availableSeatsCount
                  : item.availableSeatsCount,
            };
          }
          return item;
        })
      );
    };

    socket.on('schedule_update', handleScheduleUpdate);

    return () => {
      socket.off('schedule_update', handleScheduleUpdate);
    };
  }, [socket]);

  const handlePlayAnnouncement = () => {
    playStationChime();
  };

  const filtered = schedules.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.train?.name?.toLowerCase().includes(term) ||
      s.train?.trainNumber?.includes(term) ||
      s.train?.source?.stationName?.toLowerCase().includes(term) ||
      s.train?.destination?.stationName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 py-6">
      {/* Live Station Public Address Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
            <Megaphone className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 block font-bold">
              Station Public Announcement (Live PA Feed)
            </span>
            <p className="text-xs sm:text-sm font-medium text-amber-100 mt-0.5">
              "{announcementText}"
            </p>
          </div>
        </div>

        <button
          onClick={handlePlayAnnouncement}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition shrink-0"
        >
          <Volume2 className="w-4 h-4" />
          <span>Play Station Chime</span>
        </button>
      </div>

      {/* Dynamic Schedule Board Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-cyan-400" />
              <span>Real-Time Railway Departure Board</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Live departure timings, track assignments, and seat inventory synchronized via Socket.io.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Socket Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span className={isConnected ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
              {isConnected ? 'LIVE FEED ACTIVE' : 'CONNECTING'}
            </span>
          </div>

          <button
            onClick={fetchSchedules}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Schedule Board"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search train name, number, or station..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <strong className="text-cyan-400">{filtered.length}</strong> active departures
        </div>
      </div>

      {/* Dynamic Departure Board Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Train</th>
                <th className="py-3.5 px-4">Origin / Terminus</th>
                <th className="py-3.5 px-4">Scheduled</th>
                <th className="py-3.5 px-4">Platform</th>
                <th className="py-3.5 px-4">Available Seats</th>
                <th className="py-3.5 px-4">Live Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin text-cyan-400 mb-2" />
                    Fetching real-time train departures...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No train schedules matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isRecentlyUpdated = lastUpdatedScheduleId === item._id;
                  const isDelayed = item.delayMinutes > 0;

                  return (
                    <tr
                      key={item._id}
                      className={`transition-colors duration-500 hover:bg-slate-800/40 ${
                        isRecentlyUpdated ? 'bg-cyan-950/50' : ''
                      }`}
                    >
                      {/* Train Number & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                            {item.train?.trainNumber}
                          </span>
                          <div>
                            <span className="font-bold text-white block">
                              {item.train?.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.train?.trainType}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-3.5 px-4 text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{item.train?.source?.stationName}</span>
                          <span className="text-cyan-400">➔</span>
                          <span>{item.train?.destination?.stationName}</span>
                        </div>
                      </td>

                      {/* Scheduled Departure */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                        {item.departureTime}
                      </td>

                      {/* Platform */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {item.platform || 'Platform 1'}
                      </td>

                      {/* Real-time Available Seats */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono font-bold text-xs px-2.5 py-1 rounded-md border ${
                            item.availableSeatsCount > 20
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                              : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                          }`}
                        >
                          {item.availableSeatsCount} Seats Left
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                            isDelayed
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isDelayed ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span>+{item.delayMinutes}m DELAY</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>ON TIME</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() =>
                            navigate(
                              `/book?from=${encodeURIComponent(
                                item.train?.source?.stationName
                              )}&to=${encodeURIComponent(item.train?.destination?.stationName)}`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white font-medium text-xs transition shadow-sm"
                        >
                          Book Seats
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluator Quick Demo Simulator Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>
            <strong>Academic Evaluator Tool:</strong> Push an instant real-time delay broadcast with station chime to all connected clients.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playStationChime();
              triggerDelaySimulation('22436', 15, 'DELAYED');
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-mono transition"
          >
            Delay Vande Bharat (+15m)
          </button>
          <button
            onClick={() => {
              playStationChime();
              triggerDelaySimulation('22436', 0, 'ON TIME');
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-mono transition"
          >
            Reset to On Time
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleBoard;
