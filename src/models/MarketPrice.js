const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      index: true
    },
    crop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop'
    },
    economicCentreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EconomicCentre',
      index: true
    },
    market_location: {
      type: String,
      default: ''
    },
    date: {
      type: Date,
      index: true
    },
    price_date: {
      type: Date
    },
    minPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    maxPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    averagePrice: {
      type: Number,
      default: 0,
      min: 0
    },
    price_per_kg: {
      type: Number,
      default: 0
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
    added_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

// Pre-save hook to ensure field synchronization between camelCase and snake_case
marketPriceSchema.pre('save', function (next) {
  if (this.crop_id && !this.cropId) this.cropId = this.crop_id;
  if (this.cropId && !this.crop_id) this.crop_id = this.cropId;
  if (this.price_date && !this.date) this.date = this.price_date;
  if (this.date && !this.price_date) this.price_date = this.date;
  if (this.price_per_kg && !this.averagePrice) this.averagePrice = this.price_per_kg;
  if (this.averagePrice && !this.price_per_kg) this.price_per_kg = this.averagePrice;
  if (!this.minPrice) this.minPrice = this.averagePrice || this.price_per_kg || 0;
  if (!this.maxPrice) this.maxPrice = this.averagePrice || this.price_per_kg || 0;
  next();
});

// Compound index for crop + date lookup
marketPriceSchema.index({ cropId: 1, date: -1 });
marketPriceSchema.index({ market_location: 1, date: -1 });

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema, 'marketPrices');

module.exports = MarketPrice;
