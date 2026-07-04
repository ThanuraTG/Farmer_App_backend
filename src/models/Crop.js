const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Food Crops', 'Export & Commercial'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    season: {
      type: String,
      trim: true
    },
    image_url: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Map _id to crop_id virtual
cropSchema.virtual('crop_id').get(function () {
  return this._id.toHexString();
});

cropSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.crop_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

cropSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.crop_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Crop = mongoose.model('Crop', cropSchema);

module.exports = Crop;
