import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import TicketCard from '../components/TicketCard';
import {
  User,
  Ticket,
  Search,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Phone,
  Mail,
  Shield,
  Layers,
  Navigation,
  Compass,
  ArrowRight,
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'active' | 'all' | 'cancelled'
  const [pnrSearch, setPnrSearch] = useState('');
  const [searchedTicket, setSearchedTicket] = useState(null);
  const [pnrError, setPnrError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data);
      refreshProfile();
    } catch (err) {
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelTicket = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this ticket? The seats will be released back to the live train inventory.')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const res = await api.put(`/bookings/${bookingId}/cancel`);
      alert(res.data.message || 'Ticket cancelled successfully.');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel ticket.');
    } finally {
      setCancellingId(null);
    }
  };

  const handlePnrLookup = async (e) => {
    e.preventDefault();
    if (!pnrSearch.trim()) return;

    setPnrError('');
    setSearchedTicket(null);

    try {
      const res = await api.get(`/bookings/pnr/${pnrSearch.trim()}`);
      setSearchedTicket(res.data);
    } catch (err) {
      setPnrError(err.response?.data?.message || 'PNR not found in system database');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'active') return b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'RAC';
    if (filter === 'cancelled') return b.bookingStatus === 'CANCELLED';
    return true;
  });

  const activeCount = bookings.filter((b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'RAC').length;
  const cancelledCount = bookings.filter((b) => b.bookingStatus === 'CANCELLED').length;

  return (
    <div className="space-y-8 py-6">
      {/* Top Profile Summary Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-cyan-600/30">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">{user?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono uppercase font-bold">
                  {user?.role || 'Passenger'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  {user?.email}
                </span>
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    {user?.phone}
                  </span>
                )}
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center min-w-[120px]">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">
                Active Passes
              </span>
              <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
                {activeCount}
              </span>
            </div>

            <div className="flex-1 md:flex-none p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center min-w-[120px]">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">
                Total Bookings
              </span>
              <span className="text-xl font-bold text-cyan-400 font-mono mt-0.5 block">
                {bookings.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Utility Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/pnr"
          className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition">
                Check Live PNR Status
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                ConfirmTkt prediction & chart preparation alerts
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/live-status"
          className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition">
                Spot Your Train (Live Running Status)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact station crossing timeline & live speeds
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Bookings & History Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Your Bookings & Boarding Passes</h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  filter === 'active'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  filter === 'cancelled'
                    ? 'bg-rose-900/60 text-rose-200 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({bookings.length})
              </button>
            </div>

            <button
              onClick={fetchBookings}
              title="Refresh Bookings"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="glass-panel p-12 rounded-2xl text-center text-slate-400">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-cyan-400 mb-2" />
            <p>Loading your ticket records...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center text-slate-400">
            <Ticket className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-300 font-medium">No bookings found in this category.</p>
            <p className="text-xs text-slate-500 mt-1">
              Search routes and book seats to receive instant PNR digital passes.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((b) => (
              <div key={b._id} className="space-y-2">
                <div className="flex items-center justify-between px-2 text-xs font-mono">
                  <span className="text-slate-400">
                    PNR: <strong className="text-cyan-400">{b.pnr}</strong>
                  </span>
                  <Link
                    to={`/live-status?train=${b.trainNumber}`}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 text-xs"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Track Live Status ➔</span>
                  </Link>
                </div>

                <TicketCard
                  booking={b}
                  onCancelTicket={handleCancelTicket}
                  isCancelling={cancellingId === b._id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
