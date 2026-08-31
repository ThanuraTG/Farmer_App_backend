const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    type: {
      type: String,
      default: 'official',
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    lastSync: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'error', 'syncing'],
      default: 'active'
    },
    recordCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

sourceSchema.virtual('source_id').get(function () {
  return this._id.toHexString();
});

sourceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.source_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Source = mongoose.model('Source', sourceSchema);

module.exports = Source;
