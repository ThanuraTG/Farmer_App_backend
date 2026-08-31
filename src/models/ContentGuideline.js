const mongoose = require('mongoose');

const contentGuidelineSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Guideline title is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['crop_care', 'disease_control', 'fertilizer', 'harvesting', 'general_guideline'],
      default: 'general_guideline'
    },
    targetCrops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop'
      }
    ],
    summary: {
      type: String,
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Guideline content body is required']
    },
    published: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    collection: 'content_guidelines'
  }
);

module.exports = mongoose.model('ContentGuideline', contentGuidelineSchema);
