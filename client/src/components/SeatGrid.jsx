import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { CheckCircle2, ShieldAlert, Filter, Train } from 'lucide-react';

const SeatGrid = ({ schedule, selectedSeats, onSeatToggle }) => {
  const { socket } = useSocket();
  const [activeCoachIndex, setActiveCoachIndex] = useState(0);
  const [coachesData, setCoachesData] = useState([]);
  const [recentBookedSeat, setRecentBookedSeat] = useState(null);
  const [berthFilter, setBerthFilter] = useState('ALL'); // 'ALL' | 'WINDOW' | 'AISLE'

  useEffect(() => {
    if (schedule && schedule.coaches) {
      setCoachesData(schedule.coaches);
    }
  }, [schedule]);

  // Listen for real-time seat booking updates from other users via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleSeatBooked = (data) => {
      if (data.scheduleId === schedule?._id) {
        setCoachesData((prevCoaches) =>
          prevCoaches.map((coach) => {
            const updatedSeats = coach.seats.map((seat) => {
              const wasBooked = data.bookedSeats.some(
                (bs) => bs.coachNumber === coach.coachNumber && bs.seatNumber === seat.seatNumber
              );
              if (wasBooked) {
                return { ...seat, isBooked: true };
              }
              return seat;
            });
            return { ...coach, seats: updatedSeats };
          })
        );

        if (data.bookedSeats?.length > 0) {
          setRecentBookedSeat(data.bookedSeats[0].seatNumber);
          setTimeout(() => setRecentBookedSeat(null), 4000);
        }
      }
    };

    const handleSeatReleased = (data) => {
      if (data.scheduleId === schedule?._id) {
        setCoachesData((prevCoaches) =>
          prevCoaches.map((coach) => {
            const updatedSeats = coach.seats.map((seat) => {
              const wasReleased = data.releasedSeats.some(
                (rs) => rs.coachNumber === coach.coachNumber && rs.seatNumber === seat.seatNumber
              );
              if (wasReleased) {
                return { ...seat, isBooked: false };
              }
              return seat;
            });
            return { ...coach, seats: updatedSeats };
          })
        );
      }
    };

    socket.on('seat_booked', handleSeatBooked);
    socket.on('seat_released', handleSeatReleased);

    return () => {
      socket.off('seat_booked', handleSeatBooked);
      socket.off('seat_released', handleSeatReleased);
    };
  }, [socket, schedule]);

  if (!coachesData || coachesData.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        Loading coach layout...
      </div>
    );
  }

  const currentCoach = coachesData[activeCoachIndex] || coachesData[0];
  const seats = currentCoach?.seats || [];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
      {/* Live Booking Socket Flash Banner */}
      {recentBookedSeat && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              Real-Time Notice: Seat <strong className="font-mono">{recentBookedSeat}</strong> was just locked across the network.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">Live Sync</span>
        </div>
      )}

      {/* Coach Tabs Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <span>Coach Visualizer</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 font-mono font-bold border border-indigo-200 dark:border-indigo-800">
              Coach {currentCoach.coachNumber} ({currentCoach.coachType})
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Click available seats to select. Availability is dynamically synced via Socket.io.
          </p>
        </div>

        {/* Coach Selector Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto max-w-full">
          {coachesData.map((coach, idx) => {
            const availCount = coach.seats.filter((s) => !s.isBooked).length;
            const isCurrent = activeCoachIndex === idx;
            return (
              <button
                key={coach.coachNumber}
                type="button"
                onClick={() => setActiveCoachIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                Coach {coach.coachNumber} ({availCount} Left)
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Berth Filter & Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Berth Preferences */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] px-2 flex items-center gap-1 font-bold">
            <Filter className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            Filter Berths:
          </span>
          {['ALL', 'WINDOW', 'AISLE'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setBerthFilter(type)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                berthFilter === type
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {type === 'ALL' ? 'All Berths' : type === 'WINDOW' ? '🪟 Window Side' : '🚶 Aisle Side'}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 font-semibold text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-xs" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-md bg-indigo-600 shadow-xs" />
            <span className="text-indigo-700 dark:text-indigo-400 font-bold">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-md bg-slate-200 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 opacity-60" />
            <span className="text-slate-400 dark:text-slate-500">Booked</span>
          </div>
        </div>
      </div>

      {/* Visual Train Coach Interior */}
      <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center gap-1">🪟 Window Side (Row A)</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">➔ Engine Direction / Front</span>
          <span className="flex items-center gap-1">🪟 Window Side (Row B)</span>
        </div>

        {/* Seat Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 sm:gap-3 justify-items-center">
          {seats.map((seat) => {
            const isSelected = selectedSeats.some(
              (s) => s.coachNumber === currentCoach.coachNumber && s.seatNumber === seat.seatNumber
            );

            const matchesFilter =
              berthFilter === 'ALL' || seat.seatType.toUpperCase() === berthFilter;

            let seatClass = 'bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-800 dark:text-white shadow-xs';
            if (seat.isBooked) {
              seatClass = 'bg-slate-200 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50';
            } else if (isSelected) {
              seatClass = 'bg-indigo-600 border-indigo-700 text-white font-black scale-105 shadow-md shadow-indigo-600/30';
            } else if (!matchesFilter) {
              seatClass = 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-40 hover:opacity-80';
            }

            return (
              <button
                key={seat.seatNumber}
                type="button"
                disabled={seat.isBooked}
                onClick={() =>
                  onSeatToggle({
                    coachNumber: currentCoach.coachNumber,
                    coachType: currentCoach.coachType,
                    seatNumber: seat.seatNumber,
                    seatType: seat.seatType,
                    fare: seat.fare,
                  })
                }
                title={`Seat: ${seat.seatNumber} (${seat.seatType}) - ₹${seat.fare}`}
                className={`relative flex flex-col items-center justify-center w-11 h-12 rounded-xl border text-xs transition duration-150 ${seatClass}`}
              >
                <span className="font-mono text-[11px] font-bold">{seat.seatNumber.split('-')[1]}</span>
                <span className="text-[9px] font-bold opacity-75">
                  {seat.seatType === 'WINDOW' ? 'WIN' : seat.seatType === 'AISLE' ? 'AIS' : 'MID'}
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white absolute -top-1 -right-1 fill-indigo-800" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-700 text-center text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
          Vestibule & Restroom Exit 🚪 Coach {currentCoach.coachNumber}
        </div>
      </div>

      {/* Selected Seats summary strip */}
      {selectedSeats.length > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-indigo-900 dark:text-indigo-200 font-bold">Selected Seats ({selectedSeats.length}):</span>
            {selectedSeats.map((s) => (
              <span
                key={`${s.coachNumber}-${s.seatNumber}`}
                className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono font-black"
              >
                {s.seatNumber} ({s.seatType})
              </span>
            ))}
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal: </span>
            <span className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
              ₹{selectedSeats.reduce((acc, curr) => acc + (curr.fare || 0), 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatGrid;
