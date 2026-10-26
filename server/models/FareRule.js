const mongoose = require('mongoose');

const fareRuleSchema = new mongoose.Schema(
  {
    trainType: {
      type: String,
      required: true,
      enum: [
        'Vande Bharat',
        'Rajdhani',
        'Shatabdi',
        'Duronto',
        'Tejas Express',
        'Garib Rath',
        'Superfast Express',
        'Mail Express',
      ],
      index: true,
    },
    className: {
      type: String,
      required: true,
      enum: ['1A', '2A', '3A', '3E', 'CC', 'EC', 'SL', '2S'],
      index: true,
    },
    baseRatePerKm: {
      type: Number,
      required: true,
    },
    minDistanceKm: {
      type: Number,
      default: 50,
    },
    minBaseFare: {
      type: Number,
      required: true,
    },
    reservationCharge: {
      type: Number,
      default: 40,
    },
    superfastCharge: {
      type: Number,
      default: 45,
    },
    tatkalRatePerKm: {
      type: Number,
      default: 0.35,
    },
    gstPercent: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

fareRuleSchema.index({ trainType: 1, className: 1 }, { unique: true });

// Helper function to calculate fare between two stations based on distance
fareRuleSchema.statics.calculateFare = async function (trainType, className, distanceKm, isTatkal = false) {
  let rule = await this.findOne({ trainType, className });
  if (!rule) {
    // Default fallback rule
    rule = await this.findOne({ trainType: 'Superfast Express', className: 'SL' });
  }

  const effectiveDistance = Math.max(distanceKm || 350, rule ? rule.minDistanceKm : 50);
  const rate = rule ? rule.baseRatePerKm : 0.48;
  const minFare = rule ? rule.minBaseFare : 180;
  const resCharge = rule ? rule.reservationCharge : 40;
  const sfCharge = rule ? rule.superfastCharge : 45;

  let baseFare = Math.round(Math.max(minFare, effectiveDistance * rate));
  let tatkalCharge = 0;
  if (isTatkal) {
    tatkalCharge = Math.round(Math.max(150, baseFare * 0.3));
  }

  const subtotal = baseFare + resCharge + sfCharge + tatkalCharge;
  const gst = Math.round(subtotal * ((rule ? rule.gstPercent : 5) / 100));
  const totalFare = subtotal + gst;

  return {
    distanceKm: effectiveDistance,
    baseFare,
    reservationCharge: resCharge,
    superfastCharge: sfCharge,
    tatkalCharge,
    gst,
    totalFare,
  };
};

module.exports = mongoose.model('FareRule', fareRuleSchema);
