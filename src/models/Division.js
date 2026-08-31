const mongoose = require('mongoose');

const divisionSchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true, trim: true },
      si: { type: String, trim: true, default: '' },
      ta: { type: String, trim: true, default: '' }
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

divisionSchema.index({ districtId: 1, 'name.en': 1 });

const Division = mongoose.model('Division', divisionSchema);

module.exports = Division;
