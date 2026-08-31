const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema(
  {
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true
    },

    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
      required: true
    },

    source: {
      type: String,
      enum: ['HARTI', 'CBSL'],
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    price: {
      min: Number,
      max: Number,
      average: Number
    },

    unit: {
      type: String,
      default: 'kg'
    },

    currency: {
      type: String,
      default: 'LKR'
    },

    priceType: {
      type: String,
      enum: ['Wholesale', 'Retail'],
      default: 'Wholesale'
    }
  },
  {
    timestamps: true
  }
);

priceSchema.index({
  crop: 1,
  market: 1,
  source: 1,
  date: 1
});

// Virtual for price_id
priceSchema.virtual('price_id').get(function () {
  return this._id.toHexString();
});

priceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.price_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Price', priceSchema);
