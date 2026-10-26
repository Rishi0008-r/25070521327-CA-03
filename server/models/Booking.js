const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  coachNumber: { type: String, required: true },
  seatNumber: { type: String, required: true },
  berthPreference: {
    type: String,
    enum: ['LOWER', 'MIDDLE', 'UPPER', 'SIDE LOWER', 'SIDE UPPER', 'WINDOW', 'AISLE', 'NO PREFERENCE'],
    default: 'LOWER',
  },
  seatType: { type: String, default: 'WINDOW' },
  classType: { type: String, default: '3A' },
  currentStatus: { type: String, default: 'CNF' }, // 'CNF' | 'RAC' | 'WL'
  fare: { type: Number, required: true },
});

const fareBreakdownSchema = new mongoose.Schema({
  baseFare: { type: Number, required: true },
  reservationCharge: { type: Number, default: 40 },
  superfastCharge: { type: Number, default: 45 },
  tatkalCharge: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  totalFare: { type: Number, required: true },
});

const bookingSchema = new mongoose.Schema(
  {
    pnr: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    train: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Train',
      required: true,
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      required: true,
    },
    trainNumber: { type: String, required: true, index: true },
    trainName: { type: String, required: true },
    source: { type: String, required: true },
    destination: { type: String, required: true },
    travelDate: { type: String, required: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    quota: {
      type: String,
      enum: ['GN', 'TQ', 'LD', 'PT', 'SS'],
      default: 'GN',
    },
    selectedClass: {
      type: String,
      default: '3A',
    },
    passengers: [passengerSchema],
    fareBreakdown: fareBreakdownSchema,
    totalFare: { type: Number, required: true },
    bookingStatus: {
      type: String,
      enum: ['CONFIRMED', 'RAC', 'WAITLISTED', 'CANCELLED'],
      default: 'CONFIRMED',
    },
    chartStatus: {
      type: String,
      enum: ['Chart Not Prepared', 'Chart Prepared'],
      default: 'Chart Not Prepared',
    },
    confirmationProbability: {
      type: Number,
      default: 98, // ConfirmTkt prediction %
    },
    // MakeMyTrip Premium Add-ons
    addOns: {
      zeroCancellation: {
        selected: { type: Boolean, default: false },
        fee: { type: Number, default: 0 },
      },
      travelInsurance: {
        selected: { type: Boolean, default: false },
        fee: { type: Number, default: 0 },
        policyNumber: { type: String, default: '' },
      },
      mealPreference: {
        selected: { type: Boolean, default: false },
        mealType: { type: String, default: 'VEG' },
        fee: { type: Number, default: 0 },
      },
    },
    // Ixigo Smart Split Ticketing
    isSplitTicket: {
      type: Boolean,
      default: false,
    },
    splitDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // IRCTC Tatkal Time-Lock & Audit Metadata
    tatkalMetadata: {
      bookingTimeIST: { type: String, default: '' },
      windowOpenedAtIST: { type: String, default: '' },
      isTimeLockVerified: { type: Boolean, default: false },
      evaluationBypass: { type: Boolean, default: false },
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'REFUNDED', 'PENDING'],
      default: 'PAID',
    },
    paymentMethod: {
      type: String,
      default: 'UPI',
    },
    paymentId: {
      type: String,
      default: () => `PAY_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    },
    qrData: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
