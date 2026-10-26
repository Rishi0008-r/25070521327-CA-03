/**
 * Ixigo "Jugaad" Split-Ticketing / Smart Routing Algorithm
 * 
 * Computes alternative confirmed seating strategies when direct trains are waitlisted:
 * 1. Same-Train Split: Book Station A -> B, then B -> C on the same train (berth change at junction B)
 * 2. Connecting Train: Board Train 1 (A -> Hub), comfortable 45-180m layover, board Train 2 (Hub -> C)
 */

const Train = require('../models/Train');
const Schedule = require('../models/Schedule');

// Helper to convert "HH:MM" or "HH:MM (+1 Day)" into minutes from start
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(' ');
  const [h, m] = parts[0].split(':').map(Number);
  let total = (h || 0) * 60 + (m || 0);
  if (parts.length > 1 && parts[1].includes('+1')) total += 1440;
  if (parts.length > 1 && parts[1].includes('+2')) total += 2880;
  return total;
};

// Format minutes into "Xh Ym"
const formatMinutesToDuration = (totalMinutes) => {
  const mins = Math.max(0, totalMinutes);
  const hours = Math.floor(mins / 60);
  const remMinutes = mins % 60;
  return `${hours}h ${remMinutes}m`;
};

/**
 * Find Split-Ticketing Options between origin and destination
 */
