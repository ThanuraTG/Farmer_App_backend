const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    nameSi: {
      type: String,
      trim: true
    },
    nameTa: {
      type: String,
      trim: true
    },
    district: {
      type: String,
      trim: true
    },
    province: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual for market_id
marketSchema.virtual('market_id').get(function () {
  return this._id.toHexString();
});

marketSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.market_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Market = mongoose.model('Market', marketSchema);

module.exports = Market;
