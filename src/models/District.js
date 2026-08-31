const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true, trim: true },
      si: { type: String, trim: true, default: '' },
      ta: { type: String, trim: true, default: '' }
    },
    provinceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province',
      required: true,
      index: true
    },
    code: {
      type: String,
      trim: true
    },
    // Optional coordinates for weather API fallback
    coordinates: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null }
    }
  },
  {
    timestamps: true
  }
);

districtSchema.index({ provinceId: 1, 'name.en': 1 });

const District = mongoose.model('District', districtSchema);

module.exports = District;
