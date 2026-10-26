import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';
import PresentationModal from './PresentationModal';
import {
  Train,
  Clock,
  Navigation,
  User,
  LogOut,
  Ticket,
  Volume2,
  VolumeX,
  Compass,
  Search,
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { liveAlerts, dismissAlert } = useSocket();
  const { isDark, toggleTheme } = useTheme();
  const { soundActive, toggleSound, playClick, playStationChime } = useAudio();
  const location = useLocation();

  const [isPresenterOpen, setIsPresenterOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleToggleSound = () => {
    toggleSound();
    if (!soundActive) {
      // If turning on, give immediate satisfying station chime feedback!
      playStationChime();
    }
  };

  const navLinks = [
    { name: 'Train Tickets', path: '/book', icon: Ticket },
    { name: 'PNR Status', path: '/pnr', icon: Search },
    { name: 'Live Status', path: '/live-status', icon: Navigation },
    { name: 'Transit Radar', path: '/tracking', icon: Compass },
    { name: 'Schedule Board', path: '/schedules', icon: Clock },
    { name: 'My Dashboard', path: '/dashboard', icon: User, protected: true },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0B0E17]/95 backdrop-blur-md border-b border-gray-100 dark:border-[#1F293D] shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Consumer Brand Logo */}
            <Link
              to="/"
              onClick={playClick}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-200">
                <Train className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors">
                    Confirm<span className="text-indigo-600 dark:text-indigo-400">Rail</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    IRCTC Partner
                  </span>
                </div>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Fast & Confirmed Train Booking
                </span>
              </div>
            </Link>

            {/* Consumer Clean Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {navLinks.map((link) => {
                if (link.protected && !isAuthenticated) return null;
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={playClick}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 dark:bg-indigo-600 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151D30]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        active
                          ? 'text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right section: Dark Mode Toggle + Audio Chime + Dev modal + Auth CTAs */}
            <div className="flex items-center gap-2.5">
              {/* Seamless Dark / Light Mode Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  playClick();
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all duration-200"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Dark Mode"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 transition-transform -rotate-12 hover:rotate-0" />
                )}
              </button>

              {/* Audio Chime Button */}
              <button
                type="button"
                onClick={handleToggleSound}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  soundActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600'
                }`}
                title={soundActive ? 'IRCTC Audio Feedback Enabled' : 'Audio Feedback Muted'}
                aria-label="Toggle Sound Effects"
              >
                {soundActive ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>

              {/* Discreet Dev / Evaluator Panel Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsPresenterOpen(true);
                  playClick();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all"
                title="Evaluator Toolkit & Project Demo Guide"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Demo Toolkit</span>
              </button>

              {/* Auth CTAs */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/dashboard"
                    onClick={playClick}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:inline">{user?.name?.split(' ')[0]}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      playClick();
                    }}
                    className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    onClick={playClick}
                    className="px-4 py-2 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={playClick}
                    className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile menu hamburger */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  playClick();
                }}
                className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
              {navLinks.map((link) => {
                if (link.protected && !isAuthenticated) return null;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      playClick();
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                      isActive(link.path)
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsPresenterOpen(true);
                  playClick();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
              >
                <Sparkles className="w-4 h-4" />
                Evaluator Toolkit
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Real-time crossing announcement banner if alert received */}
      {liveAlerts && liveAlerts.length > 0 && (
        <div className="bg-indigo-900 dark:bg-slate-950 text-white py-2 px-4 shadow-inner text-xs border-b border-indigo-800 dark:border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-indigo-200 dark:text-indigo-400 font-mono">LIVE NOTICE:</span>
              <span className="truncate">{liveAlerts[0].notice || liveAlerts[0].message}</span>
            </div>
            <button
              onClick={() => dismissAlert(liveAlerts[0].id)}
              className="text-slate-300 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Evaluator Modal */}
      <PresentationModal
        isOpen={isPresenterOpen}
        onClose={() => setIsPresenterOpen(false)}
      />
    </>
  );
};

export default Navbar;
