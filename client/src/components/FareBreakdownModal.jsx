import React from 'react';
import { X, Receipt } from 'lucide-react';

const FareBreakdownModal = ({ isOpen, onClose, train, selectedClass, quota = 'GN' }) => {
  if (!isOpen || !train || !selectedClass) return null;

  const baseFare = selectedClass.baseFare || 850;
  const reservationCharge = selectedClass.reservationCharge || 40;
  const superfastCharge = selectedClass.superfastCharge || 45;
  const tatkalCharge = quota === 'TQ' ? 300 : 0;
  const gst = Math.round((baseFare + tatkalCharge) * 0.05);
  const totalAmount = baseFare + reservationCharge + superfastCharge + tatkalCharge + gst;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">IRCTC Itemized Fare Breakdown</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {train.trainNumber} • Class {selectedClass.className} ({quota === 'TQ' ? 'Tatkal Quota' : 'General Quota'})
            </span>
          </div>
        </div>

        {/* Itemized Fare Rows */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>Base Fare</span>
            <span className="font-mono text-slate-900 dark:text-white font-bold">₹{baseFare}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>Reservation Charge (IRCTC)</span>
            <span className="font-mono text-slate-900 dark:text-white font-bold">₹{reservationCharge}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>Superfast Transit Surcharge</span>
            <span className="font-mono text-slate-900 dark:text-white font-bold">₹{superfastCharge}</span>
          </div>

          {tatkalCharge > 0 && (
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2 rounded-lg font-medium">
              <span>Tatkal Premium Charge</span>
              <span className="font-mono font-bold">₹{tatkalCharge}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>GST & Central Service Tax (5%)</span>
            <span className="font-mono text-slate-900 dark:text-white font-bold">₹{gst}</span>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-black text-sm">
            <span className="text-slate-900 dark:text-white">Total Payable Amount</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-mono text-base">₹{totalAmount}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
        >
          Got it, Close
        </button>
      </div>
    </div>
  );
};

export default FareBreakdownModal;
