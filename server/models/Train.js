const mongoose = require('mongoose');

const stationStopSchema = new mongoose.Schema({
  stationName: { type: String, required: true },
  stationCode: { type: String, required: true, uppercase: true },
  stopOrder: { type: Number, required: true },
  arrivalTime: { type: String, required: true },
  departureTime: { type: String, required: true },
  distanceKm: { type: Number, default: 0 },
  platform: { type: String, default: '1' },
  lat: { type: Number, default: 0 },
  lng: { type: Number, default: 0 },
  haltMinutes: { type: Number, default: 2 },
});

const trainClassSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    enum: ['1A', '2A', '3A', '3E', 'CC', 'EC', 'SL', '2S'],
  },
  baseFare: { type: Number, required: true },
  reservationCharge: { type: Number, default: 40 },
  superfastCharge: { type: Number, default: 45 },
  totalSeats: { type: Number, required: true, default: 72 },
});

const trainSchema = new mongoose.Schema(
  {
    trainNumber: {
      type: String,
      required: [true, 'Train number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Train name is required'],
      trim: true,
      index: true,
    },
    trainType: {
      type: String,
      enum: [
        'Vande Bharat',
        'Rajdhani',
        'Shatabdi',
        'Duronto',
        'Garib Rath',
        'Superfast Express',
        'Mail Express',
        'Tejas Express',
      ],
      default: 'Superfast Express',
    },
    source: {
      stationName: { type: String, required: true },
      stationCode: { type: String, required: true, uppercase: true, index: true },
    },
    destination: {
      stationName: { type: String, required: true },
      stationCode: { type: String, required: true, uppercase: true, index: true },
    },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    durationHours: { type: String, default: '12h 30m' },
    intermediateStations: [stationStopSchema],
    classes: [trainClassSchema],
    totalSeats: { type: Number, default: 400 },
    daysOfRun: {
      type: [String],
      default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    speedKmH: { type: Number, default: 110 },
    pantryCar: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Compound text index for search
trainSchema.index({
  trainNumber: 'text',
  name: 'text',
  'source.stationName': 'text',
  'source.stationCode': 'text',
  'destination.stationName': 'text',
  'destination.stationCode': 'text',
});

module.exports = mongoose.model('Train', trainSchema);
