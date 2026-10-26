import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { playStationChime } from '../utils/audio';
import {
  Sparkles,
  Presentation,
  CheckCircle,
  Zap,
  Radio,
  Database,
  Shield,
  Volume2,
  X,
  Play,
  ArrowRight,
  Code,
  Layers,
  Award,
} from 'lucide-react';

const PresentationModal = ({ isOpen, onClose }) => {
  const { triggerDelaySimulation } = useSocket();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState('demo'); // 'demo' | 'architecture' | 'slides'
  const [feedbackMsg, setFeedbackMsg] = useState('');

  if (!isOpen) return null;

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  const handleSimulateDelayAndChime = () => {
    playStationChime();
    triggerDelaySimulation('22436', 15, 'DELAYED');
    showFeedback('🔔 Played Station Chime & broadcasted +15m delay on Vande Bharat via WebSocket!');
  };

  const handleResetOnTime = () => {
    playStationChime();
    triggerDelaySimulation('22436', 0, 'ON TIME');
    showFeedback('✔ Restored Vande Bharat to ON TIME status and updated all boards!');
  };

  const handleAutoLoginDemo = async () => {
    try {
      await login('rushi@example.com', 'password123');
      showFeedback('👤 Successfully authenticated as Passenger: Rushi Sharma!');
    } catch (e) {
      showFeedback('Login error: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-4xl w-full bg-slate-950 border border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Academic Presentation & Evaluator Guide
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                Ready for Review
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive demonstration toolkit, architectural talking points, and 1-click live test controls.
            </p>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="mb-4 p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2 animate-bounce-short">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('demo')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'demo'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            🕹️ Live Interactive Test Pad
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'architecture'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            🏛️ Architectural Talking Points
          </button>
          <button
            onClick={() => setActiveTab('slides')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'slides'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            📋 Project Walkthrough Pitch
          </button>
        </div>

        {/* TAB 1: Live Interactive Test Pad */}
        {activeTab === 'demo' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">
                1-Click Demonstrations for the Evaluator
              </h3>
              <p className="text-xs text-slate-400">
                Trigger real-time events on the spot to demonstrate WebSocket reactivity, sound synthesis, and state consistency.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Trigger 1: Delay + Chime */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-amber-300 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" />
                    Audio Chime + Live Delay
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400">
                    Socket.io
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Plays the Indian Railways station chime and broadcasts a 15 min delay on Vande Bharat #22436 to all open windows.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateDelayAndChime}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                  >
                    Trigger Delay (+15m)
                  </button>
                  <button
                    onClick={handleResetOnTime}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                  >
                    Reset On Time
                  </button>
                </div>
              </div>

              {/* Trigger 2: Station Audio Chime */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-cyan-300 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" />
                    Web Audio Synthesis
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400">
                    Zero External Files
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Synthesizes realistic 3-tone station arrival chime (D4 ➔ F#4 ➔ A4) directly in browser using Web Audio API oscillators.
                </p>
                <button
                  onClick={() => {
                    playStationChime();
                    showFeedback('🔊 Played authentic Indian Railways 3-tone arrival chime!');
                  }}
                  className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
                >
                  Play Station Announcement Chime
                </button>
              </div>

              {/* Trigger 3: Instant Auth */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-emerald-300 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    Instant Demo Login
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">
                    JWT Session
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Instantly authenticates as passenger <strong>Rushi Sharma</strong> without having to type email and password.
                </p>
                <button
                  onClick={handleAutoLoginDemo}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  Authenticate as Passenger
                </button>
              </div>

              {/* Trigger 4: Active PNR */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-indigo-300 flex items-center gap-1.5">
                    <Database className="w-4 h-4" />
                    Demo Seeded PNR
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400">
                    MongoDB Model
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Seeded 10-digit PNR for verification: <strong className="font-mono text-white">8492048172</strong> on Vande Bharat Express.
                </p>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center font-mono text-cyan-400 text-xs font-bold">
                  PNR: 8492048172 (Confirmed)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Architectural Talking Points */}
        {activeTab === 'architecture' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-bold text-cyan-400 text-sm mb-1">
                1. Why Socket.io over Polling?
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Standard HTTP polling creates high server overhead and latency. In a train booking system with thousands of passengers checking coach seats simultaneously, WebSocket connections provide sub-50ms latency with zero HTTP header overhead per telemetry packet.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-bold text-emerald-400 text-sm mb-1">
                2. Preventing Race Conditions & Double Booking
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Seat reservations in the backend (<code className="text-cyan-300 font-mono">bookingRoutes.js</code>) execute atomic seat state verification before persisting documents. If two users click the same berth simultaneously, the first write locks the seat and immediately emits <code className="text-cyan-300 font-mono">seat_booked</code> over WebSocket, causing the second user's UI to update with a friendly notification.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-bold text-indigo-400 text-sm mb-1">
                3. Geospatial GPS Telemetry Interpolation
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Train locations are computed using geographic spherical coordinates (Latitude & Longitude) across major Indian Railway junction nodes. The backend ticks every 3 seconds, interpolating speed and leg progression percentage along the track.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: Walkthrough Pitch */}
        {activeTab === 'slides' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-mono text-cyan-400 block mb-1">PHASE 1</span>
                <strong className="text-white block mb-1">Route & Berth Selection</strong>
                <p className="text-slate-400 text-[11px]">
                  User chooses origin, destination, and explores interactive coach layouts with window/aisle designations.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-mono text-cyan-400 block mb-1">PHASE 2</span>
                <strong className="text-white block mb-1">Instant PNR E-Ticket</strong>
                <p className="text-slate-400 text-[11px]">
                  Standard 10-digit PNR generated with scannable QR manifest, passenger details, and printable boarding pass.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-mono text-cyan-400 block mb-1">PHASE 3</span>
                <strong className="text-white block mb-1">Live Transit Tracking</strong>
                <p className="text-slate-400 text-[11px]">
                  Passenger and controller track moving locomotives on the All-India map with live speeds and station announcements.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-300">
              <span className="font-bold block mb-1">Presentation Tip:</span>
              <span>
                Open two separate browser windows (or an Incognito window). Show the professor how booking a seat in Window 1 instantly turns that seat red on Window 2 without any manual page reload!
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Academic Full-Stack Evaluation Package • Ready for Defense
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresentationModal;
