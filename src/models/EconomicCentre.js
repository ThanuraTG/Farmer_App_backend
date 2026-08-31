const mongoose = require('mongoose');

const economicCentreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      default: null,
      index: true
    },
    districtName: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

economicCentreSchema.index({ name: 1, districtId: 1 });

const EconomicCentre = mongoose.model('EconomicCentre', economicCentreSchema);

module.exports = EconomicCentre;
