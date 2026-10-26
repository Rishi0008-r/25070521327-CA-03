import React from 'react';
import {
  GitMerge,
  ArrowRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';

const SplitTicketCard = ({ splitRoute, onSelectSplitRoute }) => {
  if (!splitRoute) return null;

  const {
    id,
    type,
    title,
    subtitle,
    transferStation,
    leg1,
    leg2,
    totalFare,
    totalDuration,
    jugaadSavingsText,
  } = splitRoute;

  const isSameTrain = type === 'SAME_TRAIN_SPLIT';

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 dark:from-amber-950/30 dark:via-indigo-950/30 dark:to-emerald-950/30 rounded-3xl p-5 sm:p-6 border-2 border-indigo-500/30 dark:border-indigo-600/40 shadow-lg space-y-4 relative overflow-hidden transition-all hover:border-indigo-500">
      {/* Top Banner Tag */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-indigo-200/50 dark:border-indigo-800/50">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ixigo Jugaad™ Split Ticket</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wide flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Confirmed Berth</span>
          </span>
        </div>

        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {isSameTrain ? 'Seat-Hop on Same Train' : 'Seamless Junction Connection'}
        </span>
      </div>

      {/* Main Title & Concept description */}
      <div>
        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          {subtitle || jugaadSavingsText}
        </p>
      </div>

      {/* Two-Leg Route Visual Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center py-2 bg-white/70 dark:bg-slate-900/70 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs">
        {/* LEG 1 */}
        <div className="md:col-span-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>LEG 1: {leg1.trainNumber}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">
              {leg1.assignedSeat || 'CNF'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-base font-black text-slate-900 dark:text-white block">
                {leg1.departureTime}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                {leg1.from}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="text-right">
              <span className="font-mono text-base font-black text-slate-900 dark:text-white block">
                {leg1.arrivalTime}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                {leg1.to}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 block">
            Class {leg1.className} • ₹{leg1.fare}
          </span>
        </div>

        {/* TRANSFER JUNCTION CONNECTOR */}
        <div className="md:col-span-1 flex flex-col items-center justify-center text-center my-1 md:my-0">
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
            <GitMerge className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
            {isSameTrain ? 'Seat Change' : `${transferStation.layoverMinutes || 45}m Layover`}
          </span>
        </div>

        {/* LEG 2 */}
        <div className="md:col-span-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>LEG 2: {leg2.trainNumber}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">
              {leg2.assignedSeat || 'CNF'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-base font-black text-slate-900 dark:text-white block">
                {leg2.departureTime}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                {leg2.from}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="text-right">
              <span className="font-mono text-base font-black text-slate-900 dark:text-white block">
                {leg2.arrivalTime}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                {leg2.to}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 block">
            Class {leg2.className} • ₹{leg2.fare}
          </span>
        </div>
      </div>

      {/* Footer CTA & Fare */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 font-medium">Combined Split Fare:</span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
            <span>₹{totalFare}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
              Guaranteed CNF
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectSplitRoute(splitRoute)}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
        >
          <span>Book Confirmed Split Route</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SplitTicketCard;
