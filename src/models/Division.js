const mongoose = require('mongoose');

const divisionSchema = new mongoose.Schema(
  {
    name: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      default: null,
      index: true
    },
    province: {
      type: String,
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

divisionSchema.index({ districtId: 1, 'name.en': 1 });

const Division = mongoose.model('Division', divisionSchema, 'divisions');

module.exports = Division;
