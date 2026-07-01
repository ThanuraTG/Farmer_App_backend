const mongoose = require('mongoose');

const priceRecordSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      required: true
    },
    originalPrice: {
      type: Number,
      required: true
    },
    areaPrice: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index to prevent duplicate entries for the same product in the same area/month/year
priceRecordSchema.index({ productId: 1, areaId: 1, month: 1, year: 1 }, { unique: true });

// Map _id to id
priceRecordSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

priceRecordSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const PriceRecord = mongoose.model('PriceRecord', priceRecordSchema);

module.exports = PriceRecord;
