const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    crop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true
    },
    price_per_kg: {
      type: Number,
      required: true
    },
    market_location: {
      type: String,
      required: true,
      trim: true
    },
    price_date: {
      type: Date,
      required: true
    },
    added_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Only created_at timestamp is in schema
  }
);

// Add index for performance as requested in Non-Functional Requirements
marketPriceSchema.index({ crop_id: 1, price_date: -1 });

// Map _id to price_id virtual
marketPriceSchema.virtual('price_id').get(function () {
  return this._id.toHexString();
});

marketPriceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.price_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

marketPriceSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.price_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);

module.exports = MarketPrice;
