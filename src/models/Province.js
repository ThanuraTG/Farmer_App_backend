const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema(
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

provinceSchema.index({ 'name.en': 1, code: 1 });

const Province = mongoose.models.Province || mongoose.model('Province', provinceSchema, 'provinces');

module.exports = Province;
