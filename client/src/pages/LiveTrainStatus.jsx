import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import {
  Train,
  Clock,
  MapPin,
  Search,
  Gauge,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Radio,
  ArrowRight,
  Compass,
} from 'lucide-react';

const POPULAR_TRAINS = [
  { no: '22436', name: 'Vande Bharat Express' },
  { no: '12952', name: 'Mumbai Rajdhani' },
  { no: '15906', name: 'Vivek Express' },
  { no: '12841', name: 'Coromandel Express' },
  { no: '12002', name: 'Bhopal Shatabdi' },
];

const LiveTrainStatus = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTrain = searchParams.get('train') || '22436';
  const { liveTrains, isConnected } = useSocket();

  const [trainQuery, setTrainQuery] = useState(initialTrain);
  const [statusData, setStatusData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchLiveStatus = async (trainNo) => {
    const no = (trainNo || trainQuery).trim();
    if (!no) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get(`/trains/${no}/live-status`);
      setStatusData(res.data);
      setSearchParams({ train: no });
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || `Train #${no} live status currently unavailable`
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus(initialTrain);
  }, [initialTrain]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchLiveStatus();
  };

  // Find real-time socket crossing notice if available
  const socketTrain = liveTrains.find((t) => t.trainNumber === trainQuery);

  return (
    <div className="space-y-8 py-8 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Search Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm text-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Train className="w-7 h-7" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Spot Your Train: Live Running Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto font-medium">
          ConfirmTkt-style real-time station crossing tracking, delay alerts, and live GPS telemetry.
        </p>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="mt-6 max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={trainQuery}
            onChange={(e) => setTrainQuery(e.target.value)}
            placeholder="Enter Train Number (e.g. 22436, 12952, 15906)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Spot Train</span>
          </button>
        </form>

        {/* Quick Popular Trains */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="font-semibold">Popular Trains:</span>
          {POPULAR_TRAINS.map((t) => (
            <button
              key={t.no}
              type="button"
              onClick={() => {
                setTrainQuery(t.no);
                fetchLiveStatus(t.no);
              }}
              className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-mono text-xs font-bold border border-slate-200 transition"
            >
              {t.no} ({t.name})
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Status Content */}
      {statusData && (
        <div className="space-y-6">
          {/* Real-Time Live Crossing Banner */}
          <div className="bg-white p-6 rounded-3xl border border-indigo-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-mono font-black text-indigo-700 uppercase">
                  {statusData.trainNumber} - {statusData.trainName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {statusData.trainType}
                </span>
              </div>
              <p className="text-base font-extrabold text-slate-900 mt-1">
                {socketTrain?.crossingNotice || `Approaching ${statusData.nextStationName || 'Destination'} on schedule`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-mono font-black text-slate-800 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-indigo-600" />
                <span>{socketTrain?.speedKmH || statusData.currentSpeedKmH || 115} km/h</span>
              </div>

              <div
                className={`px-3.5 py-2 rounded-2xl text-xs font-mono font-black border ${
                  statusData.delayMinutes > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
              >
                {statusData.delayMinutes > 0 ? `+${statusData.delayMinutes}m DELAY` : 'RIGHT TIME'}
              </div>
            </div>
          </div>

          {/* ConfirmTkt Vertical Timeline */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>Station-by-Station Timetable & Live Crossing Tracker</span>
            </h3>

            <div className="relative border-l-2 border-slate-200 ml-4 sm:ml-6 space-y-8 pb-4">
              {statusData.timeline?.map((stn, idx) => {
                let dotClass = 'bg-white border-slate-300 text-slate-500';
                if (stn.isPassed) dotClass = 'bg-indigo-600 border-white text-white shadow-sm';
                else if (stn.isCurrent) dotClass = 'bg-emerald-500 border-white text-white ring-4 ring-emerald-200 animate-pulse';

                return (
                  <div key={idx} className="relative pl-6 sm:pl-8">
                    {/* Node Circle */}
                    <div
                      className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-black text-xs ${dotClass}`}
                    >
                      {stn.stopOrder || idx + 1}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-indigo-300 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{stn.stationName}</h4>
                          <span className="text-[11px] font-mono text-indigo-600 font-bold">
                            ({stn.stationCode})
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            PF {stn.platform || '1'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                          {stn.distanceKm} km from Origin • Halt: {stn.haltMinutes || 2}m
                        </span>
                      </div>

                      <div className="text-right font-mono text-xs">
                        <div className="text-slate-800 font-bold">
                          Arr: {stn.arrivalTime} | Dep: {stn.departureTime}
                        </div>
                        <span
                          className={`text-[11px] font-extrabold ${
                            stn.isCurrent && statusData.delayMinutes > 0
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {stn.statusText}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrainStatus;
