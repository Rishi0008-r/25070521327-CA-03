import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StationAutocomplete from '../components/StationAutocomplete';
import IndiaRailwayMap from '../components/IndiaRailwayMap';
import { useSocket } from '../context/SocketContext';
import { useAudio } from '../context/AudioContext';
import {
  Search,
  Train,
  Calendar,
  ArrowRightLeft,
  ShieldCheck,
  Compass,
  Clock,
  Navigation,
  CheckCircle2,
  Flame,
} from 'lucide-react';

const QUICK_ROUTES = [
  { from: 'New Delhi', to: 'Varanasi Junction', label: 'NDLS ➔ BSB', train: 'Vande Bharat' },
  { from: 'New Delhi', to: 'Mumbai Central', label: 'NDLS ➔ MMCT', train: 'Rajdhani' },
  { from: 'Chhatrapati Shivaji Maharaj Terminus', to: 'Nagpur Junction', label: 'CSMT ➔ NGP', train: 'Duronto' },
  { from: 'Pune Junction', to: 'Solapur Junction', label: 'PUNE ➔ SUR', train: 'Vande Bharat' },
  { from: 'Howrah Junction', to: 'MGR Chennai Central', label: 'HWH ➔ MAS', train: 'Coromandel' },
  { from: 'MGR Chennai Central', to: 'Mysuru Junction', label: 'MAS ➔ MYS', train: 'Vande Bharat' },
];

