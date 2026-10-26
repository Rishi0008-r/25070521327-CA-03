const Schedule = require('../models/Schedule');
const Train = require('../models/Train');

// In-memory simulated trains tracking state across India
let simulatedTrains = [
  {
    trainNumber: '22436',
    trainName: 'Vande Bharat Express',
    route: [
      { name: 'New Delhi (NDLS)', lat: 28.6139, lng: 77.2090, km: 0 },
      { name: 'Kanpur Central (CNB)', lat: 26.4499, lng: 80.3319, km: 440 },
      { name: 'Prayagraj Jn (PRYJ)', lat: 25.4358, lng: 81.8463, km: 635 },
      { name: 'Varanasi Jn (BSB)', lat: 25.3176, lng: 82.9739, km: 759 },
    ],
    currentLegIndex: 0,
    progressPercentage: 25,
    speedKmH: 128,
    status: 'RUNNING',
    delayMinutes: 0,
    platform: '1',
    crossingNotice: 'Train 22436 crossing Aligarh Outer Section at 128 km/h',
  },
  {
    trainNumber: '12952',
    trainName: 'Mumbai Rajdhani Express',
    route: [
      { name: 'New Delhi (NDLS)', lat: 28.6139, lng: 77.2090, km: 0 },
      { name: 'Kota Jn (KOTA)', lat: 25.1800, lng: 75.8300, km: 465 },
      { name: 'Vadodara Jn (BRC)', lat: 22.3106, lng: 73.1812, km: 992 },
      { name: 'Mumbai Central (MMCT)', lat: 18.9696, lng: 72.8193, km: 1386 },
    ],
    currentLegIndex: 1,
    progressPercentage: 55,
    speedKmH: 124,
    status: 'RUNNING',
    delayMinutes: 5,
    platform: '3',
    crossingNotice: 'Train 12952 crossing Ratlam Junction at 124 km/h',
  },
  {
    trainNumber: '12302',
    trainName: 'Howrah Rajdhani Express',
    route: [
      { name: 'New Delhi (NDLS)', lat: 28.6139, lng: 77.2090, km: 0 },
      { name: 'Kanpur Central (CNB)', lat: 26.4499, lng: 80.3319, km: 440 },
      { name: 'Patna Jn (PNBE)', lat: 25.6025, lng: 85.1376, km: 998 },
      { name: 'Howrah Jn (HWH)', lat: 22.5839, lng: 88.3426, km: 1450 },
    ],
    currentLegIndex: 1,
    progressPercentage: 40,
    speedKmH: 118,
    status: 'ON TIME',
    delayMinutes: 0,
    platform: '4',
    crossingNotice: 'Train 12302 crossing Mughalsarai (Pt DD Upadhyaya) at 118 km/h',
  },
  {
    trainNumber: '12002',
    trainName: 'Bhopal Shatabdi Express',
    route: [
      { name: 'New Delhi (NDLS)', lat: 28.6139, lng: 77.2090, km: 0 },
      { name: 'Agra Cantt (AGC)', lat: 27.1593, lng: 78.0063, km: 195 },
      { name: 'Gwalior Jn (GWL)', lat: 26.2183, lng: 78.1828, km: 313 },
      { name: 'Bhopal Jn (BPL)', lat: 23.2599, lng: 77.4126, km: 701 },
    ],
    currentLegIndex: 0,
    progressPercentage: 78,
    speedKmH: 130,
    status: 'ON TIME',
    delayMinutes: 0,
    platform: '2',
    crossingNotice: 'Train 12002 crossing Mathura Cantt at 130 km/h (Approaching Agra Cantt)',
  },
  {
    trainNumber: '22692',
    trainName: 'Bengaluru Rajdhani Express',
    route: [
      { name: 'New Delhi (NDLS)', lat: 28.6139, lng: 77.2090, km: 0 },
      { name: 'Bhopal Jn (BPL)', lat: 23.2599, lng: 77.4126, km: 701 },
      { name: 'Secunderabad Jn (SC)', lat: 17.4344, lng: 78.5013, km: 1670 },
      { name: 'KSR Bengaluru (SBC)', lat: 12.9716, lng: 77.5946, km: 2365 },
    ],
    currentLegIndex: 1,
    progressPercentage: 35,
    speedKmH: 115,
    status: 'RUNNING',
    delayMinutes: 12,
    platform: '1',
    crossingNotice: 'Train 22692 crossing Kazipet Junction at 115 km/h',
  },
  {
    trainNumber: '20901',
    name: 'Gandhinagar Vande Bharat',
    trainName: 'Mumbai - Ahmedabad Vande Bharat',
    route: [
      { name: 'Mumbai Central (MMCT)', lat: 18.9696, lng: 72.8193, km: 0 },
      { name: 'Vadodara Jn (BRC)', lat: 22.3106, lng: 73.1812, km: 392 },
      { name: 'Ahmedabad Jn (ADI)', lat: 23.0258, lng: 72.6011, km: 491 },
    ],
    currentLegIndex: 0,
    progressPercentage: 62,
    speedKmH: 130,
    status: 'ON TIME',
    delayMinutes: 0,
    platform: '5',
    crossingNotice: 'Train 20901 crossing Surat at 130 km/h',
  },
  {
    trainNumber: '12616',
    trainName: 'Grand Trunk Express',
    route: [
      { name: 'New Delhi (NDLS)', lat: 28.6139, lng: 77.2090, km: 0 },
      { name: 'Bhopal Jn (BPL)', lat: 23.2599, lng: 77.4126, km: 701 },
      { name: 'Vijayawada Jn (BZA)', lat: 16.5173, lng: 80.6200, km: 1740 },
      { name: 'Chennai Central (MAS)', lat: 13.0827, lng: 80.2707, km: 2175 },
    ],
    currentLegIndex: 2,
    progressPercentage: 80,
    speedKmH: 104,
    status: 'DELAYED',
    delayMinutes: 20,
    platform: '3',
    crossingNotice: 'Train 12616 crossing Gudur Junction (20m delayed)',
  },
  {
    trainNumber: '12780',
    trainName: 'Goa Express',
    route: [
      { name: 'New Delhi (NDLS)', lat: 28.6139, lng: 77.2090, km: 0 },
      { name: 'Bhopal Jn (BPL)', lat: 23.2599, lng: 77.4126, km: 701 },
      { name: 'Pune Jn (PUNE)', lat: 18.5284, lng: 73.8739, km: 1540 },
      { name: 'Madgaon Jn (MAO)', lat: 15.2741, lng: 73.9582, km: 2164 },
    ],
    currentLegIndex: 2,
    progressPercentage: 45,
    speedKmH: 95,
    status: 'RUNNING',
    delayMinutes: 0,
    platform: '1',
    crossingNotice: 'Train 12780 crossing Satara Section in Western Ghats at 95 km/h',
  },
  {
    trainNumber: '22223',
    trainName: 'Mumbai - Shirdi Vande Bharat',
    route: [
      { name: 'Mumbai CSMT (CSMT)', lat: 18.9400, lng: 72.8353, km: 0 },
      { name: 'Thane (TNA)', lat: 19.1860, lng: 72.9759, km: 34 },
      { name: 'Kalyan (KYN)', lat: 19.2364, lng: 73.1306, km: 54 },
      { name: 'Nashik Road (NK)', lat: 19.9575, lng: 73.8340, km: 188 },
      { name: 'Manmad Jn (MMR)', lat: 20.2543, lng: 74.4377, km: 261 },
    ],
    currentLegIndex: 2,
    progressPercentage: 55,
    speedKmH: 130,
    status: 'RUNNING',
    delayMinutes: 0,
    platform: '2',
    crossingNotice: 'Train 22223 descending Kasara Thal Ghat towards Nashik at 130 km/h',
  },
  {
    trainNumber: '22225',
    trainName: 'Mumbai - Solapur Vande Bharat',
    route: [
      { name: 'Mumbai CSMT (CSMT)', lat: 18.9400, lng: 72.8353, km: 0 },
      { name: 'Dadar (DR)', lat: 19.0178, lng: 72.8478, km: 9 },
      { name: 'Kalyan (KYN)', lat: 19.2364, lng: 73.1306, km: 54 },
      { name: 'Pune Jn (PUNE)', lat: 18.5284, lng: 73.8739, km: 192 },
      { name: 'Daund Jn (DD)', lat: 18.4639, lng: 74.5828, km: 268 },
      { name: 'Solapur Jn (SUR)', lat: 17.6599, lng: 75.9064, km: 455 },
    ],
    currentLegIndex: 3,
    progressPercentage: 42,
    speedKmH: 125,
    status: 'ON TIME',
    delayMinutes: 0,
    platform: '1',
    crossingNotice: 'Train 22225 crossing Bhigwan Section at 125 km/h',
  },
];

