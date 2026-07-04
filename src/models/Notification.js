const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['price_alert', 'weather_alert', 'system'],
      default: 'system'
    },
    title: {
      type: String,
      required: true
    },
    is_read: {
      type: Boolean,
      default: false
    },
    sent_at: {
      type: Date,
      default: Date.now
    }
  }
);

// Map _id to notif_id virtual
notificationSchema.virtual('notif_id').get(function () {
  return this._id.toHexString();
});

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.notif_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

notificationSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.notif_id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
