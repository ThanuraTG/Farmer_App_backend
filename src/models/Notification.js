const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../constants/statusEnums');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      default: 'general',
      index: true
    },
    audience: {
      type: String,
      enum: ['all', 'farmers', 'district', 'crop', 'specific'],
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

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
