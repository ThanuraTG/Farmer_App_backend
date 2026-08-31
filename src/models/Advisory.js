const mongoose = require('mongoose');

const advisorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: 'General'
    },
    targetDistricts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'District'
      }
    ],
    targetCrops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop'
      }
    ],
    severity: {
      type: String,
      enum: ['info', 'warning', 'urgent'],
      default: 'info'
    },
    start: {
      type: Date,
      default: Date.now
    },
    expiry: {
      type: Date,
      default: null
    },
    source: {
      type: String,
      default: 'Department of Agriculture'
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Advisory = mongoose.model('Advisory', advisorySchema);

module.exports = Advisory;
