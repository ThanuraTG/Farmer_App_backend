const mongoose = require('mongoose');

const demandRecordSchema = new mongoose.Schema(
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
    demandQty: {
      type: Number,
      required: true
    },
    stockQty: {
      type: Number,
      required: true
    },
    productionQty: {
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

// Compound unique index to prevent duplicate entries
demandRecordSchema.index({ productId: 1, areaId: 1, month: 1, year: 1 }, { unique: true });

// Map _id to id
demandRecordSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

demandRecordSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const DemandRecord = mongoose.model('DemandRecord', demandRecordSchema);

module.exports = DemandRecord;