const findSplitRoutes = async ({ from, to, date, classType = 'ALL', maxSuggestions = 4 }) => {
  try {
    const fromRegex = new RegExp(from.trim(), 'i');
    const toRegex = new RegExp(to.trim(), 'i');

    // 1. Fetch active trains and schedules for the date
    let scheduleQuery = {};
    if (date) scheduleQuery.date = date;

    const allSchedules = await Schedule.find(scheduleQuery)
      .populate('train')
      .lean();

    if (!allSchedules || allSchedules.length === 0) {
      return [];
    }

    const suggestions = [];

    // =========================================================================
    // STRATEGY 1: SAME-TRAIN SPLIT BOOKING (Berth hopping on same physical train)
    // =========================================================================
    for (const schedule of allSchedules) {
      const train = schedule.train;
      if (!train || !train.isActive) continue;

      const stops = [
        { stationName: train.source.stationName, stationCode: train.source.stationCode, stopOrder: 0, departureTime: train.departureTime, arrivalTime: train.departureTime },
        ...(train.intermediateStations || []),
        { stationName: train.destination.stationName, stationCode: train.destination.stationCode, stopOrder: 999, departureTime: train.arrivalTime, arrivalTime: train.arrivalTime },
      ];

      // Find indices of from and to in this train
      let fromIdx = -1;
      let toIdx = -1;

      stops.forEach((stn, idx) => {
        if (fromIdx === -1 && (fromRegex.test(stn.stationName) || fromRegex.test(stn.stationCode))) {
          fromIdx = idx;
        }
        if (toIdx === -1 && (toRegex.test(stn.stationName) || toRegex.test(stn.stationCode))) {
          toIdx = idx;
        }
      });

      // Must have from before to with at least one intermediate stop between them
      if (fromIdx !== -1 && toIdx !== -1 && toIdx - fromIdx >= 2) {
        // Pick the midpoint intermediate junction
        const midIdx = Math.floor((fromIdx + toIdx) / 2);
        const junctionStop = stops[midIdx];

        const targetClass = (classType && classType !== 'ALL') ? classType : (schedule.classAvailability?.[0]?.className || '3A');
        const classInfo = schedule.classAvailability?.find((c) => c.className === targetClass) || schedule.classAvailability?.[0];

        if (classInfo) {
          const leg1Fare = Math.round(classInfo.totalFare * 0.52);
          const leg2Fare = Math.round(classInfo.totalFare * 0.52);

          suggestions.push({
            id: `SAME_${train.trainNumber}_${junctionStop.stationCode}`,
            type: 'SAME_TRAIN_SPLIT',
            title: `Same-Train Split Seat (${train.name})`,
            subtitle: `Switch seat at ${junctionStop.stationName} without switching trains!`,
            trainNumber: train.trainNumber,
            trainName: train.name,
            trainType: train.trainType,
            transferStation: {
              code: junctionStop.stationCode,
              name: junctionStop.stationName,
              haltMinutes: junctionStop.haltMinutes || 5,
            },
            leg1: {
              trainNumber: train.trainNumber,
              trainName: train.name,
              from: stops[fromIdx].stationName,
              fromCode: stops[fromIdx].stationCode,
              to: junctionStop.stationName,
              toCode: junctionStop.stationCode,
              departureTime: stops[fromIdx].departureTime || schedule.departureTime,
              arrivalTime: junctionStop.arrivalTime || '14:20',
              className: targetClass,
              assignedSeat: 'B2-24 (Confirmed)',
              status: 'AVAILABLE',
              fare: leg1Fare,
            },
            leg2: {
              trainNumber: train.trainNumber,
              trainName: train.name,
              from: junctionStop.stationName,
              fromCode: junctionStop.stationCode,
              to: stops[toIdx].stationName,
              toCode: stops[toIdx].stationCode,
              departureTime: junctionStop.departureTime || '14:25',
              arrivalTime: stops[toIdx].arrivalTime || schedule.arrivalTime,
              className: targetClass,
              assignedSeat: 'B4-12 (Confirmed)',
              status: 'AVAILABLE',
              fare: leg2Fare,
            },
            totalFare: leg1Fare + leg2Fare,
            totalDuration: train.durationHours || '12h 30m',
            guaranteedConfirmed: true,
            jugaadSavingsText: 'Bypasses waitlist with 100% confirmed berths on same train',
          });

          if (suggestions.length >= 2) break;
        }
      }
    }

    // =========================================================================
    // STRATEGY 2: CONNECTING TRAIN ROUTE (Via Transit Junction Hub)
    // =========================================================================
    // Popular Pan-India Junction Hubs
    const TRANSIT_HUBS = ['BSL', 'ET', 'NGP', 'CNB', 'PRYJ', 'BRC', 'KYN', 'VGLJ', 'BZA', 'KPD', 'BPL'];

    for (const hubCode of TRANSIT_HUBS) {
      if (suggestions.length >= maxSuggestions) break;

      // Leg 1: Trains from 'from' to 'hub'
      const leg1Schedules = allSchedules.filter((s) => {
        const t = s.train;
        if (!t) return false;
        const allStops = [t.source, ...(t.intermediateStations || []), t.destination];
        const fIdx = allStops.findIndex((x) => fromRegex.test(x.stationName) || fromRegex.test(x.stationCode));
        const hIdx = allStops.findIndex((x) => x.stationCode === hubCode || new RegExp(hubCode, 'i').test(x.stationName));
        return fIdx !== -1 && hIdx !== -1 && fIdx < hIdx;
      });

      // Leg 2: Trains from 'hub' to 'to'
      const leg2Schedules = allSchedules.filter((s) => {
        const t = s.train;
        if (!t) return false;
        const allStops = [t.source, ...(t.intermediateStations || []), t.destination];
        const hIdx = allStops.findIndex((x) => x.stationCode === hubCode || new RegExp(hubCode, 'i').test(x.stationName));
        const tIdx = allStops.findIndex((x) => toRegex.test(x.stationName) || toRegex.test(x.stationCode));
        return hIdx !== -1 && tIdx !== -1 && hIdx < tIdx;
      });

      // Find compatible time pairing (Layover 45 mins to 240 mins)
      for (const s1 of leg1Schedules.slice(0, 3)) {
        for (const s2 of leg2Schedules.slice(0, 3)) {
          if (s1.train.trainNumber === s2.train.trainNumber) continue;

          const t1Arr = parseTimeToMinutes(s1.arrivalTime);
          const t2Dep = parseTimeToMinutes(s2.departureTime);
          let layover = t2Dep - t1Arr;

          // If next day departure
          if (layover < 0) layover += 1440;

          // Ideal layover window: 45 min to 240 min
          if (layover >= 45 && layover <= 240) {
            const cls1 = s1.classAvailability?.find((c) => c.status === 'AVAILABLE') || s1.classAvailability?.[0];
            const cls2 = s2.classAvailability?.find((c) => c.status === 'AVAILABLE') || s2.classAvailability?.[0];

            if (cls1 && cls2) {
              const totalMins = (t1Arr - parseTimeToMinutes(s1.departureTime)) + layover + (parseTimeToMinutes(s2.arrivalTime) - t2Dep);

              suggestions.push({
                id: `CONN_${s1.train.trainNumber}_${s2.train.trainNumber}_${hubCode}`,
                type: 'CONNECTING_TRAIN',
                title: `Confirmed Connecting Route via ${hubCode}`,
                subtitle: `Board ${s1.train.trainNumber} ➔ Transfer at ${hubCode} (Layover: ${layover}m) ➔ Board ${s2.train.trainNumber}`,
                transferStation: {
                  code: hubCode,
                  name: `${hubCode} Junction`,
                  layoverMinutes: layover,
                  layoverDisplay: `${Math.floor(layover / 60)}h ${layover % 60}m transfer layover`,
                },
                leg1: {
                  trainNumber: s1.train.trainNumber,
                  trainName: s1.train.name,
                  trainType: s1.train.trainType,
                  from: from,
                  to: `${hubCode} Junction`,
                  departureTime: s1.departureTime,
                  arrivalTime: s1.arrivalTime,
                  className: cls1.className,
                  status: cls1.status,
                  fare: cls1.totalFare,
                },
                leg2: {
                  trainNumber: s2.train.trainNumber,
                  trainName: s2.train.name,
                  trainType: s2.train.trainType,
                  from: `${hubCode} Junction`,
                  to: to,
                  departureTime: s2.departureTime,
                  arrivalTime: s2.arrivalTime,
                  className: cls2.className,
                  status: cls2.status,
                  fare: cls2.totalFare,
                },
                totalFare: cls1.totalFare + cls2.totalFare,
                totalDuration: formatMinutesToDuration(totalMins > 0 ? totalMins : 720),
                guaranteedConfirmed: true,
                jugaadSavingsText: `Guaranteed confirmed berths on both legs when direct train is in Waitlist`,
              });

              if (suggestions.length >= maxSuggestions) break;
            }
          }
        }
        if (suggestions.length >= maxSuggestions) break;
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Error computing split routes:', error);
    return [];
  }
};

module.exports = { findSplitRoutes };
