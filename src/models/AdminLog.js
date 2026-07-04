const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action_type: {
      type: String,
      required: true,
      enum: ['create', 'update', 'delete']
    },
    target_entity: {
      type: String,
      required: true
    },
    target_id: {
      type: String,
      required: true
    },
    logged_at: {
      type: Date,
      default: Date.now
    }
  }
);

// Map _id to log_id virtual
adminLogSchema.virtual('log_id').get(function () {
  return this._id.toHexString();
});

adminLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.log_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

adminLogSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.log_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

module.exports = AdminLog;
