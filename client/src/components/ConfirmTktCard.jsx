import React, { useState } from 'react';
import {
  Train,
  Clock,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Utensils,
  ChevronRight,
  MapPin,
  X,
  Check,
  Lock,
} from 'lucide-react';
import FareBreakdownModal from './FareBreakdownModal';
import { useAuth } from '../context/AuthContext';

const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ConfirmTktCard = ({ schedule, onSelectSeats, onBookNow, quota = 'GN', isSelected = false }) => {
  const { isAuthenticated } = useAuth();
  const train = schedule.train || {};
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);
  const [showFareModal, setShowFareModal] = useState(false);
  const [showStopsModal, setShowStopsModal] = useState(false);

  const classAvailabilities = schedule.classAvailability || [];
  const currentClass = classAvailabilities[selectedClassIndex] || classAvailabilities[0] || {};

  const daysOfRun = train.daysOfRun || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleClassClick = (idx, e) => {
    if (e) e.stopPropagation();
    setSelectedClassIndex(idx);
    const chosenClass = classAvailabilities[idx];
    if (onBookNow && chosenClass) {
      onBookNow(schedule, chosenClass);
    } else if (onSelectSeats && chosenClass) {
      onSelectSeats(schedule, chosenClass);
    }
  };

  const handleCardClick = (e) => {
    // If user clicked inside an existing button, anchor, or modal, let that action proceed
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="dialog"]')) {
      return;
    }
    if (onSelectSeats) onSelectSeats(schedule, currentClass);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`rounded-3xl p-5 sm:p-6 transition-all duration-200 space-y-4 cursor-pointer select-none ${
          isSelected
            ? 'bg-white dark:bg-[#111827] border-2 border-indigo-600 dark:border-indigo-500 ring-4 ring-indigo-500/20 shadow-xl shadow-indigo-500/10'
            : 'bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1F293D] hover:border-indigo-500/40 shadow-sm hover:shadow-lg'
        }`}
      >
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-black">
              {train.trainNumber}
            </span>
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
              {train.name}
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {train.trainType}
            </span>

            {isSelected && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black tracking-wide flex items-center gap-1 shadow-xs animate-pulse">
                <Check className="w-3 h-3" /> SELECTED TRAIN
              </span>
            )}
          </div>

          {/* Running Days of Week Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <span className="text-slate-400 dark:text-slate-500 hidden md:inline mr-1">Runs on:</span>
              {DAYS_ORDER.map((day) => {
                const runs = daysOfRun.includes(day);
                return (
                  <span
                    key={day}
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-bold ${
                      runs
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {day[0]}
                  </span>
                );
              })}
            </div>

            {train.pantryCar && (
              <span
                className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium"
                title="Pantry Car Available"
              >
                <Utensils className="w-3.5 h-3.5 text-amber-500" />
                <span>Pantry</span>
              </span>
            )}
          </div>
        </div>

        {/* Route, Timing & Duration Row */}
        <div className="grid grid-cols-12 gap-3 items-center py-2">
          {/* Departure */}
          <div className="col-span-4">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block">
              {schedule.departureTime || train.departureTime}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
              {train.source?.stationName}
            </span>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {train.source?.stationCode}
            </span>
          </div>

          {/* Middle Duration Bar */}
          <div className="col-span-4 text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
              {train.durationHours || '8h 00m'}
            </span>
            <div className="relative flex items-center justify-center my-2">
              <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="absolute px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold">
                {train.intermediateStations?.length || 2} Halts
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowStopsModal(true)}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold hover:underline"
            >
              View Route Stops
            </button>
          </div>

          {/* Arrival */}
          <div className="col-span-4 text-right">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block">
              {schedule.arrivalTime || train.arrivalTime}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
              {train.destination?.stationName}
            </span>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {train.destination?.stationCode}
            </span>
          </div>
        </div>

        {/* Horizontal Scrollable Class Availability Chips (ConfirmTkt Style) */}
        <div className="pt-2">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {classAvailabilities.map((cls, idx) => {
              const isClassSelected = selectedClassIndex === idx;

              let badgeColor = 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
              let statusLabel = `AVAILABLE ${cls.availableCount}`;

              if (cls.status === 'RAC') {
                badgeColor = 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
                statusLabel = `RAC ${cls.racCount || 4}`;
              } else if (cls.status === 'WL') {
                badgeColor = 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800';
                statusLabel = `WL ${cls.wlCount || 12}`;
              }

              // Color-coded ConfirmTkt / Ixigo Smart Waitlist Probability (Green / Yellow / Red)
              const prob = Number(cls.probability) || (cls.status === 'AVAILABLE' ? 100 : cls.status === 'RAC' ? 88 : 45);
              let probBadgeStyle = 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800';
              let probProgressColor = 'bg-emerald-500';
              let probLabel = 'High Chance';

              if (prob < 50) {
                probBadgeStyle = 'text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800';
                probProgressColor = 'bg-rose-500';
                probLabel = 'Low Chance';
              } else if (prob < 75) {
                probBadgeStyle = 'text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800';
                probProgressColor = 'bg-amber-500';
                probLabel = 'Medium Chance';
              }

              return (
                <div
                  key={cls.className}
                  onClick={(e) => handleClassClick(idx, e)}
                  title={cls.predictionReason || `${prob}% historical confirmation probability`}
                  className={`min-w-[165px] p-3 rounded-2xl border cursor-pointer transition select-none ${
                    isClassSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/80 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/30 shadow-md shadow-indigo-600/15 scale-[1.03]'
                      : 'bg-slate-50/80 dark:bg-[#151D30] border-slate-200 dark:border-[#1F293D] hover:border-indigo-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black mb-1.5">
                    <span className="text-slate-900 dark:text-white font-mono text-sm">{cls.className}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono font-black text-sm">
                      ₹{cls.totalFare}
                    </span>
                  </div>

                  <span
                    className={`block text-[11px] font-mono font-black px-2 py-0.5 rounded-lg border text-center ${badgeColor}`}
                  >
                    {statusLabel}
                  </span>

                  {/* Smart Waitlist Probability Meter (ConfirmTkt / Ixigo) */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-500 dark:text-slate-400">{probLabel}</span>
                      <span className={`px-1.5 py-0.2 rounded border text-[10px] font-black ${probBadgeStyle}`}>
                        {prob}%
                      </span>
                    </div>

                    {/* Miniature Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${probProgressColor} transition-all duration-500`}
                        style={{ width: `${prob}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Footer: Fare link + Action Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3.5 border-t border-slate-100 dark:border-[#1F293D] text-xs">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowFareModal(true)}
              className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold hover:underline"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Fare Breakdown (₹{currentClass.totalFare})</span>
            </button>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Quota: <strong className="text-slate-800 dark:text-slate-200">{quota === 'TQ' ? 'Tatkal' : 'General'}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onBookNow) {
                onBookNow(schedule, currentClass);
              } else if (onSelectSeats) {
                onSelectSeats(schedule, currentClass);
              }
            }}
            className={`w-full sm:w-auto px-7 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 ${
              isAuthenticated
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30'
                : 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/30 text-slate-950 font-black'
            }`}
          >
            {isAuthenticated ? (
              <>
                <span>Book {currentClass.className} Now</span>
                <span className="font-mono bg-white/20 px-2 py-0.5 rounded-md text-xs font-bold">₹{currentClass.totalFare}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Login to Book {currentClass.className}</span>
                <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md text-xs font-bold">₹{currentClass.totalFare}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fare Breakdown Modal */}
      <FareBreakdownModal
        isOpen={showFareModal}
        onClose={() => setShowFareModal(false)}
        train={train}
        selectedClass={currentClass}
        quota={quota}
      />

      {/* Intermediate Stops Modal */}
      {showStopsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Route Corridor & Station Halts
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  #{train.trainNumber} • {train.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowStopsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 text-xs font-semibold">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{train.source?.stationName} (Origin)</span>
                  <span className="block text-[11px] font-mono text-indigo-600 dark:text-indigo-400">{train.source?.stationCode}</span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{train.departureTime}</span>
                  <span className="block text-[10px] text-slate-400">Departs</span>
                </div>
              </div>

              {train.intermediateStations?.map((stn, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs border border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{stn.stationName}</span>
                    <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {stn.stationCode} • Plat {stn.platform || '1'} • {stn.distanceKm || 150} km
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{stn.arrivalTime}</span>
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                      {stn.haltMinutes || 2}m Halt
                    </span>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 text-xs font-semibold">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{train.destination?.stationName} (Terminal)</span>
                  <span className="block text-[11px] font-mono text-indigo-600 dark:text-indigo-400">{train.destination?.stationCode}</span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{train.arrivalTime}</span>
                  <span className="block text-[10px] text-slate-400">Terminates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConfirmTktCard;
