const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true,
      index: true
    },
    economicCentreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EconomicCentre',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    minPrice: {
      type: Number,
      required: true,
      min: 0
    },
    maxPrice: {
      type: Number,
      required: true,
      min: 0
    },
    averagePrice: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      default: 'kg',
      trim: true
    },
    source: {
      type: String,
      default: 'manual',
      trim: true
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index for crop + economic centre + date
marketPriceSchema.index({ cropId: 1, economicCentreId: 1, date: 1 }, { unique: true });
marketPriceSchema.index({ cropId: 1, date: -1 });

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);

module.exports = MarketPrice;
