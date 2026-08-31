const mongoose = require('mongoose');

const supplyBaselineSchema = new mongoose.Schema(
  {
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true,
      index: true
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      default: null,
      index: true
    },
    month: {
      type: Number, // 1 to 12
      required: true,
      min: 1,
      max: 12
    },
    referenceSupplyKg: {
      type: Number,
      required: true,
      min: 0
    },
    source: {
      type: String,
      default: 'Admin Reference Baseline'
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

supplyBaselineSchema.index({ cropId: 1, districtId: 1, month: 1 });

const SupplyBaseline = mongoose.model('SupplyBaseline', supplyBaselineSchema);

module.exports = SupplyBaseline;
