const mongoose = require('mongoose');
const { CROP_STATUSES } = require('../constants/statusEnums');

const cropSchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true, trim: true },
      si: { type: String, trim: true, default: '' },
      ta: { type: String, trim: true, default: '' }
    },
    scientificName: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: {
      en: { type: String, default: '' },
      si: { type: String, default: '' },
      ta: { type: String, default: '' }
    },
    imageUrl: {
      type: String,
      default: ''
    },
    growingDurationDays: {
      min: { type: Number, default: 60 },
      max: { type: Number, default: 120 }
    },
    suitableSeasons: [
      {
        type: String,
        trim: true
      }
    ],
    recommendedDistricts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'District'
      }
    ],
    soil: {
      types: [{ type: String, trim: true }],
      phMin: { type: Number, default: 5.5 },
      phMax: { type: Number, default: 7.5 },
      drainage: { type: String, default: '' }
    },
    climate: {
      temperatureMin: { type: Number, default: null },
      temperatureMax: { type: Number, default: null },
      temperatureOptimumMin: { type: Number, default: null },
      temperatureOptimumMax: { type: Number, default: null },
      rainfallMin: { type: Number, default: null },
      rainfallMax: { type: Number, default: null },
      humidityMin: { type: Number, default: null },
      humidityMax: { type: Number, default: null }
    },
    planting: {
      varieties: [{ type: String, trim: true }],
      seedRate: { type: String, default: '' },
      spacing: { type: String, default: '' },
      plantingMethod: { type: String, default: '' },
      nurseryGuidance: { type: String, default: '' }
    },
    landPreparation: {
      type: String,
      default: ''
    },
    fertilizer: {
      basal: { type: String, default: '' },
      topDressing: { type: String, default: '' },
      schedule: [mongoose.Schema.Types.Mixed]
    },
    irrigation: {
      requirement: { type: String, default: '' },
      frequency: { type: String, default: '' },
      guidance: { type: String, default: '' }
    },
    pestsAndDiseases: [
      {
        name: { type: String, default: '' },
        type: { type: String, default: '' },
        symptoms: { type: String, default: '' },
        prevention: { type: String, default: '' },
        management: { type: String, default: '' }
      }
    ],
    harvest: {
      expectedDays: { type: Number, default: 90 },
      indicators: { type: String, default: '' },
      method: { type: String, default: '' },
      expectedYieldPerAcre: { type: Number, default: 1000 }
    },
    postHarvest: {
      storage: { type: String, default: '' },
      handling: { type: String, default: '' },
      transportation: { type: String, default: '' }
    },
    referenceCostPerAcre: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: CROP_STATUSES,
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

cropSchema.index({ 'name.en': 'text', 'name.si': 'text', 'name.ta': 'text', category: 1 });

const Crop = mongoose.model('Crop', cropSchema);

module.exports = Crop;
