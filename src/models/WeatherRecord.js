const mongoose = require('mongoose');

const weatherRecordSchema = new mongoose.Schema(
  {
    division_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      required: true
    },
    record_date: {
      type: Date,
      required: true
    },
    temperature_c: {
      type: Number,
      required: true
    },
    humidity_percent: {
      type: Number,
      required: true
    },
    rainfall_mm: {
      type: Number,
      required: true
    },
    condition: {
      type: String,
      required: true,
      trim: true
    },
    fetched_at: {
      type: Date,
      default: Date.now
    }
  }
);

// Add index for performance as requested in Non-Functional Requirements
weatherRecordSchema.index({ division_id: 1, record_date: -1 });

// Map _id to weather_id virtual
weatherRecordSchema.virtual('weather_id').get(function () {
  return this._id.toHexString();
});

weatherRecordSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.weather_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

weatherRecordSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.weather_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const WeatherRecord = mongoose.model('WeatherRecord', weatherRecordSchema);

module.exports = WeatherRecord;
