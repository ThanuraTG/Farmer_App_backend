const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema(
  {
    province: {
      type: String,
      required: true,
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Map _id to id
areaSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

areaSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Area = mongoose.model('Area', areaSchema);

module.exports = Area;
