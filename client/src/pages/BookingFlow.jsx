import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useAudio } from '../context/AudioContext';
import StationAutocomplete from '../components/StationAutocomplete';
import ConfirmTktCard from '../components/ConfirmTktCard';
import SeatGrid from '../components/SeatGrid';
import TicketCard from '../components/TicketCard';
import PremiumCheckoutModal from '../components/PremiumCheckoutModal';
import BookingModal from '../components/BookingModal';
import {
  Search,
  Train,
  ArrowRightLeft,
  Calendar,
  Filter,
  ArrowUpDown,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Clock,
  ArrowRight,
  CheckCircle2,
  X,
  ChevronDown,
  GitMerge,
  Lock,
} from 'lucide-react';

const BookingFlow = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { socket } = useSocket();
  const { playClick, playSwoosh, playSuccessChime } = useAudio();

  // Search Engine Modes: 'route' (From -> To) | 'train' (Direct Train Number/Name)
  const [searchMode, setSearchMode] = useState(searchParams.get('mode') || 'route');

  // Route Parameters
  const [from, setFrom] = useState(searchParams.get('from') || 'New Delhi (NDLS)');
  const [to, setTo] = useState(searchParams.get('to') || 'Varanasi Junction (BSB)');
  const [trainQuery, setTrainQuery] = useState(searchParams.get('trainQuery') || '');
  const [date, setDate] = useState(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  );
  const [quota, setQuota] = useState(searchParams.get('quota') || 'GN'); // 'GN' | 'TQ' | 'LD' | 'SS'

  // Filters & Sorting State
  const [classFilter, setClassFilter] = useState('ALL'); // 'ALL' | 'SL' | '3A' | '2A' | '1A' | 'CC'
  const [sortBy, setSortBy] = useState('departure'); // 'departure' | 'duration' | 'price'
  const [isSwapping, setIsSwapping] = useState(false);

  // Search Results
  const [schedules, setSchedules] = useState([]);
  const [splitRoutes, setSplitRoutes] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected schedule and seat layout
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedClassData, setSelectedClassData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengers, setPassengers] = useState([]);

  // MakeMyTrip Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Booking result
  const [isBooking, setIsBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Direct Quick Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [modalSchedule, setModalSchedule] = useState(null);
  const [modalClass, setModalClass] = useState(null);

  const handleBookNowModal = (schedule, chosenClass) => {
    playClick();
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search) + '&msg=login_required');
      return;
    }
    setModalSchedule(schedule);
    setModalClass(chosenClass);
    setIsBookingModalOpen(true);
  };

  const handleDirectConfirmBooking = async (bookingData) => {
    if (!isAuthenticated) {
      setIsBookingModalOpen(false);
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search) + '&msg=login_required');
      return;
    }
    setIsBooking(true);
    setBookingError('');
    try {
      const payload = {
        scheduleId: modalSchedule._id,
        passengers: bookingData.passengers,
        selectedClass: bookingData.selectedClass || '3A',
        quota: bookingData.quota || quota,
        travelDate: date,
        source: from,
        destination: to,
        paymentMethod: 'UPI Instant Pay',
      };

      const res = await api.post('/bookings', payload);
      setIsBookingModalOpen(false);
      setConfirmedBooking(res.data.booking);
      playSuccessChime();
    } catch (err) {
      setBookingError(
        err.response?.data?.message || 'Booking reservation failed. Please check rules.'
      );
    } finally {
      setIsBooking(false);
    }
  };

  // Swap Stations button handler
  const handleSwapStations = () => {
    playSwoosh();
    setIsSwapping(true);
    const temp = from;
    setFrom(to);
    setTo(temp);
    setTimeout(() => setIsSwapping(false), 300);
  };

  // Quick date pickers
  const setQuickDate = (offsetDays) => {
    playClick();
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(d.toISOString().split('T')[0]);
  };

  // Execute Dual-Search
  const executeSearch = async () => {
    setIsSearching(true);
    setSelectedSchedule(null);
    setSelectedSeats([]);
    setPassengers([]);

    try {
      let url = '/trains/search?';
      if (searchMode === 'train') {
        url += `trainQuery=${encodeURIComponent(trainQuery)}&date=${date}&classType=${classFilter}&sortBy=${sortBy}`;
      } else {
        url += `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&classType=${classFilter}&sortBy=${sortBy}&quota=${quota}`;
      }

      const res = await api.get(url);
      setSchedules(res.data.schedules || []);
      setSplitRoutes([]); // Strictly direct trains only
    } catch (err) {
      console.error('Search error:', err);
      setSchedules([]);
      setSplitRoutes([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [searchMode, classFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    playClick();
    executeSearch();
  };

  // Select train class and open seat selector
  const handleSelectClass = async (schedule, classInfo) => {
    playClick();
    setSelectedClassData(classInfo);
    setSelectedSeats([]);
    setPassengers([]);
    setBookingError('');

    try {
      const res = await api.get(`/trains/schedule/${schedule._id}`);
      setSelectedSchedule(res.data);
      if (socket) {
        socket.emit('join_schedule', schedule._id);
      }
    } catch (err) {
      console.error('Error fetching schedule details:', err);
      setSelectedSchedule(schedule);
    }

    // Smooth scroll down to seat selection
    setTimeout(() => {
      const el = document.getElementById('coach-seat-selector');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Toggle seat selection
  const handleSeatToggle = (seatInfo) => {
    playClick();
    const alreadySelected = selectedSeats.some(
      (s) => s.coachNumber === seatInfo.coachNumber && s.seatNumber === seatInfo.seatNumber
    );

    if (alreadySelected) {
      setSelectedSeats((prev) =>
        prev.filter(
          (s) => !(s.coachNumber === seatInfo.coachNumber && s.seatNumber === seatInfo.seatNumber)
        )
      );
      setPassengers((prev) =>
        prev.filter((p) => p.seatNumber !== seatInfo.seatNumber)
      );
    } else {
      if (selectedSeats.length >= 6) {
        setBookingError('Maximum 6 passenger tickets can be reserved per IRCTC booking transaction.');
        return;
      }
      setBookingError('');
      setSelectedSeats((prev) => [...prev, seatInfo]);

      const fare = selectedClassData?.totalFare || seatInfo.fare || 850;
      setPassengers((prev) => [
        ...prev,
        {
          name: '',
          age: '',
          gender: 'Male',
          coachNumber: seatInfo.coachNumber,
          seatNumber: seatInfo.seatNumber,
          berthPreference: seatInfo.seatType || 'LOWER',
          fare,
        },
      ]);
    }
  };

  // Passenger form input update
  const handlePassengerChange = (index, field, value) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // Open MakeMyTrip Premium Checkout Modal
  const handleOpenCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search) + '&msg=login_required');
      return;
    }

    if (passengers.length === 0) {
      setBookingError('Please select at least one seat from the coach layout.');
      return;
    }

    for (const p of passengers) {
      if (!p.name || p.name.trim() === '') {
        setBookingError('Please enter full passenger name for all allocated berths.');
        return;
      }
      if (!p.age || Number(p.age) <= 0) {
        setBookingError('Please enter a valid age for all passengers.');
        return;
      }
    }

    setBookingError('');
    setShowCheckoutModal(true);
  };

  // Execute Final Authorized Payment through MakeMyTrip Gateway
  const handleProcessPayment = async (checkoutData) => {
    if (!isAuthenticated) {
      setShowCheckoutModal(false);
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search) + '&msg=login_required');
      return;
    }
    setIsBooking(true);
    setBookingError('');

    try {
      const payload = {
        scheduleId: selectedSchedule._id,
        passengers,
        selectedClass: selectedClassData?.className || '3A',
        quota,
        travelDate: date,
        source: from,
        destination: to,
        paymentMethod: checkoutData.paymentMethod || 'Mock UPI / NetBanking',
        addOns: checkoutData.addOns,
        bypassTatkalTimeLock: checkoutData.bypassTatkalTimeLock,
      };

      const res = await api.post('/bookings', payload);
      setShowCheckoutModal(false);
      setConfirmedBooking(res.data.booking);
      playSuccessChime();
    } catch (err) {
      setBookingError(
        err.response?.data?.message || 'Booking reservation failed. Please check rules.'
      );
    } finally {
      setIsBooking(false);
    }
  };

  const totalFare = selectedSeats.reduce((acc, curr) => acc + (curr.fare || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Clean Consumer Search Header Card */}
      <div className="bg-white dark:bg-[#111827] p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-[#1F293D] shadow-xl relative transition-colors duration-200">
        {/* Search Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-[#1F293D] mb-6">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0B0E17] p-1.5 rounded-2xl text-xs font-bold border border-transparent dark:border-[#1F293D]">
            <button
              type="button"
              onClick={() => {
                playClick();
                setSearchMode('route');
              }}
              className={`px-4 py-2 rounded-xl transition ${
                searchMode === 'route'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Route Search (From → To)
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                setSearchMode('train');
              }}
              className={`px-4 py-2 rounded-xl transition ${
                searchMode === 'train'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Direct Train (No. or Name)
            </button>
          </div>

          {/* Quota Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0B0E17] p-1 rounded-xl text-xs font-bold border border-transparent dark:border-[#1F293D]">
            <span className="text-slate-500 dark:text-slate-400 px-2">Quota:</span>
            {[
              { id: 'GN', label: 'General' },
              { id: 'TQ', label: 'Tatkal' },
              { id: 'LD', label: 'Ladies' },
              { id: 'SS', label: 'Sr. Citizen' },
            ].map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  playClick();
                  setQuota(q.id);
                }}
                className={`px-3 py-1 rounded-lg transition ${
                  quota === q.id
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Form Inputs */}
        <form onSubmit={handleSearchSubmit}>
          {searchMode === 'route' ? (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* From Autocomplete */}
              <div className="sm:col-span-5 bg-slate-50 dark:bg-[#0B0E17] border border-slate-200 dark:border-[#1F293D] rounded-2xl p-3 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 transition-all">
                <StationAutocomplete
                  label="From Station"
                  value={from}
                  onChange={setFrom}
                  placeholder="e.g. NDLS - New Delhi"
                />
              </div>

              {/* Swap Button */}
              <div className="sm:col-span-1 flex items-center justify-center -my-2 sm:my-0">
                <button
                  type="button"
                  onClick={handleSwapStations}
                  className={`p-3 rounded-full bg-white dark:bg-[#151D30] hover:bg-indigo-50 dark:hover:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-[#1F293D] hover:border-indigo-600 shadow-sm transition-transform duration-300 ${
                    isSwapping ? 'rotate-180 scale-110' : ''
                  }`}
                  title="Swap Origin and Destination"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* To Autocomplete */}
              <div className="sm:col-span-4 bg-slate-50 dark:bg-[#0B0E17] border border-slate-200 dark:border-[#1F293D] rounded-2xl p-3 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 transition-all">
                <StationAutocomplete
                  label="To Station"
                  value={to}
                  onChange={setTo}
                  placeholder="e.g. BSB - Varanasi"
                  iconColor="text-indigo-600 dark:text-indigo-400"
                />
              </div>

              {/* Date Input */}
              <div className="sm:col-span-2 bg-slate-50 dark:bg-[#0B0E17] border border-slate-200 dark:border-[#1F293D] rounded-2xl p-3 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 transition-all">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Travel Date
                </span>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2 shrink-0" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8 bg-slate-50 dark:bg-[#0B0E17] border border-slate-200 dark:border-[#1F293D] rounded-2xl p-3.5 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 transition-all">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Search by Train Number or Train Name
                </span>
                <div className="flex items-center">
                  <Train className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    required
                    value={trainQuery}
                    onChange={(e) => setTrainQuery(e.target.value)}
                    placeholder="e.g. 22436, 12289, Vande Bharat, Rajdhani, Duronto"
                    className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-4 bg-slate-50 dark:bg-[#0B0E17] border border-slate-200 dark:border-[#1F293D] rounded-2xl p-3.5 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 transition-all">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Date
                </span>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2 shrink-0" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick Date Pills + Search CTA */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="text-slate-400 dark:text-slate-500">Quick Date:</span>
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(1)}
                className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 transition"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(2)}
                className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 transition"
              >
                +2 Days
              </button>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full sm:w-auto px-9 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-indigo-600/35 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search Trains</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal when ticket booking succeeds */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Booking Confirmed!</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Your ConfirmRail e-ticket has been generated with 10-Digit PNR{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{confirmedBooking.pnr}</strong>.
              </p>
            </div>

            <div className="my-4">
              <TicketCard booking={confirmedBooking} />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={() => {
                  setConfirmedBooking(null);
                  setSelectedSchedule(null);
                  setSelectedSeats([]);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
              >
                Book Another Ticket
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition"
              >
                Go to My Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Sorting Controls Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Train className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Available Trains</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">({schedules.length} trains found)</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Select any train below to open its real-time coach layout and reserve seats.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end text-xs">
          {/* Class Filters */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <span className="text-slate-500 dark:text-slate-400 px-2 font-bold text-[11px]">Class:</span>
            {['ALL', '3A', '2A', '1A', 'SL', 'CC'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  playClick();
                  setClassFilter(c);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  classFilter === c
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <select
              value={sortBy}
              onChange={(e) => {
                playClick();
                setSortBy(e.target.value);
              }}
              className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-bold cursor-pointer"
            >
              <option value="departure" className="dark:bg-slate-900">Departure Time (Earliest First)</option>
              <option value="duration" className="dark:bg-slate-900">Travel Duration (Fastest)</option>
              <option value="price" className="dark:bg-slate-900">Price (Lowest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Authentication Required Banner */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Sign in to book tickets</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold">Booking Protection</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Train search and live seat availability are public. To reserve berths, generate confirmed PNRs, and access payment, please sign in.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playClick();
              navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search) + '&msg=login_required');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Login to Book</span>
          </button>
        </div>
      )}

      {/* Search Results List */}
      {isSearching ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-600 dark:text-indigo-400 mb-3" />
          <p className="font-bold text-slate-800 dark:text-slate-200">Scanning Indian Railways network...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Direct Schedules & Strict Empty State */}
          {schedules.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] p-12 rounded-3xl border border-slate-200 dark:border-[#1F293D] text-center text-slate-500 dark:text-slate-400">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-slate-900 dark:text-white font-extrabold text-base">
                No direct trains found for this query
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <ConfirmTktCard
                  key={schedule._id}
                  schedule={schedule}
                  quota={quota}
                  isSelected={selectedSchedule?._id === schedule._id}
                  onSelectSeats={handleSelectClass}
                  onBookNow={handleBookNowModal}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive Coach Seat Grid & Passenger Manifest */}
      {selectedSchedule && (
        <div id="coach-seat-selector" className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800 scroll-mt-24">
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Active Reservation Selection
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Coach Blueprint: {selectedSchedule.train?.name}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full font-mono font-bold border border-indigo-200 dark:border-indigo-800 shadow-xs">
                Class {selectedClassData?.className} • #{selectedSchedule.train?.trainNumber}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedSchedule(null);
                  setSelectedSeats([]);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition"
                title="Collapse Seat Selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <SeatGrid
            schedule={selectedSchedule}
            selectedSeats={selectedSeats}
            onSeatToggle={handleSeatToggle}
          />

          {/* Passenger Manifest Input Form */}
          {selectedSeats.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Passenger Information Manifest ({selectedSeats.length} Selected)</span>
              </h3>

              <div className="space-y-3">
                {passengers.map((passenger, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-2 text-xs font-mono text-indigo-700 dark:text-indigo-400 font-bold">
                      Seat: {passenger.seatNumber}
                    </div>

                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        required
                        value={passenger.name}
                        onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                        placeholder="Full Passenger Name (As on Govt ID)"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={passenger.age}
                        onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                        placeholder="Age"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <select
                        value={passenger.gender}
                        onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 text-right font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
                      ₹{passenger.fare}
                    </div>
                  </div>
                ))}
              </div>

              {bookingError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Price Calculation & Checkout */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Payable Fare:</span>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    ₹{totalFare}{' '}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(Incl. GST & IRCTC Fee)</span>
                  </div>
                </div>

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleOpenCheckout}
                    disabled={isBooking}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/25 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Payment (MakeMyTrip™ Gateway) ➔</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenCheckout}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 transition"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Login to Reserve Seats & Pay ➔</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MakeMyTrip Premium Checkout Modal with CAPTCHA & Zero Cancellation Upsell */}
      <PremiumCheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        bookingDetails={{
          train: selectedSchedule?.train,
          schedule: selectedSchedule,
          selectedClass: selectedClassData?.className || '3A',
          quota,
          passengers,
          totalBaseFare: totalFare,
        }}
        onConfirmPayment={handleProcessPayment}
        isProcessing={isBooking}
        error={bookingError}
      />

      {/* Direct Quick Booking Modal (Passenger Manifest + Real Confirm Booking) */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        schedule={modalSchedule}
        selectedClass={modalClass}
        quota={quota}
        travelDate={date}
        onConfirmBooking={handleDirectConfirmBooking}
        isProcessing={isBooking}
        error={bookingError}
      />
    </div>
  );
};

export default BookingFlow;
