const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../constants/statusEnums');

require('./Province');
require('./District');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      trim: true,
      default: function () {
        return this.title || '';
      }
    },
    type: {
      type: String,
      default: 'general',
      index: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    is_read: {
      type: Boolean,
      default: false
    },
    audience: {
      type: String,
      default: 'all'
    },
    targetProvince: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province',
      default: null
    },
    targetDistrict: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      default: null,
      index: true
    },
    targetCrop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      default: null,
      index: true
    },
    targetUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    startAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ active: 1, startAt: 1, expiresAt: 1 });

const Notification = mongoose.model('Notification', notificationSchema, 'notifications');

module.exports = Notification;
