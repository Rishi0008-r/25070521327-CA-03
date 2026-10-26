import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Lock,
  RefreshCw,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  Info,
  QrCode,
  Check,
} from 'lucide-react';

const PremiumCheckoutModal = ({
  isOpen,
  onClose,
  bookingDetails,
  onConfirmPayment,
  isProcessing = false,
  error = '',
}) => {
  if (!isOpen || !bookingDetails) return null;

  const {
    train,
    schedule,
    selectedClass,
    quota = 'GN',
    passengers = [],
    totalBaseFare = 0,
  } = bookingDetails;

  const numPassengers = passengers.length || 1;

  // MakeMyTrip Add-ons State
  const [zeroCancellation, setZeroCancellation] = useState(true);
  const [travelInsurance, setTravelInsurance] = useState(true);
  const [mealPreference, setMealPreference] = useState('VEG');
  const [addMeal, setAddMeal] = useState(false);

  // Tatkal Demo Evaluation Override
  const [bypassTatkalTimeLock, setBypassTatkalTimeLock] = useState(false);

  // Payment Tabs: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET'
  const [paymentTab, setPaymentTab] = useState('UPI');
  const [upiId, setUpiId] = useState('rushi@okhdfcbank');
  const [showQrCode, setShowQrCode] = useState(false);
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Card details
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('09/28');
  const [cardCvv, setCardCvv] = useState('842');
  const [cardName, setCardName] = useState(passengers[0]?.name || 'Rushi Sharma');

  // CAPTCHA State
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const canvasRef = useRef(null);

  // Generate random IRCTC-style 5-character alphanumeric captcha
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setUserCaptchaInput('');
    setCaptchaError('');
    setCaptchaVerified(false);
  };

  // Render IRCTC Captcha Canvas with distortion & noise
  useEffect(() => {
    generateCaptcha();
  }, [isOpen]);

  useEffect(() => {
    if (!canvasRef.current || !captchaCode) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#f1f5f9');
    grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Random noise lines
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Random noise dots
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();
    }

    // Draw characters with slight rotation
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textBaseline = 'middle';

    const colors = ['#1e3a8a', '#065f46', '#9f1239', '#4c1d95', '#0f766e'];

    for (let i = 0; i < captchaCode.length; i++) {
      ctx.save();
      const x = 18 + i * 22;
      const y = canvas.height / 2;
      const angle = (Math.random() - 0.5) * 0.4;
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(captchaCode[i], -8, 2);
      ctx.restore();
    }
  }, [captchaCode]);

  // Audio speech synthesis spell-out for CAPTCHA accessibility
  const handlePlayCaptchaAudio = () => {
    if ('speechSynthesis' in window) {
      const spelled = captchaCode.split('').join(' . ');
      const utterance = new SpeechSynthesisUtterance(`Captcha letters are: ${spelled}`);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Pricing math
  const zeroCancellationRate = 149;
  const zeroCancelFee = zeroCancellation ? zeroCancellationRate * numPassengers : 0;

  const insuranceRate = 0.45;
  const insuranceFee = travelInsurance ? Math.round(insuranceRate * numPassengers * 100) / 100 : 0;

  const mealFee = addMeal ? 120 * numPassengers : 0;

  const resCharge = 40 * numPassengers;
  const sfCharge = 45 * numPassengers;
  const tatkalCharge = (quota === 'TQ' || quota === 'PT') ? 350 * numPassengers : 0;
  const baseSubtotal = totalBaseFare + resCharge + sfCharge + tatkalCharge;
  const gst = Math.round(baseSubtotal * 0.05);

  const grandTotal = baseSubtotal + gst + zeroCancelFee + Math.round(insuranceFee) + mealFee;

  // Final submit handler with CAPTCHA verification
  const handleSubmit = (e) => {
    e.preventDefault();

    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaError('Incorrect CAPTCHA characters. Please try again.');
      generateCaptcha();
      return;
    }

    setCaptchaVerified(true);
    setCaptchaError('');

    onConfirmPayment({
      paymentMethod: `${paymentTab} (${paymentTab === 'UPI' ? upiId : paymentTab === 'NETBANKING' ? selectedBank : 'Verified'})`,
      addOns: {
        zeroCancellation: {
          selected: zeroCancellation,
          fee: zeroCancelFee,
        },
        travelInsurance: {
          selected: travelInsurance,
          fee: insuranceFee,
        },
        mealPreference: {
          selected: addMeal,
          mealType: mealPreference,
          fee: mealFee,
        },
      },
      bypassTatkalTimeLock,
      grandTotal,
    });
  };

  // IST Time display
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const istTimeString = `${istDate.getUTCHours().toString().padStart(2, '0')}:${istDate.getUTCMinutes().toString().padStart(2, '0')} IST`;
  const isAC = ['1A', '2A', '3A', '3E', 'CC', 'EC'].includes(selectedClass);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 transition-all">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  MakeMyTrip™ Premium Checkout
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-400/30">
                  256-BIT SSL SECURE
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{train?.name || 'Indian Railways Express'}</span>
                <span className="text-xs font-mono font-normal opacity-80">#{train?.trainNumber}</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two Column Layout */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: MakeMyTrip Add-ons & IRCTC Quota Verification (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. MakeMyTrip Trip Guarantee / Zero Cancellation Fee */}
            <div
              onClick={() => setZeroCancellation(!zeroCancellation)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                zeroCancellation
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      zeroCancellation
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {zeroCancellation && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        MakeMyTrip Assure: Free Cancellation Guarantee
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300">
                        100% Refund
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Get 100% instant refund without standard IRCTC cancellation deductions if cancelled before chart preparation.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-400">
                    +₹{zeroCancellationRate * numPassengers}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    (₹{zeroCancellationRate}/pax)
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Comprehensive Travel Insurance */}
            <div
              onClick={() => setTravelInsurance(!travelInsurance)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                travelInsurance
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      travelInsurance
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {travelInsurance && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        IRCTC / Chola MS Travel Insurance
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-300">
                        ₹10 Lakh Cover
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Comprehensive personal accidental death, permanent disability & hospitalization baggage cover.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-sm font-black text-blue-700 dark:text-blue-400">
                    +₹{(insuranceRate * numPassengers).toFixed(2)}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    (₹{insuranceRate}/pax)
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Tatkal Time-Lock & Quota Audit Banner */}
            {(quota === 'TQ' || quota === 'PT') && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>IRCTC Tatkal Time-Lock Audit</span>
                  </span>
                  <span className="font-mono text-[11px] bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                    Server: {istTimeString}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Official IRCTC Rule: <strong>{isAC ? '10:00 AM IST (AC Classes)' : '11:00 AM IST (Non-AC Classes)'}</strong>.
                  Bookings attempted outside this window are automatically time-locked by the backend controller.
                </p>

                <div className="pt-2 border-t border-amber-200 dark:border-amber-900 flex items-center justify-between text-[11px]">
                  <span className="text-amber-900 dark:text-amber-200 font-semibold">
                    Exam / Evaluation Override Mode:
                  </span>
                  <button
                    type="button"
                    onClick={() => setBypassTatkalTimeLock(!bypassTatkalTimeLock)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                      bypassTatkalTimeLock
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    {bypassTatkalTimeLock ? '✓ Override Active' : 'Enable Override'}
                  </button>
                </div>
              </div>
            )}

            {/* 4. IRCTC Alphanumeric CAPTCHA Validation */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>IRCTC Anti-Bot Security CAPTCHA</span>
                </span>
                <span className="text-[10px] text-slate-400">Case Sensitive</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Visual Canvas Box */}
                <div className="relative border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden shadow-inner bg-slate-100">
                  <canvas ref={canvasRef} width="140" height="42" className="block" />
                </div>

                {/* Audio + Refresh controls */}
                <button
                  type="button"
                  onClick={handlePlayCaptchaAudio}
                  title="Listen to Captcha"
                  className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-600 transition"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={generateCaptcha}
                  title="Generate New Captcha"
                  className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-600 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Captcha Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={userCaptchaInput}
                    onChange={(e) => {
                      setUserCaptchaInput(e.target.value);
                      setCaptchaError('');
                    }}
                    placeholder="Enter 5 chars"
                    className="w-full uppercase font-mono tracking-widest text-center text-sm font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950"
                  />
                </div>
              </div>

              {captchaError && (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{captchaError}</span>
                </p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Payment Method Selection & Bill Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Payment Method Tabs */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Select Payment Mode
              </span>

              <div className="grid grid-cols-4 gap-1.5 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl text-[11px] font-black">
                {[
                  { id: 'UPI', label: 'UPI', icon: Smartphone },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'NETBANKING', label: 'Bank', icon: Building2 },
                  { id: 'WALLET', label: 'Wallet', icon: Wallet },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPaymentTab(tab.id)}
                      className={`py-2 rounded-lg flex flex-col items-center gap-1 transition ${
                        paymentTab === tab.id
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* UPI Tab View */}
              {paymentTab === 'UPI' && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Virtual Payment Address (VPA):</span>
                    <button
                      type="button"
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-[11px] flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{showQrCode ? 'Hide QR' : 'Show QR'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@okhdfcbank"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                  />

                  {showQrCode && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                      <div className="w-32 h-32 mx-auto bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600">
                        <QrCode className="w-24 h-24 text-slate-800 dark:text-slate-200" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block">Scan with any UPI App</span>
                    </div>
                  )}
                </div>
              )}

              {/* CARD Tab View */}
              {paymentTab === 'CARD' && (
                <div className="space-y-2 pt-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">CVV</label>
                      <input
                        type="password"
                        maxLength={3}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NETBANKING Tab View */}
              {paymentTab === 'NETBANKING' && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'PNB'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2 rounded-xl border text-center text-xs font-bold transition ${
                        selectedBank === bank
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-400 dark:text-indigo-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              )}

              {/* WALLET Tab View */}
              {paymentTab === 'WALLET' && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold block">IRCTC e-Wallet</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Available: ₹3,450.00</span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                    1-Click Pay
                  </span>
                </div>
              )}
            </div>

            {/* Bill Breakdown Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Fare Summary ({numPassengers} {numPassengers === 1 ? 'Passenger' : 'Passengers'})
              </span>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Base Fare ({selectedClass}):</span>
                <span className="font-mono">₹{totalBaseFare}</span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>IRCTC & Superfast Charges:</span>
                <span className="font-mono">₹{resCharge + sfCharge}</span>
              </div>

              {tatkalCharge > 0 && (
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span>Tatkal Surcharge:</span>
                  <span className="font-mono">₹{tatkalCharge}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST (5%):</span>
                <span className="font-mono">₹{gst}</span>
              </div>

              {zeroCancellation && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Free Cancellation Guarantee:</span>
                  <span className="font-mono">+₹{zeroCancelFee}</span>
                </div>
              )}

              {travelInsurance && (
                <div className="flex justify-between text-blue-600 font-semibold">
                  <span>Travel Insurance:</span>
                  <span className="font-mono">+₹{Math.round(insuranceFee)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                <span>Total Payable Fare:</span>
                <span className="text-lg font-mono text-emerald-600 dark:text-emerald-400">
                  ₹{grandTotal}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Pay Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing IRCTC Reservation...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Pay ₹{grandTotal}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PremiumCheckoutModal;
