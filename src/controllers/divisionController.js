const mongoose = require('mongoose');
const Division = require('../models/Division');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const listDivisions = async (req, res, next) => {
  try {
    const { search, province, page = 1, limit = 100 } = req.query;
    const query = {};
    if (province) query.province = { $regex: province, $options: 'i' };
    if (search) query.$or = [
      { 'name.en': { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { province: { $regex: search, $options: 'i' } }
    ];

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 200);
    const totalItems = await Division.countDocuments(query);
    const items = await Division.find(query)
      .sort({ 'name.en': 1, name: 1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    return successResponse(res, 200, 'Divisions retrieved', {
      items,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
};

const createDivision = async (req, res, next) => {
  try {
    const division = await Division.create(req.body);
    return successResponse(res, 201, 'Division created', division);
  } catch (error) {
    next(error);
  }
};

const updateDivision = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Invalid division ID');
    }
    const division = await Division.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!division) return errorResponse(res, 404, 'Division not found');
    return successResponse(res, 200, 'Division updated', division);
  } catch (error) {
    next(error);
  }
};

const deleteDivision = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Invalid division ID');
    }
    const division = await Division.findByIdAndDelete(req.params.id);
    if (!division) return errorResponse(res, 404, 'Division not found');
    return successResponse(res, 200, 'Division deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { listDivisions, createDivision, updateDivision, deleteDivision };