let trackingInterval = null;

const initTrainSockets = (io) => {
  console.log('\x1b[35m[Socket.io] Real-time Transit Telemetry Engine initialized\x1b[0m');

  io.on('connection', (socket) => {
    // Immediately emit current tracking status
    socket.emit('initial_tracking_state', simulatedTrains);

    socket.on('join_schedule', (scheduleId) => {
      socket.join(`schedule_${scheduleId}`);
    });

    socket.on('leave_schedule', (scheduleId) => {
      socket.leave(`schedule_${scheduleId}`);
    });

    socket.on('seat_hover_select', ({ scheduleId, seatNumber, coachNumber, user }) => {
      socket.broadcast.emit('user_viewing_seat', {
        scheduleId,
        seatNumber,
        coachNumber,
        user,
      });
    });

    socket.on('trigger_manual_delay', ({ trainNumber, delayMinutes, status }) => {
      const train = simulatedTrains.find((t) => t.trainNumber === trainNumber);
      if (train) {
        train.delayMinutes = delayMinutes;
        train.status = status || (delayMinutes > 0 ? 'DELAYED' : 'ON TIME');
        train.crossingNotice = `Train ${train.trainNumber} delay update: Running ${delayMinutes}m behind schedule`;

        io.emit('schedule_update', {
          trainNumber: train.trainNumber,
          trainName: train.trainName,
          delayMinutes: train.delayMinutes,
          currentStatus: train.status,
          platform: train.platform,
          crossingNotice: train.crossingNotice,
        });

        io.emit('train_tracking_update', simulatedTrains);
      }
    });

    socket.on('disconnect', () => {
      // Disconnect handled quietly
    });
  });

  // Continuous background simulation tick every 3 seconds
  if (!trackingInterval) {
    trackingInterval = setInterval(() => {
      simulatedTrains.forEach((train) => {
        const step = Math.random() * 2 + 1.2; // 1.2% to 3.2%
        train.progressPercentage = Math.round((train.progressPercentage + step) * 10) / 10;

        // Speed fluctuation
        const speedFluc = Math.floor(Math.random() * 7) - 3;
        train.speedKmH = Math.min(135, Math.max(85, train.speedKmH + speedFluc));

        // Advance to next leg
        if (train.progressPercentage >= 100) {
          train.progressPercentage = 0;
          train.currentLegIndex = (train.currentLegIndex + 1) % (train.route.length - 1);
        }

        const currentStation = train.route[train.currentLegIndex];
        const nextStation = train.route[train.currentLegIndex + 1];

        const fraction = train.progressPercentage / 100;
        train.currentLat = currentStation.lat + (nextStation.lat - currentStation.lat) * fraction;
        train.currentLng = currentStation.lng + (nextStation.lng - currentStation.lng) * fraction;
        train.currentStationName = currentStation.name;
        train.nextStationName = nextStation.name;

        // Dynamic crossing notice
        if (train.progressPercentage < 30) {
          train.crossingNotice = `Train ${train.trainNumber} departed ${currentStation.name.split(' (')[0]}, running at ${train.speedKmH} km/h`;
        } else if (train.progressPercentage > 75) {
          train.crossingNotice = `Train ${train.trainNumber} approaching ${nextStation.name.split(' (')[0]} (Platform ${train.platform})`;
        } else {
          train.crossingNotice = `Train ${train.trainNumber} cruising between ${currentStation.name.split(' (')[0]} and ${nextStation.name.split(' (')[0]} at ${train.speedKmH} km/h`;
        }
      });

      io.emit('train_tracking_update', simulatedTrains);
    }, 3000);
  }
};

module.exports = { initTrainSockets, simulatedTrains };
