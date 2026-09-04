const mongoose = require('mongoose');

require('./Province');

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    provinceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province',
      default: null,
      index: true
    },
    province: {
      type: mongoose.Schema.Types.Mixed,
      default: ''
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

districtSchema.index({ 'name.en': 1, code: 1 });

const District = mongoose.models.District || mongoose.model('District', districtSchema, 'districts');

module.exports = District;
