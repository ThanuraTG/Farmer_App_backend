const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password_hash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['farmer', 'admin', 'manager', 'data_entry'],
      default: 'farmer'
    },
    phone_number: {
      type: String,
      trim: true
    },
    division_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Map _id to user_id virtual
userSchema.virtual('user_id').get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.user_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

userSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.user_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
