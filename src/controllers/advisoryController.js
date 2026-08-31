const notificationService = require('../services/notifications/notificationService');
const Advisory = require('../models/Advisory');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getAdvisories = async (req, res, next) => {
  try {
    const { districtId, cropId } = req.query;
    const advisories = await notificationService.getFarmerAdvisories(districtId, cropId);
    return successResponse(res, 200, 'Agricultural advisories retrieved', advisories);
  } catch (err) {
    next(err);
  }
};

const adminGetAdvisories = async (req, res, next) => {
  try {
    const advisories = await Advisory.find().sort({ createdAt: -1 });
    return successResponse(res, 200, 'Admin advisories list retrieved', advisories);
  } catch (err) {
    next(err);
  }
};

const adminCreateAdvisory = async (req, res, next) => {
  try {
    const advisory = await Advisory.create(req.body);
    return successResponse(res, 201, 'Advisory created successfully', advisory);
  } catch (err) {
    next(err);
  }
};

const adminUpdateAdvisory = async (req, res, next) => {
  try {
    const advisory = await Advisory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!advisory) {
      return errorResponse(res, 404, 'Advisory not found');
    }
    return successResponse(res, 200, 'Advisory updated', advisory);
  } catch (err) {
    next(err);
  }
};

const adminDeleteAdvisory = async (req, res, next) => {
  try {
    const advisory = await Advisory.findByIdAndDelete(req.params.id);
    if (!advisory) {
      return errorResponse(res, 404, 'Advisory not found');
    }
    return successResponse(res, 200, 'Advisory deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdvisories,
  adminGetAdvisories,
  adminCreateAdvisory,
  adminUpdateAdvisory,
  adminDeleteAdvisory
};
