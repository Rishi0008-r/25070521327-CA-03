import React, { useState } from 'react';
import {
  Train,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  User,
  Plus,
  Trash2,
  X,
  CreditCard,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const BookingModal = ({
  isOpen,
  onClose,
  schedule,
  selectedClass,
  quota = 'GN',
  travelDate,
  onConfirmBooking,
  isProcessing = false,
  error = '',
}) => {
  if (!isOpen || !schedule) return null;

  const train = schedule.train || {};
  const currentClass = selectedClass || schedule.classAvailability?.[0] || { className: '3A', totalFare: 850 };
  const trainNumber = train.trainNumber || schedule.trainNumber || '12000';
  const trainName = train.name || schedule.trainName || 'Express';
  const sourceName = train.source?.stationName || schedule.source?.stationName || 'Origin';
  const sourceCode = train.source?.stationCode || schedule.source?.stationCode || 'SRC';
  const destName = train.destination?.stationName || schedule.destination?.stationName || 'Destination';
  const destCode = train.destination?.stationCode || schedule.destination?.stationCode || 'DST';

  const [passengers, setPassengers] = useState([
    {
      name: 'Rushi Sharma',
      age: '26',
      gender: 'Male',
      berthPreference: 'LOWER',
    },
  ]);

  const handleAddPassenger = () => {
    if (passengers.length >= 6) return;
    setPassengers([
      ...passengers,
      {
        name: '',
        age: '',
        gender: 'Male',
        berthPreference: 'NO_PREF',
      },
    ]);
  };

  const handleRemovePassenger = (idx) => {
    if (passengers.length === 1) return;
    setPassengers(passengers.filter((_, i) => i !== idx));
  };

  const handlePassengerChange = (idx, field, val) => {
    const updated = [...passengers];
    updated[idx][field] = val;
    setPassengers(updated);
  };

  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name || p.name.trim().length < 2) {
        setFormError(`Please enter a valid name for Passenger #${i + 1}`);
        return;
      }
      if (!p.age || Number(p.age) < 1 || Number(p.age) > 120) {
        setFormError(`Please enter a valid age for Passenger #${i + 1}`);
        return;
      }
    }

    onConfirmBooking({
      passengers,
      selectedClass: currentClass.className,
      quota,
      travelDate,
    });
  };

  const unitFare = currentClass.totalFare || 850;
  const totalBase = unitFare * passengers.length;
  const gst = Math.round(totalBase * 0.05);
  const grandTotal = totalBase + gst;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0B0E17] border border-[#1F293D] rounded-3xl shadow-2xl text-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950/80 via-[#111827] to-[#151D30] border-b border-[#1F293D] p-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono text-xs font-black">
                {trainNumber}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Class {currentClass.className}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Quota: <strong className="text-white">{quota === 'TQ' ? 'Tatkal' : 'General'}</strong>
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {trainName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-indigo-400">{sourceName} ({sourceCode})</span>
              <span>➔</span>
              <span className="text-indigo-400">{destName} ({destCode})</span>
              <span>•</span>
              <span className="text-slate-300 font-bold">{travelDate}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Passenger Details Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-white text-base">
                  Passenger Details ({passengers.length}/6)
                </h3>
              </div>

              {passengers.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddPassenger}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Passenger</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {passengers.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-[#111827] border border-[#1F293D] rounded-2xl p-4 space-y-3 transition-colors hover:border-slate-700"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 pb-2 border-b border-[#1F293D]">
                    <span className="flex items-center gap-1 text-indigo-400">
                      <User className="w-3.5 h-3.5" />
                      Passenger #{idx + 1}
                    </span>

                    {passengers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePassenger(idx)}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Name */}
                    <div className="sm:col-span-5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Full Name (as per Govt ID)
                      </label>
                      <input
                        type="text"
                        required
                        value={p.name}
                        onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Rushi Sharma"
                        className="w-full bg-[#0B0E17] border border-[#1F293D] rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Age */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        required
                        value={p.age}
                        onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                        placeholder="Age"
                        className="w-full bg-[#0B0E17] border border-[#1F293D] rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Gender */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Gender
                      </label>
                      <select
                        value={p.gender}
                        onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                        className="w-full bg-[#0B0E17] border border-[#1F293D] rounded-xl px-2 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Berth Preference */}
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Berth Preference
                      </label>
                      <select
                        value={p.berthPreference}
                        onChange={(e) => handlePassengerChange(idx, 'berthPreference', e.target.value)}
                        className="w-full bg-[#0B0E17] border border-[#1F293D] rounded-xl px-2 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="NO_PREF">No Preference</option>
                        <option value="LOWER">Lower Berth</option>
                        <option value="MIDDLE">Middle Berth</option>
                        <option value="UPPER">Upper Berth</option>
                        <option value="SIDE LOWER">Side Lower</option>
                        <option value="SIDE UPPER">Side Upper</option>
                        <option value="WINDOW">Window Seat</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(formError || error) && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError || error}</span>
            </div>
          )}

          {/* Fare Summary & CTA */}
          <div className="bg-[#111827] border border-[#1F293D] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs text-slate-400 font-medium">
                {passengers.length} Passenger{passengers.length > 1 ? 's' : ''} × ₹{unitFare} + 5% GST
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                ₹{grandTotal}{' '}
                <span className="text-xs font-normal text-slate-400">Total Payable</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Reserving Ticket...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
