const cultivationService = require('../services/cultivation/cultivationService');
const CultivationPlan = require('../models/CultivationPlan');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const createPlan = async (req, res, next) => {
  try {
    const plan = await cultivationService.createPlan(req.user._id, req.body);
    return successResponse(res, 201, 'Cultivation plan created successfully', plan);
  } catch (err) {
    next(err);
  }
};

const getMyPlans = async (req, res, next) => {
  try {
    const plans = await cultivationService.getFarmerPlans(req.user._id);
    return successResponse(res, 200, 'My cultivation plans retrieved', plans);
  } catch (err) {
    next(err);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const plan = await cultivationService.getPlanById(req.params.id, req.user.role === 'admin' ? null : req.user._id);
    return successResponse(res, 200, 'Cultivation plan details retrieved', plan);
  } catch (err) {
    next(err);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const updated = await cultivationService.updatePlan(req.params.id, req.user._id, req.body);
    return successResponse(res, 200, 'Cultivation plan updated successfully', updated);
  } catch (err) {
    next(err);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const result = await cultivationService.deletePlan(req.params.id, req.user._id);
    return successResponse(res, 200, result.message);
  } catch (err) {
    next(err);
  }
};

// Admin Endpoints
const adminGetPlans = async (req, res, next) => {
  try {
    const data = await cultivationService.getAdminPlans(req.query);
    return successResponse(res, 200, 'Admin cultivation plans retrieved', data);
  } catch (err) {
    next(err);
  }
};

const adminUpdatePlanStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return errorResponse(res, 400, 'status field is required');
    }

    const plan = await CultivationPlan.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!plan) {
      return errorResponse(res, 404, 'Cultivation plan not found');
    }
    return successResponse(res, 200, 'Cultivation plan status updated', plan);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPlan,
  getMyPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  adminGetPlans,
  adminUpdatePlanStatus
};
