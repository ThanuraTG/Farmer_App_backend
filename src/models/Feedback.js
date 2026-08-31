const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    farmerName: {
      type: String,
      trim: true
    },
    mobile: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['general', 'crop_advice', 'market_prices', 'weather', 'app_bug', 'other'],
      default: 'general'
    },
    message: {
      type: String,
      required: [true, 'Feedback message is required'],
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending'
    },
    adminNotes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'feedback'
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
