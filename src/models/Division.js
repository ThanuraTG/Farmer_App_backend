const mongoose = require('mongoose');

const divisionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    province: {
      type: String,
      required: true,
      trim: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Map _id to division_id virtual
divisionSchema.virtual('division_id').get(function () {
  return this._id.toHexString();
});

divisionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.division_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

divisionSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.division_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Division = mongoose.model('Division', divisionSchema);

module.exports = Division;
