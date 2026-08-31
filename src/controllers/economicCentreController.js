const EconomicCentre = require('../models/EconomicCentre');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getEconomicCentres = async (req, res, next) => {
  try {
    const centres = await EconomicCentre.find({ active: true })
      .sort({ name: 1 })
      .populate('districtId', 'name');
    return successResponse(res, 200, 'Economic centres retrieved', centres);
  } catch (err) {
    next(err);
  }
};

const adminGetEconomicCentres = async (req, res, next) => {
  try {
    const centres = await EconomicCentre.find()
      .sort({ createdAt: -1 })
      .populate('districtId', 'name');
    return successResponse(res, 200, 'Admin economic centres retrieved', centres);
  } catch (err) {
    next(err);
  }
};

const createEconomicCentre = async (req, res, next) => {
  try {
    const centre = await EconomicCentre.create(req.body);
    return successResponse(res, 201, 'Economic centre created', centre);
  } catch (err) {
    next(err);
  }
};

const updateEconomicCentre = async (req, res, next) => {
  try {
    const centre = await EconomicCentre.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!centre) {
      return errorResponse(res, 404, 'Economic centre not found');
    }
    return successResponse(res, 200, 'Economic centre updated', centre);
  } catch (err) {
    next(err);
  }
};

const deleteEconomicCentre = async (req, res, next) => {
  try {
    const centre = await EconomicCentre.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!centre) {
      return errorResponse(res, 404, 'Economic centre not found');
    }
    return successResponse(res, 200, 'Economic centre deactivated', centre);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEconomicCentres,
  adminGetEconomicCentres,
  createEconomicCentre,
  updateEconomicCentre,
  deleteEconomicCentre
};
