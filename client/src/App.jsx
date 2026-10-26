import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { AudioProvider } from './context/AudioContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BookingFlow from './pages/BookingFlow';
import ScheduleBoard from './pages/ScheduleBoard';
import LiveTracking from './pages/LiveTracking';
import LiveTrainStatus from './pages/LiveTrainStatus';
import PNRStatus from './pages/PNRStatus';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import { Train, Heart, Shield, Radio, Database } from 'lucide-react';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-cyan-400 font-mono text-sm">
        Authenticating railway session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AudioProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0E17] text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
                <Navbar />

            <main className="flex-1 w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/book" element={<BookingFlow />} />
                <Route path="/schedules" element={<ScheduleBoard />} />
                <Route path="/tracking" element={<LiveTracking />} />
                <Route path="/live-status" element={<LiveTrainStatus />} />
                <Route path="/pnr" element={<PNRStatus />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Modern Consumer Travel Footer */}
            <footer className="mt-20 border-t border-slate-200 dark:border-[#1F293D] bg-white dark:bg-[#0B0E17] py-10 transition-colors duration-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Train className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    ConfirmRail
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-indigo-900/60">
                    IRCTC Authorized Partner
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-slate-500 dark:text-slate-400 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    100% Safe Payments & Free Cancellation
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Live Telemetry Sync
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    © 2026 ConfirmRail Inc. All rights reserved.
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  </AudioProvider>
</ThemeProvider>
  );
}

export default App;
