const express = require('express');
const router = express.Router();
const Train = require('../models/Train');
const Schedule = require('../models/Schedule');
const Station = require('../models/Station');
const FareRule = require('../models/FareRule');
const { MAJOR_STATIONS } = require('../data/stations');
const { calculateWaitlistProbability } = require('../utils/waitlistPredictor');
const { findSplitRoutes } = require('../utils/splitRouting');

// @route   GET /api/trains/stations
// @desc    Autocomplete endpoint supporting 100+ pan-India stations
// @access  Public
router.get('/stations', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      const dbStations = await Station.find().limit(35);
      return res.json(dbStations.length > 0 ? dbStations : MAJOR_STATIONS.slice(0, 35));
    }

    const q = query.trim();
    const regex = new RegExp(q, 'i');
    let filtered = await Station.find({
      $or: [{ code: regex }, { name: regex }, { city: regex }, { state: regex }, { zone: regex }],
    }).limit(35);

    if (filtered.length === 0) {
      filtered = MAJOR_STATIONS.filter(
        (s) =>
          s.code.toLowerCase().includes(q.toLowerCase()) ||
          s.name.toLowerCase().includes(q.toLowerCase()) ||
          s.city.toLowerCase().includes(q.toLowerCase()) ||
          s.state.toLowerCase().includes(q.toLowerCase())
      );
    }

    res.json(filtered);
  } catch (err) {
    res.json(MAJOR_STATIONS.slice(0, 25));
  }
});

