const mongoose = require('mongoose');

const cropDetailSchema = new mongoose.Schema(
  {
    crop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true,
      unique: true
    },
    growing_tips: {
      type: String,
      trim: true
    },
    soil_type: {
      type: String,
      trim: true
    },
    pest_management: {
      type: String,
      trim: true
    },
    harvest_duration_days: {
      type: Number,
      required: true,
      default: 90
    },
    // Decision Support & Comprehensive Agricultural Information
    scientific_name: { type: String, trim: true },
    suitable_regions: [{ type: String, trim: true }],
    
    // Cultivation Period
    recommended_planting_period: { type: String, trim: true },
    recommended_months: [{ type: String, trim: true }],
    suitable_seasons: [{ type: String, trim: true }],
    best_cultivation_period: { type: String, trim: true },
    off_season_period: { type: String, trim: true },
    region_recommendations: { type: String, trim: true },

    // Expected Harvesting Period Timeline
    germination_period: { type: String, trim: true },
    growth_period: { type: String, trim: true },
    first_harvest_period: { type: String, trim: true },
    harvesting_duration: { type: String, trim: true },
    avg_days_to_maturity: { type: Number, default: 90 },

    // Cultivation Method
    land_preparation: {
      soil_prep: { type: String, trim: true },
      soil_type: { type: String, trim: true },
      soil_ph: { type: String, trim: true },
      land_prep_reqs: { type: String, trim: true }
    },
    planting_info: {
      seed_requirement: { type: String, trim: true },
      planting_method: { type: String, trim: true },
      plant_spacing: { type: String, trim: true },
      row_spacing: { type: String, trim: true },
      planting_depth: { type: String, trim: true }
    },
    water_requirement: {
      irrigation_requirement: { type: String, trim: true },
      watering_frequency: { type: String, trim: true },
      critical_periods: { type: String, trim: true }
    },
    fertilizer_info: {
      basal_fertilizer: { type: String, trim: true },
      stages: [{ type: String, trim: true }],
      organic_fertilizer: { type: String, trim: true },
      key_nutrients: { type: String, trim: true }
    },
    pest_info: [
      {
        name: { type: String, trim: true },
        symptoms: { type: String, trim: true },
        prevention: { type: String, trim: true }
      }
    ],
    disease_info: [
      {
        name: { type: String, trim: true },
        symptoms: { type: String, trim: true },
        prevention: { type: String, trim: true }
      }
    ],

    // Weather Suitability Thresholds
    weather_tolerance: {
      min_temp: { type: Number, default: 15 },
      max_temp: { type: Number, default: 35 },
      optimal_temp: { type: String, trim: true },
      rainfall_tolerance: { type: String, trim: true },
      max_rainfall_mm: { type: Number, default: 150 },
      optimal_humidity: { type: String, trim: true },
      sunlight_requirement: { type: String, trim: true }
    },

    // Yield Information
    yield_info: {
      yield_per_acre: { type: String, trim: true },
      yield_per_hectare: { type: String, trim: true },
      yield_range: { type: String, trim: true },
      factors: [{ type: String, trim: true }]
    },

    // Harvesting & Post-Harvest
    harvesting_info: {
      when_to_harvest: { type: String, trim: true },
      maturity_indicators: { type: String, trim: true },
      harvesting_method: { type: String, trim: true },
      frequency: { type: String, trim: true },
      precautions: { type: String, trim: true },
      expected_harvests: { type: String, trim: true }
    },
    post_harvest_info: {
      cleaning_sorting: { type: String, trim: true },
      grading: { type: String, trim: true },
      packaging: { type: String, trim: true },
      storage: { type: String, trim: true },
      transportation: { type: String, trim: true },
      shelf_life: { type: String, trim: true }
    },

    // Financial & Profitability Baseline (per acre)
    financial_baseline: {
      seeds_cost: { type: Number, default: 0 },
      fertilizer_cost: { type: Number, default: 0 },
      labour_cost: { type: Number, default: 0 },
      irrigation_cost: { type: Number, default: 0 },
      pest_control_cost: { type: Number, default: 0 },
      other_cost: { type: Number, default: 0 },
      avg_yield_kg: { type: Number, default: 0 }
    },

    // Data Source Metadata
    source_info: {
      source_name: { type: String, default: 'Department of Agriculture, Sri Lanka (DOA)' },
      source_url: { type: String, trim: true },
      last_updated: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: { createdAt: false, updatedAt: true } // crop_detail schema specifies updated_at timestamp only
  }
);

// Map _id to detail_id virtual
cropDetailSchema.virtual('detail_id').get(function () {
  return this._id.toHexString();
});

cropDetailSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.detail_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

cropDetailSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.detail_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const CropDetail = mongoose.model('CropDetail', cropDetailSchema, 'cropDetails');

module.exports = CropDetail;
