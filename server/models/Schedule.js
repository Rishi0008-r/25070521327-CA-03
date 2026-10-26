const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  seatType: {
    type: String,
    enum: [
      'WINDOW',
      'AISLE',
      'MIDDLE',
      'LOWER',
      'UPPER',
      'SIDE LOWER',
      'SIDE UPPER',
      'CABIN',
      'COUPE',
    ],
    default: 'WINDOW',
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BOOKED', 'RAC', 'WL', 'BLOCKED'],
    default: 'AVAILABLE',
  },
  isBooked: { type: Boolean, default: false },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  quota: {
    type: String,
    enum: ['GN', 'TQ', 'LD', 'PT'],
    default: 'GN',
  },
  fare: { type: Number, default: 450 },
});

const coachSchema = new mongoose.Schema({
  coachNumber: { type: String, required: true },
  coachType: {
    type: String,
    enum: ['1A', '2A', '3A', '3E', 'CC', 'EC', 'SL', '2S'],
    required: true,
  },
  seats: [seatSchema],
});

const classAvailabilitySchema = new mongoose.Schema({
  className: { type: String, required: true },
  status: { type: String, default: 'AVAILABLE' }, // 'AVAILABLE' | 'RAC' | 'WL'
  availableCount: { type: Number, default: 42 },
  racCount: { type: Number, default: 0 },
  wlCount: { type: Number, default: 0 },
  probability: { type: Number, default: 95 }, // e.g., 95% confirmation probability (ConfirmTkt style)
  baseFare: { type: Number, required: true },
  reservationCharge: { type: Number, default: 40 },
  superfastCharge: { type: Number, default: 45 },
  tatkalCharge: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 5 },
  totalFare: { type: Number, required: true },
});

const scheduleSchema = new mongoose.Schema(
  {
    train: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Train',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true, // Format: YYYY-MM-DD
      index: true,
    },
    departureTime: {
      type: String,
      required: true,
    },
    arrivalTime: {
      type: String,
      required: true,
    },
    currentStatus: {
      type: String,
      enum: ['ON TIME', 'DELAYED', 'RUNNING', 'COMPLETED', 'CANCELLED'],
      default: 'ON TIME',
    },
    delayMinutes: {
      type: Number,
      default: 0,
    },
    platform: {
      type: String,
      default: '1',
    },
    coaches: [coachSchema],
    classAvailability: [classAvailabilitySchema],
    availableSeatsCount: {
      type: Number,
      default: 0,
    },
    liveTracking: {
      currentStationIndex: { type: Number, default: 0 },
      currentStationName: { type: String, default: '' },
      nextStationName: { type: String, default: '' },
      progressPercentage: { type: Number, default: 0 },
      currentSpeedKmH: { type: Number, default: 0 },
      statusMessage: { type: String, default: 'On Schedule' },
      lastPing: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate remaining available seats
scheduleSchema.pre('save', function (next) {
  if (this.coaches && this.coaches.length > 0) {
    let count = 0;
    this.coaches.forEach((coach) => {
      coach.seats.forEach((seat) => {
        if (!seat.isBooked && seat.status === 'AVAILABLE') count++;
      });
    });
    this.availableSeatsCount = count;
  }
  next();
});

module.exports = mongoose.model('Schedule', scheduleSchema);