// @route   GET /api/trains/predict-waitlist
// @desc    Calculate dynamic waitlist confirmation probability (ConfirmTkt / Ixigo algorithm)
// @access  Public
router.get('/predict-waitlist', (req, res) => {
  try {
    const { trainType, className, quota, daysToDeparture, wlNumber, currentStatus } = req.query;
    const prediction = calculateWaitlistProbability({
      trainType,
      className,
      quota,
      daysToDeparture: Number(daysToDeparture) || 10,
      wlNumber: Number(wlNumber) || 12,
      currentStatus: currentStatus || 'WL',
    });
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/trains/smart-split
// @desc    Ixigo "Jugaad" split ticketing algorithm for guaranteed confirmed seats
// @access  Public
router.get('/smart-split', async (req, res) => {
  try {
    const { from, to, date, classType } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: 'Source (from) and Destination (to) are required' });
    }

    const splitRoutes = await findSplitRoutes({ from, to, date, classType });
    res.json({
      count: splitRoutes.length,
      splitRoutes,
    });
  } catch (error) {
    console.error('Smart split route error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Pre-computed station lookup maps from MAJOR_STATIONS
const stationByCodeMap = new Map();
const stationsByCityMap = new Map();

MAJOR_STATIONS.forEach((stn) => {
  const code = (stn.code || '').toUpperCase();
  stationByCodeMap.set(code, stn);

  const city = (stn.city || '').toLowerCase().trim();
  if (city) {
    if (!stationsByCityMap.has(city)) stationsByCityMap.set(city, new Set());
    stationsByCityMap.get(city).add(code);
  }
});

// Comprehensive Indian Railway metropolitan & regional synonyms
const METRO_SYNONYMS = {
  mumbai: ['mumbai', 'bombay', 'csmt', 'mmct', 'ltt', 'bdts', 'dr', 'tna', 'kyn', 'pnvl', 'bsr'],
  delhi: ['delhi', 'new delhi', 'ndls', 'dli', 'nzm', 'anvt', 'dee'],
  kolkata: ['kolkata', 'calcutta', 'howrah', 'hwh', 'sdah', 'koaa', 'shm'],
  bengaluru: ['bengaluru', 'bangalore', 'sbc', 'ypr', 'smvb'],
  chennai: ['chennai', 'madras', 'mas', 'ms', 'tbm'],
  hyderabad: ['hyderabad', 'secunderabad', 'sc', 'hyb', 'kcg'],
  varanasi: ['varanasi', 'banaras', 'kashi', 'bsb', 'ddu', 'bsbs'],
  pune: ['pune', 'poona', 'svjr', 'pmp'],
  ahmedabad: ['ahmedabad', 'adi', 'sbt'],
  solapur: ['solapur', 'sholapur', 'sur'],
  nashik: ['nashik', 'nasik', 'nk'],
  bhopal: ['bhopal', 'bpl', 'rkmp', 'habibganj'],
  prayagraj: ['prayagraj', 'allahabad', 'pryj', 'ald'],
  nagpur: ['nagpur', 'ngp'],
  jaipur: ['jaipur', 'jp'],
  lucknow: ['lucknow', 'lko', 'ljn'],
  patna: ['patna', 'pnbe'],
  amritsar: ['amritsar', 'asr'],
  goa: ['goa', 'madgaon', 'mao', 'thvm'],
  kolhapur: ['kolhapur', 'kop'],
  surat: ['surat', 'st'],
  bhusaval: ['bhusaval', 'bhusawal', 'bsl'],
  shirdi: ['shirdi', 'sainagar', 'snsi', 'mmr'],
  daund: ['daund', 'dd'],
  miraj: ['miraj', 'mrj'],
  vasai: ['vasai', 'bsr'],
  panvel: ['panvel', 'pnvl'],
  thane: ['thane', 'tna'],
  kalyan: ['kalyan', 'kyn'],
  dadar: ['dadar', 'dr'],
  bandra: ['bandra', 'bdts'],
  igatpuri: ['igatpuri', 'igp'],
  jalgaon: ['jalgaon', 'jl'],
  chalisgaon: ['chalisgaon', 'csn'],
  manmad: ['manmad', 'mmr']
};

const matchStationInStn = (stn, searchStr) => {
  if (!stn || !searchStr) return false;
  const q = searchStr.trim().toLowerCase();
  if (!q) return false;

  const sCode = (stn.stationCode || '').toUpperCase();
  const sName = (stn.stationName || '').toLowerCase();
  const sInfo = stationByCodeMap.get(sCode);
  const sCity = (sInfo?.city || '').toLowerCase();

  // 1. Check parenthetical code: e.g. "Chhatrapati Shivaji Maharaj Terminus (CSMT)" -> "CSMT"
  const parenMatch = searchStr.match(/\(([A-Za-z0-9]+)\)/);
  if (parenMatch && parenMatch[1].toUpperCase() === sCode) {
    return true;
  }

  // 2. Exact station code match
  if (sCode.toLowerCase() === q) return true;

  // 3. Station code as word in composite input
  const codeRegex = new RegExp(`(^|[^a-zA-Z0-9])${sCode}([^a-zA-Z0-9]|$)`, 'i');
  if (codeRegex.test(searchStr)) return true;

  // 4. Exact station name or city match
  if (sName === q || sCity === q) return true;
  if (sName.includes(q) || q.includes(sName)) return true;
  if (sCity && (sCity.includes(q) || q.includes(sCity))) return true;

  // 5. Metropolitan / Regional synonym cluster lookup
  for (const [metroKey, aliases] of Object.entries(METRO_SYNONYMS)) {
    const queryMatchesMetro = aliases.some((a) => q === a || q.includes(a));
    if (queryMatchesMetro) {
      if (aliases.includes(sCode.toLowerCase()) || sCity.includes(metroKey) || sName.includes(metroKey)) {
        return true;
      }
    }
  }

  // 6. Meaningful word tokens match
  const stopWords = new Set(['junction', 'jn', 'central', 'terminus', 'road', 'cantt', 'city']);
  const queryTokens = q.split(/[\s,()/-]+/).filter((p) => p.length >= 3 && !stopWords.has(p));
  const nameTokens = sName.split(/[\s,()/-]+/).filter((p) => p.length >= 3 && !stopWords.has(p));
  if (sCity) nameTokens.push(sCity);

  for (const qt of queryTokens) {
    for (const nt of nameTokens) {
      if (nt === qt || (qt.length >= 4 && (nt.startsWith(qt) || qt.startsWith(nt)))) {
        return true;
      }
    }
  }

  return false;
};

// @route   GET /api/trains/search
// @desc    Dual-search engine with ConfirmTkt waitlist prediction & Ixigo smart split alternatives
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { from, to, sourceStation, destinationStation, date, query, trainQuery, classType, quota, sortBy } = req.query;
    const fromVal = (from || sourceStation || '').trim();
    const toVal = (to || destinationStation || '').trim();

    let matchedTrains = [];

    // MODE 1: Direct Search by Train Number or Train Name
    const directSearchTerm = (trainQuery || query || '').trim();
    if (directSearchTerm) {
      const regex = new RegExp(directSearchTerm, 'i');
      matchedTrains = await Train.find({
        isActive: true,
        $or: [{ trainNumber: regex }, { name: regex }],
      });
    } else if (fromVal || toVal) {
      // MODE 2: Search by Route (From -> To)
      const allActiveTrains = await Train.find({ isActive: true });

      const hasFrom = fromVal !== '';
      const hasTo = toVal !== '';

      matchedTrains = allActiveTrains.filter((train) => {
        const fullRoute = [
          { stationName: train.source.stationName, stationCode: train.source.stationCode, stopOrder: 0 },
          ...(train.intermediateStations || []),
          { stationName: train.destination.stationName, stationCode: train.destination.stationCode, stopOrder: 999 },
        ];

        if (hasFrom && hasTo) {
          let earliestFromIdx = -1;
          for (let i = 0; i < fullRoute.length; i++) {
            if (matchStationInStn(fullRoute[i], fromVal)) {
              earliestFromIdx = i;
              break;
            }
          }
          if (earliestFromIdx === -1) return false;

          let latestToIdx = -1;
          for (let j = fullRoute.length - 1; j > earliestFromIdx; j--) {
            if (matchStationInStn(fullRoute[j], toVal)) {
              latestToIdx = j;
              break;
            }
          }
          return latestToIdx !== -1 && earliestFromIdx < latestToIdx;
        } else if (hasFrom) {
          return fullRoute.some((stn) => matchStationInStn(stn, fromVal));
        } else if (hasTo) {
          return fullRoute.some((stn) => matchStationInStn(stn, toVal));
        }
        return true;
      });
    } else {
      // If no query parameters, return first 25 flagship trains
      matchedTrains = await Train.find({ isActive: true }).limit(25);
    }

    // Find Schedules for these trains
    const trainIds = matchedTrains.map((t) => t._id);
    const requestedDate = (date || '').trim() || new Date().toISOString().split('T')[0];

    // Try finding schedules for the requested date
    let schedules = await Schedule.find({ train: { $in: trainIds }, date: requestedDate }).populate('train');

    // If no schedules exist for this exact date, adapt active baseline schedules for requestedDate
    if (schedules.length === 0 && trainIds.length > 0) {
      const baseSchedules = await Schedule.find({ train: { $in: trainIds } }).populate('train');
      const seenTrains = new Set();
      schedules = [];
      for (const s of baseSchedules) {
        const tId = s.train?._id?.toString() || s.train?.toString();
        if (tId && !seenTrains.has(tId)) {
          seenTrains.add(tId);
          const adapted = s.toObject();
          adapted.date = requestedDate;
          schedules.push(adapted);
        }
      }
    }

    // Filter by Class if requested
    if (classType && classType !== 'ALL') {
      schedules = schedules.filter((s) =>
        s.classAvailability?.some((ca) => ca.className === classType)
      );
    }

    // Enrich classAvailability with dynamic Smart Waitlist Predictions (ConfirmTkt / Ixigo)
    schedules = schedules.map((schedule) => {
      const train = schedule.train;
      if (schedule.classAvailability) {
        schedule.classAvailability = schedule.classAvailability.map((cls) => {
          const prediction = calculateWaitlistProbability({
            trainType: train?.trainType || 'Superfast Express',
            className: cls.className,
            quota: quota || 'GN',
            daysToDeparture: 7,
            wlNumber: cls.status === 'WL' ? (cls.wlCount || 14) : (cls.racCount || 4),
            currentStatus: cls.status,
          });

          const clsObj = typeof cls.toObject === 'function' ? cls.toObject() : { ...cls };
          return {
            ...clsObj,
            probability: prediction.probability,
            predictionTier: prediction.tier,
            predictionBadgeColor: prediction.badgeColor,
            predictionReason: prediction.reasoning,
            forecastTrend: prediction.forecastTrend,
          };
        });
      }
      return schedule;
    });

    // Check if direct trains have heavy waitlist or zero results, then compute Ixigo Smart Split Routes
    let splitRoutes = [];
    if (fromVal && toVal && req.query.includeSplit === 'true') {
      try {
        splitRoutes = await findSplitRoutes({ from: fromVal, to: toVal, date, classType, maxSuggestions: 3 });
      } catch (splitErr) {
        console.warn('Split routing suggestion error:', splitErr.message);
      }
    }

    // Sorting
    if (sortBy === 'departure') {
      schedules.sort((a, b) => (a.departureTime > b.departureTime ? 1 : -1));
    } else if (sortBy === 'duration') {
      schedules.sort((a, b) =>
        (a.train?.durationHours || '').localeCompare(b.train?.durationHours || '')
      );
    } else if (sortBy === 'price') {
      schedules.sort((a, b) => {
        const priceA = a.classAvailability?.[0]?.totalFare || 9999;
        const priceB = b.classAvailability?.[0]?.totalFare || 9999;
        return priceA - priceB;
      });
    }

    res.json({
      count: schedules.length,
      schedules,
      splitRoutes,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/trains/schedules
// @desc    Get all active schedules for the dynamic schedule board
// @access  Public
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate('train')
      .sort({ departureTime: 1 })
      .limit(30);

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/trains/schedule/:id
// @desc    Get detailed schedule by ID with coach seat matrix
// @access  Public
router.get('/schedule/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate('train');
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/trains/:trainNumber/live-status
// @desc    ConfirmTkt style Live Train Running Status (timeline with stops and delays)
// @access  Public
router.get('/:trainNumber/live-status', async (req, res) => {
  try {
    const train = await Train.findOne({ trainNumber: req.params.trainNumber });
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    const schedule = await Schedule.findOne({ train: train._id }).sort({ createdAt: -1 });

    const delayMinutes = schedule?.delayMinutes || 0;
    const legIndex = schedule?.liveTracking?.currentStationIndex || 1;
    const progress = schedule?.liveTracking?.progressPercentage || 45;
    const speed = schedule?.liveTracking?.currentSpeedKmH || 115;

    const fullTimeline = train.intermediateStations.map((stn, idx) => {
      const isPassed = idx < legIndex;
      const isCurrent = idx === legIndex;
      const isUpcoming = idx > legIndex;

      let statusText = 'Upcoming';
      if (isPassed) statusText = 'Departed on time';
      else if (isCurrent) statusText = delayMinutes > 0 ? `Running late by ${delayMinutes} mins` : 'Right time';

      const stnObj = typeof stn.toObject === 'function' ? stn.toObject() : { ...stn };
      return {
        ...stnObj,
        isPassed,
        isCurrent,
        isUpcoming,
        statusText,
      };
    });

    res.json({
      trainNumber: train.trainNumber,
      trainName: train.name,
      trainType: train.trainType,
      source: train.source,
      destination: train.destination,
      departureTime: train.departureTime,
      arrivalTime: train.arrivalTime,
      delayMinutes,
      currentSpeedKmH: speed,
      currentStationName: schedule?.liveTracking?.currentStationName || train.intermediateStations[legIndex]?.stationName,
      nextStationName: schedule?.liveTracking?.nextStationName || train.intermediateStations[legIndex + 1]?.stationName,
      progressPercentage: progress,
      timeline: fullTimeline,
    });
  } catch (error) {
    console.error('Live status error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
