const mongoose = require('mongoose');

const savedCropSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    crop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true
    },
    saved_at: {
      type: Date,
      default: Date.now
    }
  }
);

// Map _id to saved_id virtual
savedCropSchema.virtual('saved_id').get(function () {
  return this._id.toHexString();
});

savedCropSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.saved_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

savedCropSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.saved_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const SavedCrop = mongoose.model('SavedCrop', savedCropSchema);

module.exports = SavedCrop;
