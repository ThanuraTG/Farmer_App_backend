const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true, trim: true },
      si: { type: String, trim: true, default: '' },
      ta: { type: String, trim: true, default: '' }
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Province = mongoose.model('Province', provinceSchema);

module.exports = Province;
