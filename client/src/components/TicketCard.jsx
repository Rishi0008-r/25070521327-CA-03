import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Train,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  QrCode as QrIcon,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Share2,
} from 'lucide-react';

const TicketCard = ({ booking, onCancelTicket, isCancelling }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const isCancelled = booking.bookingStatus === 'CANCELLED';

  useEffect(() => {
    if (booking?.pnr) {
      const qrPayload = booking.qrData || JSON.stringify({
        pnr: booking.pnr,
        train: `${booking.trainNumber || ''} ${booking.trainName || ''}`.trim(),
        route: `${booking.source} -> ${booking.destination}`,
        date: booking.travelDate,
        class: booking.selectedClass || '3A',
        quota: booking.quota || 'GN',
        status: booking.bookingStatus || 'CONFIRMED',
        passengers: booking.passengers?.map((p) => ({
          name: p.name,
          seat: `${p.coachNumber || 'B1'}-${p.seatNumber || '21'}`,
        })),
        verifier: 'CONFIRMRAIL_IRCTC_SECURE_AUTH',
      });

      const qrGenerator = QRCode?.toDataURL ? QRCode : (QRCode?.default || QRCode);

      if (qrGenerator && typeof qrGenerator.toDataURL === 'function') {
        qrGenerator.toDataURL(qrPayload, {
          width: 280,
          margin: 2,
          color: {
            dark: '#0B0E17',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        })
          .then((url) => setQrDataUrl(url))
          .catch((err) => {
            console.warn('QR code local canvas generation fallback:', err);
            // Universal scannable QR fallback
            setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`);
          });
      } else {
        // Universal scannable QR fallback
        setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`);
      }
    }
  }, [booking]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPnr = () => {
    if (booking?.pnr) {
      navigator.clipboard.writeText(booking.pnr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-xl ${
        isCancelled
          ? 'bg-[#111827] border-rose-900/50 opacity-80'
          : 'bg-[#111827] border-[#1F293D] hover:border-indigo-500/40'
      }`}
    >
      {/* Top Banner Ribbon */}
      <div
        className={`px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold border-b ${
          isCancelled
            ? 'bg-rose-950/40 text-rose-300 border-rose-900/40'
            : 'bg-gradient-to-r from-indigo-950/60 via-[#151D30] to-purple-950/40 text-indigo-200 border-[#1F293D]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Train className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 mr-2 font-black">
              #{booking.trainNumber}
            </span>
            <span className="text-sm font-black text-white">
              {booking.trainName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 10-Digit PNR Pill with Copy Button */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B0E17] border border-[#1F293D] font-mono text-slate-200 shadow-xs">
            <span className="text-slate-400 font-medium">PNR:</span>
            <span className="text-indigo-400 font-black tracking-wider text-sm">{booking.pnr}</span>
            <button
              type="button"
              onClick={handleCopyPnr}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Copy PNR"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide ${
              isCancelled
                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 shadow-xs'
            }`}
          >
            {isCancelled ? (
              <>
                <XCircle className="w-3.5 h-3.5" /> CANCELLED
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> CONFIRMED
              </>
            )}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Journey Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-2 border-b border-[#1F293D]/80">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              Origin Station
            </span>
            <h4 className="text-lg font-black text-white flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{booking.source}</span>
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1 font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{booking.departureTime}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-xs text-slate-300 font-bold font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {booking.travelDate}
            </span>
            <div className="w-full flex items-center justify-center my-2">
              <div className="h-[2px] w-1/3 bg-[#1F293D]" />
              <div className="px-3 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800 text-[11px] text-indigo-300 font-mono font-bold">
                {booking.selectedClass || '3A'} • {booking.quota === 'TQ' ? 'Tatkal' : 'General'}
              </div>
              <div className="h-[2px] w-1/3 bg-[#1F293D]" />
            </div>
            <span className="text-[11px] text-emerald-400 font-bold">
              {booking.chartStatus || 'Confirmed & Chart Prepared'}
            </span>
          </div>

          <div className="md:text-right">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              Destination Station
            </span>
            <h4 className="text-lg font-black text-white flex md:justify-end items-center gap-1.5 mt-0.5">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{booking.destination}</span>
            </h4>
            <div className="flex md:justify-end items-center gap-1.5 text-xs text-slate-300 mt-1 font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{booking.arrivalTime}</span>
            </div>
          </div>
        </div>

        {/* Passenger Manifest Table */}
        <div>
          <h5 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Passenger Manifest ({booking.passengers?.length || 0})
          </h5>

          <div className="overflow-x-auto rounded-2xl border border-[#1F293D] bg-[#0B0E17]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151D30] text-slate-300 border-b border-[#1F293D] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Passenger</th>
                  <th className="py-2.5 px-3">Age / Gender</th>
                  <th className="py-2.5 px-3">Coach</th>
                  <th className="py-2.5 px-3">Seat</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Fare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D]">
                {booking.passengers?.map((p, idx) => (
                  <tr key={idx} className="hover:bg-[#151D30]/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{p.name}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-medium">
                      {p.age} Yrs / {p.gender}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-black text-indigo-400">
                      {p.coachNumber || 'B1'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-black text-white">
                      {p.seatNumber || `${p.coachNumber || 'B1'}-21`}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-400 font-bold">
                      {p.berthPreference || p.seatType || 'LOWER'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-black font-mono">
                        {p.currentStatus || 'CNF'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-emerald-400 font-black">
                      ₹{p.fare || booking.totalFare}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer with REAL Scannable QR Code + Payment + Actions */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pt-4 border-t border-[#1F293D]">
          {/* Real Scannable QR Code section */}
          <div className="flex items-center gap-4 w-full lg:w-auto bg-[#0B0E17] p-3 rounded-2xl border border-[#1F293D]">
            <div className="bg-white p-1.5 rounded-xl shrink-0 shadow-md">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Scannable Digital Train Ticket QR Code"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded"
                />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center text-slate-400">
                  <QrIcon className="w-10 h-10 animate-pulse" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase tracking-wider inline-block">
                IRCTC Scannable Ticket
              </span>
              <p className="text-xs text-white font-bold">Scan via TTE Handheld / Smartphone</p>
              <p className="text-[11px] text-slate-400 font-mono">
                TXN: <strong className="text-slate-300">{booking.paymentId || 'PAY_UPI_9921'}</strong>
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-xs text-slate-400">Total Paid:</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  ₹{booking.totalFare}
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 uppercase font-mono font-bold">
                  {booking.paymentStatus || 'PAID'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            <button
              onClick={handlePrint}
              type="button"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#151D30] hover:bg-[#1E293B] text-white text-xs font-bold border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print Ticket</span>
            </button>

            {!isCancelled && onCancelTicket && (
              <button
                onClick={() => onCancelTicket(booking._id)}
                disabled={isCancelling}
                type="button"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-800/80 transition disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{isCancelling ? 'Processing...' : 'Cancel Ticket'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
