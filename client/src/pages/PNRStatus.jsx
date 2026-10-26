import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import TicketCard from '../components/TicketCard';
import {
  Search,
  CheckCircle,
  Clock,
  Train,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  QrCode,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const PNRStatus = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPnr = searchParams.get('pnr') || '';

  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [ticketData, setTicketData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCheckPnr = async (pnrToCheck) => {
    const pnr = (pnrToCheck || pnrInput).trim();
    if (!pnr) return;

    setIsLoading(true);
    setErrorMessage('');
    setTicketData(null);

    try {
      const res = await api.get(`/bookings/pnr/${pnr}`);
      setTicketData(res.data);
      setSearchParams({ pnr });
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'No reservation record found for this 10-digit PNR'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialPnr) {
      handleCheckPnr(initialPnr);
    }
  }, [initialPnr]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCheckPnr();
  };

  return (
    <div className="space-y-8 py-8 max-w-4xl mx-auto px-4 sm:px-6">
      {/* PNR Header Hero */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm text-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <QrCode className="w-7 h-7" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Live PNR Status & Confirmation Prediction
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto font-medium">
          ConfirmTkt-powered status prediction, chart preparation updates, and real-time coach/berth allocation for Indian Railways passengers.
        </p>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="mt-6 max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            maxLength="10"
            value={pnrInput}
            onChange={(e) => setPnrInput(e.target.value)}
            placeholder="Enter 10-digit PNR Number (e.g. 8492048172)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Check PNR</span>
          </button>
        </form>

        {/* Quick Demo PNR Autofill */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="font-semibold">Seeded Demo PNR:</span>
          <button
            type="button"
            onClick={() => {
              setPnrInput('8492048172');
              handleCheckPnr('8492048172');
            }}
            className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-xs font-bold border border-indigo-200 transition"
          >
            8492048172 (Vande Bharat Express)
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 max-w-xl mx-auto">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Result Container */}
      {ticketData && (
        <div className="space-y-6">
          {/* Prediction & Charting Status Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Confirmation Probability */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Confirmation Chance
                </span>
                <span className="text-xl font-black text-emerald-700 font-mono">
                  {ticketData.confirmationProbability || 100}% Confirmed
                </span>
                <span className="text-[11px] text-slate-500 block font-medium">Guaranteed Travel</span>
              </div>
            </div>

            {/* Charting Status */}
            <div className="flex items-center gap-3.5 md:border-x border-slate-100 md:px-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Chart Status
                </span>
                <span className="text-sm font-black text-amber-800 font-mono block">
                  {ticketData.chartStatus || 'Chart Not Prepared'}
                </span>
                <span className="text-[11px] text-slate-500 block font-medium">Prepared 4h prior</span>
              </div>
            </div>

            {/* Quota & Class */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Class & Quota
                </span>
                <span className="text-sm font-black text-slate-900 font-mono block">
                  Class {ticketData.selectedClass || 'CC'} ({ticketData.quota === 'TQ' ? 'Tatkal' : 'General'})
                </span>
                <span className="text-[11px] text-indigo-600 block font-semibold">Indian Railways Standard</span>
              </div>
            </div>
          </div>

          {/* Detailed Boarding Pass Card */}
          <TicketCard booking={ticketData} />
        </div>
      )}
    </div>
  );
};

export default PNRStatus;
