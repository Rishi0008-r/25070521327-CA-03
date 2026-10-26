const mongoose = require('mongoose');

const routeStopSchema = new mongoose.Schema({
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true,
  },
  stationCode: { type: String, required: true, uppercase: true },
  stationName: { type: String, required: true },
  stopOrder: { type: Number, required: true },
  distanceKm: { type: Number, required: true },
  defaultHaltMinutes: { type: Number, default: 2 },
  dayCount: { type: Number, default: 1 },
});

const routeSchema = new mongoose.Schema(
  {
    routeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    sourceStationCode: { type: String, required: true, uppercase: true },
    destinationStationCode: { type: String, required: true, uppercase: true },
    totalDistanceKm: { type: Number, required: true },
    corridor: {
      type: String,
      enum: [
        'Golden Quadrilateral',
        'North-South Corridor',
        'East-West Corridor',
        'Coastal Konkan',
        'North-East Expressway',
        'Regional Arterial',
      ],
      default: 'Regional Arterial',
    },
    stops: [routeStopSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', routeSchema);
