const mongoose = require('mongoose');

const weatherCacheSchema = new mongoose.Schema(
  {
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
      index: true
    },
    weatherType: {
      type: String,
      enum: ['current', 'forecast'],
      required: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    fetchedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index automatically removes expired docs
    }
  },
  {
    timestamps: true
  }
);

weatherCacheSchema.index({ districtId: 1, weatherType: 1 }, { unique: true });

const WeatherCache = mongoose.model('WeatherCache', weatherCacheSchema);

module.exports = WeatherCache;
