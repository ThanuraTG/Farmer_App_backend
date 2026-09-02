const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: false,
      default: null,
      sparse: true,
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
    mobile: {
      type: String,
      trim: true
    },
    province: {
      type: String,
      trim: true,
      default: ''
    },
    district: {
      type: String,
      trim: true,
      default: ''
    },
    division: {
      type: String,
      trim: true,
      default: ''
    },
    division_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      default: null
    },
    preferredLanguage: {
      type: String,
      default: 'en'
    },
    accountStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Map _id to user_id and id virtuals
userSchema.virtual('user_id').get(function () {
  return this._id ? this._id.toHexString() : null;
});

userSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : null;
});

// Ensure virtual fields are serialized and _id is preserved
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    if (doc._id) {
      const idStr = doc._id.toString();
      ret._id = idStr;
      ret.id = idStr;
      ret.user_id = idStr;
    }
    delete ret.__v;
    return ret;
  }
});

userSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    if (doc._id) {
      const idStr = doc._id.toString();
      ret._id = idStr;
      ret.id = idStr;
      ret.user_id = idStr;
    }
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
