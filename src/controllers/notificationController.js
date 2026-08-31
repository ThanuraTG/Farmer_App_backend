const notificationService = require('../services/notifications/notificationService');
const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getFarmerNotifications(req.user);
    return successResponse(res, 200, 'Notifications retrieved', notifications);
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const result = await notificationService.markNotificationRead(req.params.id, req.user._id);
    return successResponse(res, 200, result.message);
  } catch (err) {
    next(err);
  }
};

// Admin CRUD
const adminGetNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate('targetDistrict', 'name')
      .populate('targetCrop', 'name');
    return successResponse(res, 200, 'Admin notifications retrieved', notifications);
  } catch (err) {
    next(err);
  }
};

const adminCreateNotification = async (req, res, next) => {
  try {
    const notification = await Notification.create({
      ...req.body,
      createdBy: req.user._id
    });
    return successResponse(res, 201, 'Notification created successfully', notification);
  } catch (err) {
    next(err);
  }
};

const adminUpdateNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }
    return successResponse(res, 200, 'Notification updated', notification);
  } catch (err) {
    next(err);
  }
};

const adminDeleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }
    return successResponse(res, 200, 'Notification deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyNotifications,
  markRead,
  adminGetNotifications,
  adminCreateNotification,
  adminUpdateNotification,
  adminDeleteNotification
};