const Home = () => {
  const navigate = useNavigate();
  const { liveTrains } = useSocket();
  const { playClick, playSwoosh, playStationChime } = useAudio();

  // Search widget state
  const [searchMode, setSearchMode] = useState('route'); // 'route' | 'train'
  const [from, setFrom] = useState('New Delhi (NDLS)');
  const [to, setTo] = useState('Varanasi Junction (BSB)');
  const [trainQuery, setTrainQuery] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quota, setQuota] = useState('GN');
  const [isSwapping, setIsSwapping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Map Filter State
  const [selectedZone, setSelectedZone] = useState('ALL');

  const handleSwap = () => {
    playSwoosh();
    setIsSwapping(true);
    const temp = from;
    setFrom(to);
    setTo(temp);
    setTimeout(() => setIsSwapping(false), 300);
  };

  const setQuickDate = (offsetDays) => {
    playClick();
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    playClick();
    setIsSearching(true);
    if (searchMode === 'train') {
      navigate(`/book?mode=train&trainQuery=${encodeURIComponent(trainQuery)}&date=${date}`);
    } else {
      navigate(`/book?mode=route&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&quota=${quota}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-200">
      {/* 1. Visually Striking Consumer Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white pt-12 pb-32 sm:pb-36 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle geometric pattern circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>IRCTC Authorized NextGen Booking Partner</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Book Train Tickets with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-white bg-clip-text text-transparent">
              Highest Confirmation Chances
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-indigo-100 max-w-2xl mx-auto font-medium">
            Live seat shift updates via WebSockets, AI confirmation predictions, and instant refunds on Tatkal & General quotas.
          </p>

          {/* Quick trust metrics */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-indigo-200 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Zero Gateway Fees via UPI
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Free Cancellation
            </span>
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              ConfirmTkt Prediction Engine
            </span>
          </div>
        </div>
      </section>

      {/* 2. Floating High-Contrast Train Search Card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/80 dark:shadow-slate-950/60 border border-slate-100 dark:border-slate-800 p-5 sm:p-7 transition-all duration-200">
          {/* Mode Tabs & Quota Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#1F293D] pb-4 mb-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSearchMode('route');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  searchMode === 'route'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151D30]'
                }`}
              >
                <Train className="w-4 h-4" />
                Route Search (From → To)
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setSearchMode('train');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  searchMode === 'train'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151D30]'
                }`}
              >
                <Search className="w-4 h-4" />
                Direct Train (No. or Name)
              </button>
            </div>

            {/* Quota Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#151D30] p-1 rounded-xl text-xs font-bold border border-transparent dark:border-[#1F293D]">
              <span className="text-slate-500 dark:text-slate-400 px-2 text-[11px]">Quota:</span>
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

          {/* Search Inputs Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {searchMode === 'route' ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* From Station */}
                <div className="md:col-span-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50/40 dark:hover:bg-slate-800 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 transition-all duration-200">
                  <StationAutocomplete
                    label="From Station"
                    value={from}
                    onChange={(val) => setFrom(val)}
                    placeholder="Enter origin station"
                    iconColor="text-indigo-600 dark:text-indigo-400"
                  />
                </div>

                {/* Animated Swap Button */}
                <div className="md:col-span-1 flex items-center justify-center -my-2 md:my-0">
                  <button
                    type="button"
                    onClick={handleSwap}
                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 active:rotate-180"
                    title="Swap Origin & Destination (Audio Feedback)"
                  >
                    <ArrowRightLeft
                      className={`w-4 h-4 transition-transform duration-300 ${
                        isSwapping ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* To Station */}
                <div className="md:col-span-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50/40 dark:hover:bg-slate-800 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 transition-all duration-200">
                  <StationAutocomplete
                    label="To Station"
                    value={to}
                    onChange={(val) => setTo(val)}
                    placeholder="Enter destination station"
                    iconColor="text-indigo-600 dark:text-indigo-400"
                  />
                </div>

                {/* Date Picker */}
                <div className="md:col-span-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50/40 dark:hover:bg-slate-800 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 transition-all duration-200">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Travel Date
                  </span>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2 shrink-0" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Direct Train Search */}
                <div className="md:col-span-8 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50/40 dark:hover:bg-slate-800 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 transition-all">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Train Name or 5-Digit Number
                  </span>
                  <div className="flex items-center">
                    <Train className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2.5 shrink-0" />
                    <input
                      type="text"
                      value={trainQuery}
                      onChange={(e) => setTrainQuery(e.target.value)}
                      placeholder="e.g. 22223, 12289, Vande Bharat, Duronto, 12951, Rajdhani"
                      className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* Date for train search */}
                <div className="md:col-span-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50/40 dark:hover:bg-slate-800 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 transition-all">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Date of Journey
                  </span>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2 shrink-0" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick date pills and Search CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              {/* Quick Date Pills */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="text-slate-400 dark:text-slate-500">Quick dates:</span>
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

              {/* Large Bright Purple Search Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="w-full sm:w-auto px-9 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-purple-600/35 hover:scale-[1.03] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Searching Trains...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search Trains</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Popular Route Shortcuts */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400">Popular Corridors:</span>
            {QUICK_ROUTES.map((route) => (
              <button
                key={route.label}
                type="button"
                onClick={() => {
                  playClick();
                  setFrom(route.from);
                  setTo(route.to);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium transition"
              >
                {route.label} <span className="text-slate-400 dark:text-slate-500 font-normal">({route.train})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Below the Fold: Clean Quick Access Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Everything for Your Rail Journey
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
            Fast, reliable IRCTC tools built for Indian railway passengers across all 18 zonal divisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: PNR Status */}
          <div
            onClick={() => {
              playClick();
              navigate('/pnr');
            }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-slate-950/70 hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              PNR Status & Prediction
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Check real-time chart status, confirmed coach & berth allocation, and waitlist confirmation probability.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-4 group-hover:translate-x-1 transition-transform">
              Check PNR ➔
            </span>
          </div>

          {/* Card 2: Spot Train Live */}
          <div
            onClick={() => {
              playStationChime();
              navigate('/live-status?train=22223');
            }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-slate-950/70 hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Navigation className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Spot Your Train
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Accurate live GPS tracking, intermediate station arrival delays, and platform announcement feeds.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-4 group-hover:translate-x-1 transition-transform">
              Track Live Location ➔
            </span>
          </div>

          {/* Card 3: All-India Transit Radar */}
          <div
            onClick={() => {
              playStationChime();
              navigate('/tracking');
            }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-slate-950/70 hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              All-India Railway Radar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Interactive SVG map showing moving locomotives across Maharashtra and Pan-India corridors in real time.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-4 group-hover:translate-x-1 transition-transform">
              Launch Live Radar ➔
            </span>
          </div>

          {/* Card 4: Live Schedule Board */}
          <div
            onClick={() => {
              playClick();
              navigate('/schedules');
            }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-slate-950/70 hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Live Station Timetable
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Real-time electronic schedule board showing departures, arrivals, platform numbers, and delays.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 mt-4 group-hover:translate-x-1 transition-transform">
              View Schedules ➔
            </span>
          </div>
        </div>
      </section>

      {/* 4. Embedded All-India Transit Radar with Segmented Controls */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-xs font-bold mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Network Status
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                All-India Railway Geospatial Radar
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time locomotive telematics mapped across Maharashtra & Indian railway zones.
              </p>
            </div>

            {/* Segmented Control Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
              {['ALL', 'CENTRAL', 'WESTERN', 'NORTHERN', 'SOUTHERN', 'EASTERN'].map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedZone(zone);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition duration-150 ${
                    selectedZone === zone
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {zone === 'ALL' ? 'Pan India' : zone.charAt(0) + zone.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Embedded Radar Component */}
          <div className="mt-6 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <IndiaRailwayMap zoneFilter={selectedZone} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
