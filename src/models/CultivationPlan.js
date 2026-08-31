const mongoose = require('mongoose');
const { PLAN_STATUSES, LAND_UNITS } = require('../constants/statusEnums');

const cultivationPlanSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true,
      index: true
    },
    provinceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province',
      required: true,
      index: true
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
      index: true
    },
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      default: null
    },
    landSize: {
      type: Number,
      required: true,
      min: [0.0001, 'Land size must be greater than 0']
    },
    landUnit: {
      type: String,
      enum: LAND_UNITS,
      default: 'acres',
      lowercase: true
    },
    normalizedLandSizeAcres: {
      type: Number,
      required: true,
      min: 0
    },
    plantingDate: {
      type: Date,
      required: true
    },
    expectedHarvestDate: {
      type: Date,
      required: true
    },
    expectedYieldKg: {
      type: Number,
      required: true,
      min: 0
    },
    estimatedCultivationCost: {
      type: Number,
      default: null,
      min: 0
    },
    status: {
      type: String,
      enum: PLAN_STATUSES,
      default: 'planned',
      lowercase: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

cultivationPlanSchema.index({ cropId: 1, expectedHarvestDate: 1, status: 1 });
cultivationPlanSchema.index({ districtId: 1, expectedHarvestDate: 1, status: 1 });
cultivationPlanSchema.index({ farmerId: 1, status: 1 });

const CultivationPlan = mongoose.model('CultivationPlan', cultivationPlanSchema);

module.exports = CultivationPlan;
