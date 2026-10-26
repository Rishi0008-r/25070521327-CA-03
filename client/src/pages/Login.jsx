import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || location.state?.from || '/dashboard';
  const loginMsg = searchParams.get('msg');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(redirectPath);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefillUser = () => {
    setEmail('rushi@example.com');
    setPassword('password123');
  };

  const handlePrefillAdmin = () => {
    setEmail('admin@railways.gov.in');
    setPassword('adminpassword123');
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-cyan-600/30 mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your train bookings, live tracking, and digital PNR tickets
          </p>
        </div>

        {loginMsg === 'login_required' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-3 shadow-lg shadow-amber-950/40">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm block">Login Required to Book</span>
              <span className="text-amber-200/90 text-[11px]">
                Please sign in to your IRCTC / RailSync account to proceed with seat selection and ticket reservation.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Sign In to RailSync'}
          </button>
        </form>

        {/* Demo Prefill Quick Buttons for Evaluator / Testing */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <span className="text-[11px] uppercase font-mono text-slate-400 block mb-2 text-center">
            Quick Academic Demo Credentials
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrefillUser}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-[11px] font-mono transition"
            >
              Passenger User
            </button>
            <button
              type="button"
              onClick={handlePrefillAdmin}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-[11px] font-mono transition"
            >
              Admin Controller
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline font-medium">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
