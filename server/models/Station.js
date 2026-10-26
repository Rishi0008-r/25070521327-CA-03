const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
    },
    zone: {
      type: String,
      required: true,
      index: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    platforms: {
      type: Number,
      default: 4,
    },
    category: {
      type: String,
      enum: ['A1', 'A', 'B', 'C', 'D'],
      default: 'A1',
    },
  },
  { timestamps: true }
);

stationSchema.index({ code: 'text', name: 'text', city: 'text' });

module.exports = mongoose.model('Station', stationSchema);
