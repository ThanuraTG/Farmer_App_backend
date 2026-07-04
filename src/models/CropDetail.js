const mongoose = require('mongoose');

const cropDetailSchema = new mongoose.Schema(
  {
    crop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true,
      unique: true
    },
    growing_tips: {
      type: String,
      trim: true
    },
    soil_type: {
      type: String,
      trim: true
    },
    pest_management: {
      type: String,
      trim: true
    },
    harvest_duration_days: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: { createdAt: false, updatedAt: true } // crop_detail schema specifies updated_at timestamp only
  }
);

// Map _id to detail_id virtual
cropDetailSchema.virtual('detail_id').get(function () {
  return this._id.toHexString();
});

cropDetailSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.detail_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

cropDetailSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.detail_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const CropDetail = mongoose.model('CropDetail', cropDetailSchema);

module.exports = CropDetail;
