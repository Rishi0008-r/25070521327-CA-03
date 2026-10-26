const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Station = require('./models/Station');
const Route = require('./models/Route');
const FareRule = require('./models/FareRule');
const Train = require('./models/Train');
const Schedule = require('./models/Schedule');
const Booking = require('./models/Booking');
const { MAJOR_STATIONS, STATIONS_BY_REGION } = require('./data/stations');
const { calculateWaitlistProbability } = require('./utils/waitlistPredictor');

dotenv.config();

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  const dbConnector = require('./config/db');
  await dbConnector();
};

// =========================================================================
// 1. GEOGRAPHIC & MATHEMATICAL HELPERS
// =========================================================================

// Haversine formula for spherical distance in kilometers
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Indian Railways track tortuosity factor (~1.18x straight line)
  return Math.round(R * c * 1.18);
};

// Format time string "HH:MM" + minutes into new "HH:MM (+D Day)"
const addMinutesToTime = (timeStr, addedMinutes) => {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = h * 60 + m + Math.round(addedMinutes);
  const days = Math.floor(totalMins / 1440);
  const remMins = totalMins % 1440;
  const newH = Math.floor(remMins / 60);
  const newM = remMins % 60;
  const formatted = `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  if (days === 1) return `${formatted} (+1 Day)`;
  if (days >= 2) return `${formatted} (+${days} Days)`;
  return formatted;
};

// Format duration minutes into "Xh Ym"
const formatDuration = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

// =========================================================================
// 2. ALGORITHMIC WAYPOINT GENERATOR (GEOGRAPHIC TRAJECTORY CORRIDOR)
// =========================================================================
const calculateIntermediateWaypoints = (source, dest, allStations, minStops = 5, maxStops = 14) => {
  const dLat = dest.lat - source.lat;
  const dLng = dest.lng - source.lng;
  const lenSq = dLat * dLat + dLng * dLng;

  if (lenSq === 0) return [];

  const candidates = [];

  for (const stn of allStations) {
    if (stn.code === source.code || stn.code === dest.code) continue;

    // Vector projection parameter t of stn on the line segment source -> dest
    const t = ((stn.lat - source.lat) * dLat + (stn.lng - source.lng) * dLng) / lenSq;

    // Must lie along the journey trajectory between source and destination (0.04 to 0.96)
    if (t >= 0.04 && t <= 0.96) {
      // Calculate projected point on straight line
      const projLat = source.lat + t * dLat;
      const projLng = source.lng + t * dLng;

      // Perpendicular cross-track deviation distance in km
      const perpDist = haversineKm(stn.lat, stn.lng, projLat, projLng);

      // Max allowable corridor width (up to 240km for trunk cross-country, 120km for short)
      const maxCorridorKm = Math.min(260, Math.max(90, haversineKm(source.lat, source.lng, dest.lat, dest.lng) * 0.22));

      if (perpDist <= maxCorridorKm) {
        // Preference score for Category A1 and A junction stations
        const categoryWeight = stn.category === 'A1' ? 3 : stn.category === 'A' ? 2 : 1;
        candidates.push({
          station: stn,
          t,
          perpDist,
          score: categoryWeight * 100 - perpDist,
        });
      }
    }
  }

  // Sort strictly by projection parameter t ascending (guarantees no zigzagging!)
  candidates.sort((a, b) => a.t - b.t);

  // If we have more than maxStops, filter down prioritizing hub stations and uniform spacing
  let selected = candidates;
  const targetCount = Math.min(maxStops, Math.max(minStops, Math.min(candidates.length, Math.floor(Math.random() * 6) + 6)));

  if (candidates.length > targetCount) {
    const step = candidates.length / targetCount;
    selected = [];
    for (let i = 0; i < targetCount; i++) {
      const idx = Math.min(candidates.length - 1, Math.floor(i * step));
      selected.push(candidates[idx]);
    }
  }

  // Fallback: If geographic corridor had too few stations (e.g. coastal or extreme north), pad with nearest
  if (selected.length < minStops) {
    const remainingNeeded = minStops - selected.length;
    const existingCodes = new Set([source.code, dest.code, ...selected.map((s) => s.station.code)]);
    const fallbackCandidates = allStations
      .filter((s) => !existingCodes.has(s.code))
      .map((s) => {
        const d1 = haversineKm(source.lat, source.lng, s.lat, s.lng);
        const d2 = haversineKm(dest.lat, dest.lng, s.lat, s.lng);
        return {
          station: s,
          totalDist: d1 + d2,
          t: d1 / (d1 + d2),
        };
      })
      .sort((a, b) => a.totalDist - b.totalDist)
      .slice(0, remainingNeeded);

    selected = [...selected, ...fallbackCandidates].sort((a, b) => a.t - b.t);
  }

  return selected.map((item) => item.station);
};

// =========================================================================
// 3. FARE RULES & COACH BUILDERS
// =========================================================================
const FARE_RULES_DATA = [
  { trainType: 'Vande Bharat', className: 'CC', baseRatePerKm: 1.45, minBaseFare: 420, reservationCharge: 40, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Vande Bharat', className: 'EC', baseRatePerKm: 2.85, minBaseFare: 860, reservationCharge: 60, superfastCharge: 75, gstPercent: 5 },
  { trainType: 'Tejas Express', className: 'CC', baseRatePerKm: 1.50, minBaseFare: 450, reservationCharge: 40, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Tejas Express', className: 'EC', baseRatePerKm: 2.90, minBaseFare: 900, reservationCharge: 60, superfastCharge: 75, gstPercent: 5 },
  { trainType: 'Rajdhani', className: '1A', baseRatePerKm: 3.10, minBaseFare: 1450, reservationCharge: 60, superfastCharge: 75, gstPercent: 5 },
  { trainType: 'Rajdhani', className: '2A', baseRatePerKm: 1.95, minBaseFare: 950, reservationCharge: 50, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Rajdhani', className: '3A', baseRatePerKm: 1.35, minBaseFare: 650, reservationCharge: 40, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Rajdhani', className: '3E', baseRatePerKm: 1.20, minBaseFare: 580, reservationCharge: 40, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Shatabdi', className: 'CC', baseRatePerKm: 1.40, minBaseFare: 380, reservationCharge: 40, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Shatabdi', className: 'EC', baseRatePerKm: 2.70, minBaseFare: 780, reservationCharge: 60, superfastCharge: 75, gstPercent: 5 },
  { trainType: 'Duronto', className: '1A', baseRatePerKm: 3.00, minBaseFare: 1350, reservationCharge: 60, superfastCharge: 75, gstPercent: 5 },
  { trainType: 'Duronto', className: '2A', baseRatePerKm: 1.85, minBaseFare: 900, reservationCharge: 50, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Duronto', className: '3A', baseRatePerKm: 1.30, minBaseFare: 620, reservationCharge: 40, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Duronto', className: 'SL', baseRatePerKm: 0.48, minBaseFare: 220, reservationCharge: 20, superfastCharge: 30, gstPercent: 0 },
  { trainType: 'Garib Rath', className: '3A', baseRatePerKm: 0.85, minBaseFare: 420, reservationCharge: 40, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Garib Rath', className: 'CC', baseRatePerKm: 0.90, minBaseFare: 450, reservationCharge: 40, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Superfast Express', className: '1A', baseRatePerKm: 2.75, minBaseFare: 1200, reservationCharge: 60, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Superfast Express', className: '2A', baseRatePerKm: 1.65, minBaseFare: 750, reservationCharge: 50, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Superfast Express', className: '3A', baseRatePerKm: 1.15, minBaseFare: 520, reservationCharge: 40, superfastCharge: 45, gstPercent: 5 },
  { trainType: 'Superfast Express', className: 'SL', baseRatePerKm: 0.42, minBaseFare: 180, reservationCharge: 20, superfastCharge: 30, gstPercent: 0 },
  { trainType: 'Superfast Express', className: '2S', baseRatePerKm: 0.24, minBaseFare: 110, reservationCharge: 15, superfastCharge: 15, gstPercent: 0 },
  { trainType: 'Mail Express', className: '2A', baseRatePerKm: 1.50, minBaseFare: 650, reservationCharge: 50, superfastCharge: 0, gstPercent: 5 },
  { trainType: 'Mail Express', className: '3A', baseRatePerKm: 1.05, minBaseFare: 450, reservationCharge: 40, superfastCharge: 0, gstPercent: 5 },
  { trainType: 'Mail Express', className: 'SL', baseRatePerKm: 0.38, minBaseFare: 150, reservationCharge: 20, superfastCharge: 0, gstPercent: 0 },
  { trainType: 'Mail Express', className: '2S', baseRatePerKm: 0.22, minBaseFare: 95, reservationCharge: 15, superfastCharge: 0, gstPercent: 0 },
];

const calculateFare = (trainType, className, distanceKm, isTatkal = false) => {
  const rule =
    FARE_RULES_DATA.find((r) => r.trainType === trainType && r.className === className) ||
    FARE_RULES_DATA.find((r) => r.className === className) || {
      baseRatePerKm: 0.45,
      minBaseFare: 200,
      reservationCharge: 40,
      superfastCharge: 45,
      gstPercent: 5,
    };

  const effDist = Math.max(distanceKm || 350, 50);
  const baseFare = Math.round(Math.max(rule.minBaseFare, effDist * rule.baseRatePerKm));
  const resCharge = rule.reservationCharge;
  const sfCharge = rule.superfastCharge;
  const tatkalCharge = isTatkal ? Math.round(baseFare * 0.3) : 0;
  const subtotal = baseFare + resCharge + sfCharge + tatkalCharge;
  const gst = Math.round(subtotal * (rule.gstPercent / 100));

  return {
    baseFare,
    reservationCharge: resCharge,
    superfastCharge: sfCharge,
    tatkalCharge,
    gst,
    totalFare: subtotal + gst,
  };
};

const generateCoaches = (classes, trainType, distanceKm) => {
  const coaches = [];

  classes.forEach((cls) => {
    const coachPrefix = {
      '1A': 'H',
      '2A': 'A',
      '3A': 'B',
      '3E': 'M',
      'CC': 'C',
      'EC': 'E',
      'SL': 'S',
      '2S': 'D',
    }[cls.className] || 'C';

    const numCoaches = cls.className === 'SL' || cls.className === '3A' ? 2 : 1;

    for (let cIdx = 1; cIdx <= numCoaches; cIdx++) {
      const coachNumber = `${coachPrefix}${cIdx}`;
      const seatCapacity = cls.className === '1A' ? 18 : cls.className === '2A' ? 24 : 32;
      const seatTypes =
        cls.className === 'CC' || cls.className === 'EC' || cls.className === '2S'
          ? ['WINDOW', 'AISLE', 'MIDDLE', 'AISLE', 'WINDOW']
          : ['LOWER', 'MIDDLE', 'UPPER', 'LOWER', 'MIDDLE', 'UPPER', 'SIDE LOWER', 'SIDE UPPER'];

      const fareInfo = calculateFare(trainType, cls.className, distanceKm);
      const seats = [];

      for (let sIdx = 1; sIdx <= seatCapacity; sIdx++) {
        const isBooked = Math.random() < 0.28;
        const isRac = !isBooked && Math.random() < 0.12;
        let status = 'AVAILABLE';
        if (isBooked) status = 'BOOKED';
        else if (isRac) status = 'RAC';

        seats.push({
          seatNumber: `${coachNumber}-${sIdx < 10 ? '0' + sIdx : sIdx}`,
          seatType: seatTypes[(sIdx - 1) % seatTypes.length],
          status,
          isBooked,
          quota: sIdx > 26 ? 'TQ' : sIdx % 5 === 0 ? 'LD' : 'GN',
          fare: fareInfo.totalFare,
        });
      }

      coaches.push({
        coachNumber,
        coachType: cls.className,
        seats,
      });
    }
  });

  return coaches;
};

// =========================================================================
// 4. PROCEDURAL ROUTE & TRAIN GENERATOR ENGINE (500+ TRAINS)
// =========================================================================
const TRAIN_TYPES = [
  { name: 'Vande Bharat', speed: 105, pantry: true, classes: ['CC', 'EC'], prefix: '20' },
  { name: 'Rajdhani', speed: 88, pantry: true, classes: ['1A', '2A', '3A', '3E'], prefix: '12' },
  { name: 'Shatabdi', speed: 82, pantry: true, classes: ['CC', 'EC'], prefix: '12' },
  { name: 'Duronto', speed: 85, pantry: true, classes: ['1A', '2A', '3A', 'SL'], prefix: '12' },
  { name: 'Tejas Express', speed: 88, pantry: true, classes: ['CC', 'EC'], prefix: '22' },
  { name: 'Garib Rath', speed: 76, pantry: true, classes: ['3A', 'CC'], prefix: '12' },
  { name: 'Superfast Express', speed: 74, pantry: true, classes: ['1A', '2A', '3A', 'SL', '2S'], prefix: '12' },
  { name: 'Mail Express', speed: 58, pantry: true, classes: ['2A', '3A', 'SL', '2S'], prefix: '11' },
];

const DEPARTURE_SLOTS = [
  '05:30', '06:00', '06:15', '06:45', '07:15', '08:00', '08:30', '09:15',
  '11:00', '12:30', '13:45', '14:20', '15:10', '16:00', '16:45', '17:30',
  '18:15', '19:00', '19:45', '20:30', '21:15', '22:00', '22:45', '23:30',
];

const CANONICAL_CORRIDORS = [
  // 1. New Delhi <-> Varanasi
  { trainNumber: '22436', name: 'New Delhi - Varanasi Vande Bharat Express', type: 'Vande Bharat', src: 'NDLS', dest: 'BSB', dep: '06:00', arr: '14:00' },
  { trainNumber: '22435', name: 'Varanasi - New Delhi Vande Bharat Express', type: 'Vande Bharat', src: 'BSB', dest: 'NDLS', dep: '15:00', arr: '23:00' },
  { trainNumber: '12392', name: 'New Delhi - Patna Shramjeevi Express', type: 'Superfast Express', src: 'NDLS', dest: 'PNBE', dep: '13:10', arr: '07:15 (+1 Day)' },
  // 2. New Delhi <-> Mumbai
  { trainNumber: '12952', name: 'New Delhi - Mumbai Central Tejas Rajdhani', type: 'Rajdhani', src: 'NDLS', dest: 'MMCT', dep: '16:55', arr: '08:35 (+1 Day)' },
  { trainNumber: '12951', name: 'Mumbai Central - New Delhi Tejas Rajdhani', type: 'Rajdhani', src: 'MMCT', dest: 'NDLS', dep: '17:00', arr: '08:32 (+1 Day)' },
  { trainNumber: '12953', name: 'Mumbai Central - Hazrat Nizamuddin August Kranti Rajdhani', type: 'Rajdhani', src: 'MMCT', dest: 'NZM', dep: '17:10', arr: '10:55 (+1 Day)', stops: ['ST', 'BRC', 'KOTA'] },
  { trainNumber: '12954', name: 'Hazrat Nizamuddin - Mumbai Central August Kranti Rajdhani', type: 'Rajdhani', src: 'NZM', dest: 'MMCT', dep: '17:15', arr: '10:05 (+1 Day)', stops: ['KOTA', 'BRC', 'ST'] },
  { trainNumber: '12137', name: 'Mumbai CSMT - Firozpur Punjab Mail', type: 'Mail Express', src: 'CSMT', dest: 'NDLS', dep: '19:35', arr: '21:30 (+1 Day)', stops: ['DR', 'TNA', 'KYN', 'IGP', 'NK', 'MMR', 'JL', 'BSL', 'BPL', 'AGC'] },
  { trainNumber: '12138', name: 'New Delhi - Mumbai CSMT Punjab Mail', type: 'Mail Express', src: 'NDLS', dest: 'CSMT', dep: '05:10', arr: '07:35 (+1 Day)', stops: ['AGC', 'BPL', 'BSL', 'JL', 'MMR', 'NK', 'IGP', 'KYN', 'TNA', 'DR'] },
  { trainNumber: '12910', name: 'New Delhi - Mumbai Central Garib Rath Express', type: 'Garib Rath', src: 'NZM', dest: 'BDTS', dep: '15:35', arr: '07:35 (+1 Day)' },
  // 3. New Delhi <-> Howrah / Kolkata
  { trainNumber: '12302', name: 'New Delhi - Howrah Rajdhani Express', type: 'Rajdhani', src: 'NDLS', dest: 'HWH', dep: '16:50', arr: '09:55 (+1 Day)' },
  { trainNumber: '12301', name: 'Howrah - New Delhi Rajdhani Express', type: 'Rajdhani', src: 'HWH', dest: 'NDLS', dep: '16:50', arr: '10:05 (+1 Day)' },
  { trainNumber: '12260', name: 'New Delhi - Sealdah AC Duronto Express', type: 'Duronto', src: 'NDLS', dest: 'SDAH', dep: '19:45', arr: '12:45 (+1 Day)' },
  // 4. Mumbai <-> Ahmedabad & Western Trunk
  { trainNumber: '20901', name: 'Mumbai Central - Ahmedabad Vande Bharat Express', type: 'Vande Bharat', src: 'MMCT', dest: 'ADI', dep: '06:10', arr: '11:25', stops: ['BSR', 'ST', 'BRC', 'ANND'] },
  { trainNumber: '20902', name: 'Ahmedabad - Mumbai Central Vande Bharat Express', type: 'Vande Bharat', src: 'ADI', dest: 'MMCT', dep: '15:00', arr: '20:25', stops: ['ANND', 'BRC', 'ST', 'BSR'] },
  { trainNumber: '12971', name: 'Bandra Terminus - Bhavnagar Express', type: 'Superfast Express', src: 'BDTS', dest: 'ADI', dep: '19:10', arr: '04:15 (+1 Day)', stops: ['BSR', 'ST', 'BRC', 'ANND'] },
  // 5. Chennai <-> Bengaluru
  { trainNumber: '20607', name: 'MGR Chennai Central - KSR Bengaluru Vande Bharat', type: 'Vande Bharat', src: 'MAS', dest: 'SBC', dep: '05:50', arr: '10:10' },
  { trainNumber: '20608', name: 'KSR Bengaluru - MGR Chennai Central Vande Bharat', type: 'Vande Bharat', src: 'SBC', dest: 'MAS', dep: '14:20', arr: '18:45' },
  // 6. Mumbai <-> Nagpur & Vidarbha Trunk
  { trainNumber: '12289', name: 'Mumbai CSMT - Nagpur Duronto Express', type: 'Duronto', src: 'CSMT', dest: 'NGP', dep: '20:15', arr: '07:20 (+1 Day)', stops: ['IGP', 'BSL'] },
  { trainNumber: '12290', name: 'Nagpur - Mumbai CSMT Duronto Express', type: 'Duronto', src: 'NGP', dest: 'CSMT', dep: '20:40', arr: '08:05 (+1 Day)', stops: ['BSL', 'IGP'] },
  { trainNumber: '12139', name: 'Mumbai CSMT - Nagpur Sewagram Superfast Express', type: 'Superfast Express', src: 'CSMT', dest: 'NGP', dep: '15:00', arr: '05:40 (+1 Day)', stops: ['DR', 'TNA', 'KYN', 'IGP', 'NK', 'MMR', 'CSN', 'JL', 'BSL'] },
  { trainNumber: '12140', name: 'Nagpur - Mumbai CSMT Sewagram Superfast Express', type: 'Superfast Express', src: 'NGP', dest: 'CSMT', dep: '21:15', arr: '12:00 (+1 Day)', stops: ['BSL', 'JL', 'CSN', 'MMR', 'NK', 'IGP', 'KYN', 'TNA', 'DR'] },
  { trainNumber: '12859', name: 'Mumbai CSMT - Howrah Gitanjali Superfast Express', type: 'Superfast Express', src: 'CSMT', dest: 'HWH', dep: '06:00', arr: '12:30 (+1 Day)', stops: ['DR', 'KYN', 'NK', 'JL', 'BSL', 'NGP'] },
  { trainNumber: '12860', name: 'Howrah - Mumbai CSMT Gitanjali Superfast Express', type: 'Superfast Express', src: 'HWH', dest: 'CSMT', dep: '14:05', arr: '21:20 (+1 Day)', stops: ['NGP', 'BSL', 'JL', 'NK', 'KYN', 'DR'] },
  // 7. Mumbai <-> Pune <-> Solapur (CR Golden Corridors)
  { trainNumber: '22225', name: 'Mumbai CSMT - Solapur Vande Bharat Express', type: 'Vande Bharat', src: 'CSMT', dest: 'SUR', dep: '16:05', arr: '22:40', stops: ['DR', 'TNA', 'KYN', 'PUNE', 'DD'] },
  { trainNumber: '22226', name: 'Solapur - Mumbai CSMT Vande Bharat Express', type: 'Vande Bharat', src: 'SUR', dest: 'CSMT', dep: '06:05', arr: '12:35', stops: ['DD', 'PUNE', 'KYN', 'TNA', 'DR'] },
  { trainNumber: '12115', name: 'Mumbai CSMT - Solapur Siddheshwar Express', type: 'Superfast Express', src: 'CSMT', dest: 'SUR', dep: '22:45', arr: '06:45 (+1 Day)', stops: ['DR', 'TNA', 'KYN', 'PUNE', 'DD'] },
  { trainNumber: '12116', name: 'Solapur - Mumbai CSMT Siddheshwar Express', type: 'Superfast Express', src: 'SUR', dest: 'CSMT', dep: '22:30', arr: '06:50 (+1 Day)', stops: ['DD', 'PUNE', 'KYN', 'TNA', 'DR'] },
  { trainNumber: '12123', name: 'Mumbai CSMT - Pune Deccan Queen Superfast Express', type: 'Superfast Express', src: 'CSMT', dest: 'PUNE', dep: '17:10', arr: '20:25', stops: ['KYN'] },
  { trainNumber: '12124', name: 'Pune - Mumbai CSMT Deccan Queen Superfast Express', type: 'Superfast Express', src: 'PUNE', dest: 'CSMT', dep: '07:15', arr: '10:25', stops: ['KYN', 'DR'] },
  { trainNumber: '12127', name: 'Mumbai CSMT - Pune Intercity Superfast Express', type: 'Superfast Express', src: 'CSMT', dest: 'PUNE', dep: '06:40', arr: '09:57', stops: ['DR', 'TNA'] },
  { trainNumber: '12128', name: 'Pune - Mumbai CSMT Intercity Superfast Express', type: 'Superfast Express', src: 'PUNE', dest: 'CSMT', dep: '17:55', arr: '21:05', stops: ['TNA', 'DR'] },
  { trainNumber: '11019', name: 'Mumbai CSMT - Bhubaneswar Konark Express', type: 'Superfast Express', src: 'CSMT', dest: 'SC', dep: '14:00', arr: '07:40 (+1 Day)', stops: ['DR', 'TNA', 'KYN', 'PUNE', 'DD', 'SUR'] },
  // 8. Mumbai <-> Shirdi & Nashik
  { trainNumber: '22223', name: 'Mumbai CSMT - Sainagar Shirdi Vande Bharat Express', type: 'Vande Bharat', src: 'CSMT', dest: 'MMR', dep: '06:20', arr: '11:40', stops: ['DR', 'TNA', 'KYN', 'IGP', 'NK'] },
  { trainNumber: '22224', name: 'Sainagar Shirdi - Mumbai CSMT Vande Bharat Express', type: 'Vande Bharat', src: 'MMR', dest: 'CSMT', dep: '17:45', arr: '22:50', stops: ['NK', 'IGP', 'KYN', 'TNA', 'DR'] },
  // 9. Mumbai <-> Kolhapur
  { trainNumber: '11029', name: 'Mumbai CSMT - Kolhapur Koyna Express', type: 'Mail Express', src: 'CSMT', dest: 'KOP', dep: '08:40', arr: '20:10', stops: ['DR', 'TNA', 'KYN', 'PUNE', 'MRJ'] },
  { trainNumber: '11030', name: 'Kolhapur - Mumbai CSMT Koyna Express', type: 'Mail Express', src: 'KOP', dest: 'CSMT', dep: '08:15', arr: '20:05', stops: ['MRJ', 'PUNE', 'KYN', 'TNA', 'DR'] },
  // 10. Mumbai <-> Goa (Konkan Corridor)
  { trainNumber: '22229', name: 'Mumbai CSMT - Madgaon Vande Bharat Express', type: 'Vande Bharat', src: 'CSMT', dest: 'MAO', dep: '05:25', arr: '13:10', stops: ['DR', 'TNA', 'PNVL'] },
  { trainNumber: '22230', name: 'Madgaon - Mumbai CSMT Vande Bharat Express', type: 'Vande Bharat', src: 'MAO', dest: 'CSMT', dep: '14:40', arr: '22:25', stops: ['PNVL', 'TNA', 'DR'] },
  { trainNumber: '12051', name: 'Mumbai CSMT - Madgaon Jan Shatabdi Express', type: 'Shatabdi', src: 'CSMT', dest: 'MAO', dep: '05:10', arr: '14:10', stops: ['DR', 'TNA', 'PNVL'] },
  { trainNumber: '12052', name: 'Madgaon - Mumbai CSMT Jan Shatabdi Express', type: 'Shatabdi', src: 'MAO', dest: 'CSMT', dep: '14:40', arr: '23:15', stops: ['PNVL', 'TNA', 'DR'] },
  // 11. New Delhi <-> Bhopal / Lucknow
  { trainNumber: '12002', name: 'New Delhi - Rani Kamlapati (Bhopal) Shatabdi Express', type: 'Shatabdi', src: 'NDLS', dest: 'BPL', dep: '06:00', arr: '14:40' },
  { trainNumber: '12001', name: 'Bhopal - New Delhi Shatabdi Express', type: 'Shatabdi', src: 'BPL', dest: 'NDLS', dep: '15:15', arr: '23:50' },
  { trainNumber: '12004', name: 'New Delhi - Lucknow Swarna Shatabdi Express', type: 'Shatabdi', src: 'NDLS', dest: 'LKO', dep: '06:10', arr: '12:40' },
  { trainNumber: '12003', name: 'Lucknow - New Delhi Swarna Shatabdi Express', type: 'Shatabdi', src: 'LKO', dest: 'NDLS', dep: '15:30', arr: '22:15' },
  // 16. Delhi <-> Amritsar (Punjab Express Corridors)
  { trainNumber: '12013', name: 'New Delhi - Amritsar Shatabdi Express', type: 'Shatabdi', src: 'NDLS', dest: 'ASR', dep: '16:30', arr: '22:45', stops: ['UMB', 'LDH'] },
  { trainNumber: '12014', name: 'Amritsar - New Delhi Shatabdi Express', type: 'Shatabdi', src: 'ASR', dest: 'NDLS', dep: '05:00', arr: '11:15', stops: ['LDH', 'UMB'] },
  { trainNumber: '22487', name: 'New Delhi - Amritsar Vande Bharat Express', type: 'Vande Bharat', src: 'NDLS', dest: 'ASR', dep: '15:15', arr: '20:45', stops: ['UMB', 'LDH'] },
  { trainNumber: '22488', name: 'Amritsar - New Delhi Vande Bharat Express', type: 'Vande Bharat', src: 'ASR', dest: 'NDLS', dep: '08:20', arr: '13:50', stops: ['LDH', 'UMB'] },
  // 17. Delhi <-> Jammu / Katra
  { trainNumber: '22439', name: 'New Delhi - Shri Mata Vaishno Devi Katra Vande Bharat', type: 'Vande Bharat', src: 'NDLS', dest: 'SVDK', dep: '06:00', arr: '14:00', stops: ['UMB', 'LDH', 'JAT'] },
  { trainNumber: '22440', name: 'Shri Mata Vaishno Devi Katra - New Delhi Vande Bharat', type: 'Vande Bharat', src: 'SVDK', dest: 'NDLS', dep: '15:00', arr: '23:00', stops: ['JAT', 'LDH', 'UMB'] },
  { trainNumber: '12425', name: 'New Delhi - Jammu Tawi Rajdhani Express', type: 'Rajdhani', src: 'NDLS', dest: 'JAT', dep: '20:40', arr: '05:00 (+1 Day)', stops: ['LDH'] },
  { trainNumber: '12426', name: 'Jammu Tawi - New Delhi Rajdhani Express', type: 'Rajdhani', src: 'JAT', dest: 'NDLS', dep: '21:25', arr: '05:55 (+1 Day)', stops: ['LDH'] },
  // 18. Delhi <-> Chandigarh
  { trainNumber: '12005', name: 'New Delhi - Kalka Shatabdi Express', type: 'Shatabdi', src: 'NDLS', dest: 'CDG', dep: '17:15', arr: '20:30', stops: ['UMB'] },
  { trainNumber: '12006', name: 'Kalka - New Delhi Shatabdi Express', type: 'Shatabdi', src: 'CDG', dest: 'NDLS', dep: '06:50', arr: '10:15', stops: ['UMB'] },
  { trainNumber: '22447', name: 'New Delhi - Amb Andaura Vande Bharat', type: 'Vande Bharat', src: 'NDLS', dest: 'CDG', dep: '05:50', arr: '08:40', stops: ['UMB'] },
  { trainNumber: '22448', name: 'Amb Andaura - New Delhi Vande Bharat', type: 'Vande Bharat', src: 'CDG', dest: 'NDLS', dep: '15:30', arr: '18:25', stops: ['UMB'] },
  // 19. Delhi <-> Jaipur & Rajasthan
  { trainNumber: '20977', name: 'New Delhi - Ajmer Vande Bharat Express', type: 'Vande Bharat', src: 'NDLS', dest: 'AII', dep: '06:20', arr: '11:35', stops: ['JP'] },
  { trainNumber: '20978', name: 'Ajmer - New Delhi Vande Bharat Express', type: 'Vande Bharat', src: 'AII', dest: 'NDLS', dep: '15:45', arr: '21:15', stops: ['JP'] },
  { trainNumber: '12015', name: 'New Delhi - Ajmer Shatabdi Express', type: 'Shatabdi', src: 'NDLS', dest: 'AII', dep: '06:10', arr: '12:55', stops: ['JP'] },
  { trainNumber: '12016', name: 'Ajmer - New Delhi Shatabdi Express', type: 'Shatabdi', src: 'AII', dest: 'NDLS', dep: '15:55', arr: '22:40', stops: ['JP'] },
  { trainNumber: '12986', name: 'Delhi Sarai Rohilla - Jaipur Double Decker', type: 'Superfast Express', src: 'DEE', dest: 'JP', dep: '17:35', arr: '22:05' },
  { trainNumber: '12985', name: 'Jaipur - Delhi Sarai Rohilla Double Decker', type: 'Superfast Express', src: 'JP', dest: 'DEE', dep: '06:00', arr: '10:25' },
  // 20. Mumbai <-> Jaipur
  { trainNumber: '12955', name: 'Mumbai Central - Jaipur Superfast Express', type: 'Superfast Express', src: 'MMCT', dest: 'JP', dep: '19:05', arr: '12:45 (+1 Day)', stops: ['ST', 'BRC', 'RTM', 'KOTA'] },
  { trainNumber: '12956', name: 'Jaipur - Mumbai Central Superfast Express', type: 'Superfast Express', src: 'JP', dest: 'MMCT', dep: '14:00', arr: '07:20 (+1 Day)', stops: ['KOTA', 'RTM', 'BRC', 'ST'] },
  { trainNumber: '12979', name: 'Bandra Terminus - Jaipur Superfast Express', type: 'Superfast Express', src: 'BDTS', dest: 'JP', dep: '17:05', arr: '10:30 (+1 Day)', stops: ['ST', 'BRC', 'RTM', 'KOTA'] },
  { trainNumber: '12980', name: 'Jaipur - Bandra Terminus Superfast Express', type: 'Superfast Express', src: 'JP', dest: 'BDTS', dep: '20:25', arr: '14:10 (+1 Day)', stops: ['KOTA', 'RTM', 'BRC', 'ST'] },
  // 21. Bengaluru <-> Goa
  { trainNumber: '20671', name: 'KSR Bengaluru - Madgaon Vande Bharat Express', type: 'Vande Bharat', src: 'SBC', dest: 'MAO', dep: '05:45', arr: '13:30', stops: ['UBL', 'BGM'] },
  { trainNumber: '20672', name: 'Madgaon - KSR Bengaluru Vande Bharat Express', type: 'Vande Bharat', src: 'MAO', dest: 'SBC', dep: '14:30', arr: '22:10', stops: ['BGM', 'UBL'] },
  { trainNumber: '17309', name: 'Yesvantpur - Vasco da Gama Express', type: 'Mail Express', src: 'YPR', dest: 'MAO', dep: '15:00', arr: '05:00 (+1 Day)', stops: ['UBL', 'BGM'] },
  { trainNumber: '17310', name: 'Vasco da Gama - Yesvantpur Express', type: 'Mail Express', src: 'MAO', dest: 'YPR', dep: '22:55', arr: '12:30 (+1 Day)', stops: ['BGM', 'UBL'] },
  // 22. Bengaluru <-> Hyderabad
  { trainNumber: '20703', name: 'Kacheguda - Yesvantpur Vande Bharat', type: 'Vande Bharat', src: 'SC', dest: 'YPR', dep: '05:45', arr: '14:00' },
  { trainNumber: '20704', name: 'Yesvantpur - Kacheguda Vande Bharat', type: 'Vande Bharat', src: 'YPR', dest: 'SC', dep: '14:45', arr: '23:00' },
  { trainNumber: '12785', name: 'Kacheguda - Mysuru Superfast', type: 'Superfast Express', src: 'SC', dest: 'SBC', dep: '19:05', arr: '06:25 (+1 Day)' },
  { trainNumber: '12786', name: 'Mysuru - Kacheguda Superfast', type: 'Superfast Express', src: 'SBC', dest: 'SC', dep: '18:20', arr: '05:40 (+1 Day)' },
  // 23. Bengaluru <-> Kolkata
  { trainNumber: '12245', name: 'Howrah - Yesvantpur Duronto Express', type: 'Duronto', src: 'HWH', dest: 'YPR', dep: '10:50', arr: '16:00 (+1 Day)', stops: ['BBS', 'VSKP', 'BZA'] },
  { trainNumber: '12246', name: 'Yesvantpur - Howrah Duronto Express', type: 'Duronto', src: 'YPR', dest: 'HWH', dep: '11:15', arr: '16:15 (+1 Day)', stops: ['BZA', 'VSKP', 'BBS'] },
  // 24. Chennai <-> Hyderabad
  { trainNumber: '12603', name: 'MGR Chennai Central - Hyderabad Superfast', type: 'Superfast Express', src: 'MAS', dest: 'HYB', dep: '16:45', arr: '05:45 (+1 Day)', stops: ['BZA', 'SC'] },
  { trainNumber: '12604', name: 'Hyderabad - MGR Chennai Central Superfast', type: 'Superfast Express', src: 'HYB', dest: 'MAS', dep: '16:55', arr: '05:55 (+1 Day)', stops: ['SC', 'BZA'] },
  // 25. Chennai <-> Coimbatore
  { trainNumber: '20643', name: 'MGR Chennai Central - Coimbatore Vande Bharat', type: 'Vande Bharat', src: 'MAS', dest: 'CBE', dep: '14:15', arr: '20:15', stops: ['SA'] },
  { trainNumber: '20644', name: 'Coimbatore - MGR Chennai Central Vande Bharat', type: 'Vande Bharat', src: 'CBE', dest: 'MAS', dep: '06:00', arr: '11:50', stops: ['SA'] },
  // 26. Kolkata <-> Patna
  { trainNumber: '22348', name: 'Howrah - Patna Vande Bharat Express', type: 'Vande Bharat', src: 'HWH', dest: 'PNBE', dep: '15:50', arr: '22:20', stops: ['ASN'] },
  { trainNumber: '22347', name: 'Patna - Howrah Vande Bharat Express', type: 'Vande Bharat', src: 'PNBE', dest: 'HWH', dep: '08:00', arr: '14:35', stops: ['ASN'] },
  // 27. Kolkata <-> Puri
  { trainNumber: '22895', name: 'Howrah - Puri Vande Bharat Express', type: 'Vande Bharat', src: 'HWH', dest: 'PURI', dep: '06:10', arr: '12:35', stops: ['KGP', 'BBS'] },
  { trainNumber: '22896', name: 'Puri - Howrah Vande Bharat Express', type: 'Vande Bharat', src: 'PURI', dest: 'HWH', dep: '13:50', arr: '20:30', stops: ['BBS', 'KGP'] },
  // 28. Kolkata <-> Guwahati
  { trainNumber: '12345', name: 'Howrah - Guwahati Saraighat Express', type: 'Superfast Express', src: 'HWH', dest: 'GHY', dep: '15:55', arr: '09:45 (+1 Day)', stops: ['MLDT', 'NJP'] },
  { trainNumber: '12346', name: 'Guwahati - Howrah Saraighat Express', type: 'Superfast Express', src: 'GHY', dest: 'HWH', dep: '12:20', arr: '05:15 (+1 Day)', stops: ['NJP', 'MLDT'] },
  // 29. Delhi <-> Dehradun
  { trainNumber: '22457', name: 'Anand Vihar - Dehradun Vande Bharat', type: 'Vande Bharat', src: 'ANVT', dest: 'DDN', dep: '17:50', arr: '22:35', stops: ['HW'] },
  { trainNumber: '22458', name: 'Dehradun - Anand Vihar Vande Bharat', type: 'Vande Bharat', src: 'DDN', dest: 'ANVT', dep: '07:00', arr: '11:45', stops: ['HW'] },
  // 30. Mumbai <-> Indore
  { trainNumber: '12961', name: 'Mumbai Central - Indore Avantika Express', type: 'Superfast Express', src: 'MMCT', dest: 'INDB', dep: '20:55', arr: '09:10 (+1 Day)', stops: ['ST', 'BRC', 'RTM', 'UJN'] },
  { trainNumber: '12962', name: 'Indore - Mumbai Central Avantika Express', type: 'Superfast Express', src: 'INDB', dest: 'MMCT', dep: '17:40', arr: '06:40 (+1 Day)', stops: ['UJN', 'RTM', 'BRC', 'ST'] },
  // 31. Mumbai <-> Hyderabad
  { trainNumber: '12701', name: 'Mumbai CSMT - Hyderabad Hussainsagar Express', type: 'Superfast Express', src: 'CSMT', dest: 'HYB', dep: '21:50', arr: '12:05 (+1 Day)', stops: ['DR', 'KYN', 'PUNE', 'SUR'] },
  { trainNumber: '12702', name: 'Hyderabad - Mumbai CSMT Hussainsagar Express', type: 'Superfast Express', src: 'HYB', dest: 'CSMT', dep: '14:50', arr: '04:55 (+1 Day)', stops: ['SUR', 'PUNE', 'KYN', 'DR'] },
  // 32. Pan-India Flagship Cross-Country
  { trainNumber: '15906', name: 'Dibrugarh - Kanyakumari Vivek Express', type: 'Superfast Express', src: 'GHY', dest: 'TVC', dep: '23:45', arr: '09:50 (+3 Days)' },
  { trainNumber: '15905', name: 'Kanyakumari - Dibrugarh Vivek Express', type: 'Superfast Express', src: 'TVC', dest: 'GHY', dep: '23:00', arr: '09:05 (+3 Days)' },
  { trainNumber: '12626', name: 'New Delhi - Thiruvananthapuram Kerala Express', type: 'Superfast Express', src: 'NDLS', dest: 'TVC', dep: '20:10', arr: '22:15 (+2 Days)', stops: ['AGC', 'BPL', 'NGP', 'BZA', 'MAS', 'CBE', 'ERS'] },
  { trainNumber: '12625', name: 'Thiruvananthapuram - New Delhi Kerala Express', type: 'Superfast Express', src: 'TVC', dest: 'NDLS', dep: '11:15', arr: '13:40 (+2 Days)', stops: ['ERS', 'CBE', 'MAS', 'BZA', 'NGP', 'BPL', 'AGC'] },
  // 33. Delhi <-> Bengaluru (Karnataka & Rajdhani)
  { trainNumber: '12627', name: 'KSR Bengaluru - New Delhi Karnataka Express', type: 'Superfast Express', src: 'SBC', dest: 'NDLS', dep: '19:20', arr: '09:00 (+2 Days)', stops: ['SUR', 'DD', 'MMR', 'BSL', 'BPL', 'VGLJ', 'AGC'] },
  { trainNumber: '12628', name: 'New Delhi - KSR Bengaluru Karnataka Express', type: 'Superfast Express', src: 'NDLS', dest: 'SBC', dep: '20:20', arr: '12:00 (+2 Days)', stops: ['AGC', 'VGLJ', 'BPL', 'BSL', 'MMR', 'DD', 'SUR'] },
  { trainNumber: '22691', name: 'KSR Bengaluru - Hazrat Nizamuddin Rajdhani Express', type: 'Rajdhani', src: 'SBC', dest: 'NZM', dep: '20:00', arr: '05:30 (+2 Days)', stops: ['SC', 'KZJ', 'NGP', 'BPL', 'VGLJ', 'AGC'] },
  { trainNumber: '22692', name: 'Hazrat Nizamuddin - KSR Bengaluru Rajdhani Express', type: 'Rajdhani', src: 'NZM', dest: 'SBC', dep: '20:45', arr: '06:40 (+2 Days)', stops: ['AGC', 'VGLJ', 'BPL', 'NGP', 'KZJ', 'SC'] },
  // 34. Delhi <-> Chennai (Tamil Nadu Express)
  { trainNumber: '12621', name: 'MGR Chennai Central - New Delhi Tamil Nadu Express', type: 'Superfast Express', src: 'MAS', dest: 'NDLS', dep: '22:00', arr: '06:30 (+2 Days)', stops: ['BZA', 'NGP', 'ET', 'BPL', 'VGLJ', 'AGC'] },
  { trainNumber: '12622', name: 'New Delhi - MGR Chennai Central Tamil Nadu Express', type: 'Superfast Express', src: 'NDLS', dest: 'MAS', dep: '21:05', arr: '06:15 (+2 Days)', stops: ['AGC', 'VGLJ', 'BPL', 'ET', 'NGP', 'BZA'] },
  // 35. Delhi <-> Hyderabad (Telangana Express)
  { trainNumber: '12723', name: 'Hyderabad - New Delhi Telangana Express', type: 'Superfast Express', src: 'HYB', dest: 'NDLS', dep: '06:00', arr: '07:40 (+1 Day)', stops: ['SC', 'KZJ', 'NGP', 'BPL', 'VGLJ', 'AGC'] },
  { trainNumber: '12724', name: 'New Delhi - Hyderabad Telangana Express', type: 'Superfast Express', src: 'NDLS', dest: 'HYB', dep: '16:00', arr: '17:10 (+1 Day)', stops: ['AGC', 'VGLJ', 'BPL', 'NGP', 'KZJ', 'SC'] },
  // 36. Delhi <-> Ahmedabad (Swarna Jayanti Rajdhani)
  { trainNumber: '12957', name: 'Ahmedabad - New Delhi Swarna Jayanti Rajdhani', type: 'Rajdhani', src: 'ADI', dest: 'NDLS', dep: '17:45', arr: '07:30 (+1 Day)', stops: ['AII', 'JP'] },
  { trainNumber: '12958', name: 'New Delhi - Ahmedabad Swarna Jayanti Rajdhani', type: 'Rajdhani', src: 'NDLS', dest: 'ADI', dep: '19:55', arr: '09:30 (+1 Day)', stops: ['JP', 'AII'] },
  // 37. Ahmedabad <-> Bhavnagar
  { trainNumber: '20987', name: 'Ahmedabad - Bhavnagar Intercity Superfast', type: 'Superfast Express', src: 'ADI', dest: 'BVC', dep: '06:15', arr: '11:15' },
  { trainNumber: '20988', name: 'Bhavnagar - Ahmedabad Intercity Superfast', type: 'Superfast Express', src: 'BVC', dest: 'ADI', dep: '16:00', arr: '21:00' },
  // 38. Goa <-> Delhi (Goa Express)
  { trainNumber: '12779', name: 'Madgaon - Hazrat Nizamuddin Goa Express', type: 'Superfast Express', src: 'MAO', dest: 'NZM', dep: '15:00', arr: '06:25 (+2 Days)', stops: ['BGM', 'MRJ', 'PUNE', 'DD', 'MMR', 'BSL', 'ET', 'BPL', 'VGLJ', 'AGC'] },
  { trainNumber: '12780', name: 'Hazrat Nizamuddin - Madgaon Goa Express', type: 'Superfast Express', src: 'NZM', dest: 'MAO', dep: '15:15', arr: '05:45 (+2 Days)', stops: ['AGC', 'VGLJ', 'BPL', 'ET', 'BSL', 'MMR', 'DD', 'PUNE', 'MRJ', 'BGM'] },
  // 39. Bilaspur <-> Nagpur
  { trainNumber: '20825', name: 'Bilaspur - Nagpur Vande Bharat Express', type: 'Vande Bharat', src: 'BSP', dest: 'NGP', dep: '06:45', arr: '12:15', stops: ['R', 'DURG', 'G'] },
  { trainNumber: '20826', name: 'Nagpur - Bilaspur Vande Bharat Express', type: 'Vande Bharat', src: 'NGP', dest: 'BSP', dep: '14:05', arr: '19:35', stops: ['G', 'DURG', 'R'] }
];

const generateTrainNetwork = (allStations, targetTrainCount = 1200) => {
  const generatedTrains = [];
  const generatedSchedules = [];
  const assignedTrainNumbers = new Set();
  const stationByCode = new Map();
  allStations.forEach((s) => stationByCode.set(s.code, s));

  let trainSequence = 101;

  const getUniqueTrainNumber = (prefix) => {
    while (true) {
      const num = `${prefix}${trainSequence.toString().padStart(3, '0')}`;
      trainSequence++;
      if (!assignedTrainNumbers.has(num)) {
        assignedTrainNumbers.add(num);
        return num;
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to construct a train doc + schedule doc
  const buildTrainAndSchedule = (sourceStation, destStation, typeConfig, trainNumber, trainName, departureTime, customStops = null) => {
    let waypoints = [];
    if (customStops && Array.isArray(customStops) && customStops.length > 0) {
      waypoints = customStops
        .map((code) => stationByCode.get(code))
        .filter((stn) => stn && stn.code !== sourceStation.code && stn.code !== destStation.code);
    } else {
      waypoints = calculateIntermediateWaypoints(sourceStation, destStation, allStations, 4, 14);
    }
    let currentDistance = 0;
    let prevStation = sourceStation;
    let accumulatedMins = 0;
    const intermediateStations = [];

    waypoints.forEach((wp, idx) => {
      const legKm = Math.max(35, haversineKm(prevStation.lat, prevStation.lng, wp.lat, wp.lng));
      currentDistance += legKm;
      const travelMins = Math.round((legKm / typeConfig.speed) * 60);
      const arrTime = addMinutesToTime(departureTime, accumulatedMins + travelMins);
      const halt = wp.category === 'A1' ? 8 : wp.category === 'A' ? 5 : 2;
      const depTime = addMinutesToTime(departureTime, accumulatedMins + travelMins + halt);
      accumulatedMins += travelMins + halt;
      prevStation = wp;

      intermediateStations.push({
        stationName: wp.name,
        stationCode: wp.code,
        stopOrder: idx + 1,
        arrivalTime: arrTime,
        departureTime: depTime,
        distanceKm: currentDistance,
        platform: String((idx % 6) + 1),
        lat: wp.lat,
        lng: wp.lng,
        haltMinutes: halt,
      });
    });

    const finalLegKm = Math.max(40, haversineKm(prevStation.lat, prevStation.lng, destStation.lat, destStation.lng));
    currentDistance += finalLegKm;
    const finalTravelMins = Math.round((finalLegKm / typeConfig.speed) * 60);
    accumulatedMins += finalTravelMins;
    const arrivalTime = addMinutesToTime(departureTime, accumulatedMins);

    const trainClasses = typeConfig.classes.map((clsName) => {
      const fareInfo = calculateFare(typeConfig.name, clsName, currentDistance);
      return {
        className: clsName,
        baseFare: fareInfo.baseFare,
        reservationCharge: fareInfo.reservationCharge,
        superfastCharge: fareInfo.superfastCharge,
        totalSeats: clsName === '1A' ? 18 : clsName === '2A' ? 48 : 72,
      };
    });

    const totalSeats = trainClasses.reduce((acc, c) => acc + c.totalSeats, 0);

    const trainDoc = {
      trainNumber,
      name: trainName,
      trainType: typeConfig.name,
      source: {
        stationName: sourceStation.name,
        stationCode: sourceStation.code,
      },
      destination: {
        stationName: destStation.name,
        stationCode: destStation.code,
      },
      departureTime,
      arrivalTime,
      durationHours: formatDuration(accumulatedMins),
      intermediateStations,
      classes: trainClasses,
      totalSeats,
      daysOfRun: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      speedKmH: typeConfig.speed,
      pantryCar: typeConfig.pantry,
      isActive: true,
    };

    const coaches = generateCoaches(trainClasses, typeConfig.name, currentDistance);

    const classAvailability = trainClasses.map((cls, idx) => {
      let status = 'AVAILABLE';
      let avail = Math.floor(Math.random() * 38) + 14;
      let rac = 0;
      let wl = 0;

      if (idx === 2 && Math.random() < 0.3) {
        status = 'RAC';
        rac = 6;
        avail = 0;
      }

      const totalFare = cls.baseFare + cls.reservationCharge + cls.superfastCharge;

      return {
        className: cls.className,
        status,
        availableCount: avail,
        racCount: rac,
        wlCount: wl,
        probability: status === 'AVAILABLE' ? 100 : 85,
        baseFare: cls.baseFare,
        reservationCharge: cls.reservationCharge,
        superfastCharge: cls.superfastCharge,
        tatkalCharge: 0,
        gstPercent: ['1A', '2A', '3A', '3E', 'CC', 'EC'].includes(cls.className) ? 5 : 0,
        totalFare,
      };
    });

    const scheduleDoc = {
      trainNumber,
      date: todayStr,
      departureTime,
      arrivalTime,
      coaches,
      classAvailability,
      availableSeatsCount: classAvailability.reduce((acc, c) => acc + c.availableCount, 0),
      liveTracking: {
        currentLatitude: intermediateStations[0]?.lat || sourceStation.lat,
        currentLongitude: intermediateStations[0]?.lng || sourceStation.lng,
        currentStationName: intermediateStations[0]?.stationName || sourceStation.name,
        nextStationName: intermediateStations[1]?.stationName || destStation.name,
        progressPercentage: 25,
        currentSpeedKmH: typeConfig.speed + 5,
        statusMessage: 'On Schedule',
        lastPing: new Date(),
      },
    };

    return { trainDoc, scheduleDoc };
  };

  // 1. Process CANONICAL FLAGSHIP CORRIDORS First
  for (const c of CANONICAL_CORRIDORS) {
    const srcStn = stationByCode.get(c.src);
    const destStn = stationByCode.get(c.dest);
    if (!srcStn || !destStn) continue;

    const typeConfig = TRAIN_TYPES.find((t) => t.name === c.type) || TRAIN_TYPES[0];
    assignedTrainNumbers.add(c.trainNumber);

    const { trainDoc, scheduleDoc } = buildTrainAndSchedule(
      srcStn,
      destStn,
      typeConfig,
      c.trainNumber,
      c.name,
      c.dep,
      c.stops
    );

    generatedTrains.push(trainDoc);
    generatedSchedules.push(scheduleDoc);
  }

  // 2. Systematic Cross-Zone Mesh Generation across all 18 Indian Railway Divisions
  const regionKeys = Object.keys(STATIONS_BY_REGION);

  for (let r1Idx = 0; r1Idx < regionKeys.length; r1Idx++) {
    for (let r2Idx = 0; r2Idx < regionKeys.length; r2Idx++) {
      if (generatedTrains.length >= targetTrainCount) break;

      const r1 = regionKeys[r1Idx];
      const r2 = regionKeys[r2Idx];
      const list1 = STATIONS_BY_REGION[r1];
      const list2 = STATIONS_BY_REGION[r2];

      const sample1 = list1.filter((s) => s.isHub || s.category === 'A1').concat(list1);
      const sample2 = list2.filter((s) => s.isHub || s.category === 'A1').concat(list2);

      const maxLimit1 = Math.min(sample1.length, 12);
      const maxLimit2 = Math.min(sample2.length, 12);

      for (let i = 0; i < maxLimit1; i++) {
        for (let j = 0; j < maxLimit2; j++) {
          if (generatedTrains.length >= targetTrainCount) break;

          const sourceStation = sample1[i];
          const destStation = sample2[j];
          if (!sourceStation || !destStation || sourceStation.code === destStation.code) continue;

          const crowKm = haversineKm(sourceStation.lat, sourceStation.lng, destStation.lat, destStation.lng);
          if (crowKm < 60) continue; // Allow intercity hops

          let candidateTypes = TRAIN_TYPES;
          if (crowKm < 450) {
            candidateTypes = TRAIN_TYPES.filter((t) => ['Vande Bharat', 'Shatabdi', 'Superfast Express', 'Mail Express'].includes(t.name));
          } else if (crowKm > 1400) {
            candidateTypes = TRAIN_TYPES.filter((t) => ['Rajdhani', 'Duronto', 'Superfast Express', 'Mail Express', 'Garib Rath'].includes(t.name));
          }

          const typeConfig = candidateTypes[Math.floor(Math.random() * candidateTypes.length)] || TRAIN_TYPES[0];
          const trainNumber = getUniqueTrainNumber(typeConfig.prefix);
          const trainName = `${sourceStation.city} - ${destStation.city} ${typeConfig.name}`;
          const departureTime = DEPARTURE_SLOTS[(i * 3 + j * 2) % DEPARTURE_SLOTS.length];

          const forwardPair = buildTrainAndSchedule(
            sourceStation,
            destStation,
            typeConfig,
            trainNumber,
            trainName,
            departureTime
          );

          generatedTrains.push(forwardPair.trainDoc);
          generatedSchedules.push(forwardPair.scheduleDoc);

          // Return Pair Train
          if (generatedTrains.length < targetTrainCount) {
            const returnTrainNumber = getUniqueTrainNumber(typeConfig.prefix);
            const returnTrainName = `${destStation.city} - ${sourceStation.city} ${typeConfig.name}`;
            const returnDepTime = DEPARTURE_SLOTS[(DEPARTURE_SLOTS.indexOf(departureTime) + 12) % DEPARTURE_SLOTS.length];

            const returnPair = buildTrainAndSchedule(
              destStation,
              sourceStation,
              typeConfig,
              returnTrainNumber,
              returnTrainName,
              returnDepTime
            );

            generatedTrains.push(returnPair.trainDoc);
            generatedSchedules.push(returnPair.scheduleDoc);
          }
        }
      }
    }
  }

  return { generatedTrains, generatedSchedules };
};

// =========================================================================
// 5. MASTER SEED EXECUTION WITH BULK INSERTION
// =========================================================================
const seedData = async () => {
  try {
    global.__isSeeding = true;
    await connectDB();

    console.log('\n========================================================');
    console.log('🚀 INITIATING MASSIVE PAN-INDIA RAILWAY SEEDING (18 ZONES)');
    console.log('========================================================\n');

    // Clear existing records
    await Station.deleteMany({});
    await Train.deleteMany({});
    await Schedule.deleteMany({});
    await Booking.deleteMany({});
    await User.deleteMany({});
    await FareRule.deleteMany({});

    console.log('1. Cleared previous collections successfully.');

    // Step A: Seed Stations across all 18 zones
    console.log(`2. Seeding ${MAJOR_STATIONS.length} Major Pan-India & Maharashtra Stations...`);
    const seededStations = await Station.insertMany(MAJOR_STATIONS);
    console.log(`   ✔ ${seededStations.length} Stations inserted covering CR, WR, NR, NCR, NER, NFR, ER, SER, SECR, ECR, ECoR, SR, SWR, SCR, WCR, NWR, KR, MR.`);

    // Step B: Seed Fare Rules
    await FareRule.insertMany(FARE_RULES_DATA);
    console.log(`3. Inserted ${FARE_RULES_DATA.length} IRCTC Fare Rules.`);

    // Step C: Procedurally generate 1200+ Trains with Algorithmic Waypoints
    console.log(`4. Procedurally generating 1200+ Pan-India & Intra-Maharashtra Trains with Algorithmic Waypoints...`);
    const { generatedTrains, generatedSchedules } = generateTrainNetwork(seededStations, 1200);
    console.log(`   ✔ Procedurally generated ${generatedTrains.length} realistic unique trains!`);

    // Step D: Bulk Insert Trains in chunks for optimal scalability
    console.log(`5. Bulk inserting ${generatedTrains.length} Trains into MongoDB...`);
    const CHUNK_SIZE = 60;
    const insertedTrains = [];

    for (let i = 0; i < generatedTrains.length; i += CHUNK_SIZE) {
      const chunk = generatedTrains.slice(i, i + CHUNK_SIZE);
      const inserted = await Train.insertMany(chunk, { ordered: false });
      insertedTrains.push(...inserted);
      process.stdout.write(`   ↳ Inserted ${insertedTrains.length}/${generatedTrains.length} trains...\r`);
    }
    console.log(`\n   ✔ All ${insertedTrains.length} Trains inserted successfully!`);

    // Map trainNumber -> _id for Schedule link
    const trainMap = new Map();
    insertedTrains.forEach((t) => trainMap.set(t.trainNumber, t._id));

    // Step E: Bulk Insert Schedules
    console.log(`6. Bulk inserting ${generatedSchedules.length} Timetables & Seat Matrices...`);
    const scheduleDocsToInsert = generatedSchedules.map((s) => {
      const trainId = trainMap.get(s.trainNumber);
      delete s.trainNumber;
      return {
        ...s,
        train: trainId,
      };
    }).filter((s) => s.train);

    const insertedSchedules = [];
    for (let i = 0; i < scheduleDocsToInsert.length; i += CHUNK_SIZE) {
      const chunk = scheduleDocsToInsert.slice(i, i + CHUNK_SIZE);
      const inserted = await Schedule.insertMany(chunk, { ordered: false });
      insertedSchedules.push(...inserted);
      process.stdout.write(`   ↳ Inserted ${insertedSchedules.length}/${scheduleDocsToInsert.length} schedules...\r`);
    }
    console.log(`\n   ✔ All ${insertedSchedules.length} Schedules inserted successfully!`);

    // Step F: Seed Demo Users
    console.log(`7. Seeding Admin & Demo Passengers...`);
    const demoUser = await User.create({
      name: 'Rushi Sharma',
      email: 'rushi@example.com',
      password: 'password123',
      phone: '+91 98765 43210',
      role: 'user',
    });

    await User.create({
      name: 'Railway Admin Controller',
      email: 'admin@railways.gov.in',
      password: 'adminpassword123',
      phone: '+91 99999 88888',
      role: 'admin',
    });

    await User.create({
      name: 'Rushi Sharma (IRCTC)',
      email: 'rushi@irctc.ac.in',
      password: 'password123',
      phone: '+91 98765 43210',
      role: 'admin',
    });

    // Step G: Seed Active Sample Booking
    const sampleSchedule = insertedSchedules[0];
    const sampleTrain = insertedTrains[0];

    const sampleBooking = await Booking.create({
      pnr: '8492048172',
      user: demoUser._id,
      train: sampleTrain._id,
      schedule: sampleSchedule._id,
      trainNumber: sampleTrain.trainNumber,
      trainName: sampleTrain.name,
      source: sampleTrain.source.stationName,
      destination: sampleTrain.destination.stationName,
      travelDate: sampleSchedule.date,
      departureTime: sampleSchedule.departureTime,
      arrivalTime: sampleSchedule.arrivalTime,
      quota: 'GN',
      selectedClass: sampleTrain.classes[0]?.className || '3A',
      passengers: [
        {
          name: 'Rushi Sharma',
          age: 26,
          gender: 'Male',
          coachNumber: 'C1',
          seatNumber: 'C1-05',
          berthPreference: 'WINDOW',
          seatType: 'WINDOW',
          classType: sampleTrain.classes[0]?.className || '3A',
          currentStatus: 'CNF',
          fare: 1150,
        },
      ],
      fareBreakdown: {
        baseFare: 1065,
        reservationCharge: 40,
        superfastCharge: 45,
        tatkalCharge: 0,
        gst: 58,
        totalFare: 1208,
      },
      totalFare: 1208,
      bookingStatus: 'CONFIRMED',
      chartStatus: 'Chart Prepared',
      confirmationProbability: 100,
      paymentStatus: 'PAID',
      paymentMethod: 'UPI / NetBanking',
      addOns: {
        zeroCancellation: { selected: true, fee: 149 },
        travelInsurance: { selected: true, fee: 0.45, policyNumber: 'CHOLA-IRCTC-98234112' },
      },
      qrData: `PNR:8492048172|TRAIN:${sampleTrain.trainNumber}|STATUS:CNF|SEAT:C1-05`,
    });

    console.log('\n========================================================');
    console.log('🎉 PAN-INDIA RAILWAY MASSIVE SEEDING COMPLETE!');
    console.log(`  Stations:   ${seededStations.length} Major Junctions across all 18 zones`);
    console.log(`  Fleet:      ${insertedTrains.length} Procedurally Generated Trains`);
    console.log(`  Schedules:  ${insertedSchedules.length} Active Daily Timetables`);
    console.log(`  Waypoints:  5 to 15 geographically trajectory-aligned stops per train`);
    console.log(`  Active PNR: ${sampleBooking.pnr}`);
    console.log('========================================================\n');

    return {
      stationsCount: seededStations.length,
      trainsCount: insertedTrains.length,
      schedulesCount: insertedSchedules.length,
    };
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
};

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedData;
