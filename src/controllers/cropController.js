const Crop = require('../models/Crop');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// Public/Farmer Crop List with Search, Category, Status, Pagination
const getCrops = async (req, res, next) => {
  try {
    const { search, category, status = 'active', page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    if (search) {
      query.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'name.si': { $regex: search, $options: 'i' } },
        { 'name.ta': { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalItems = await Crop.countDocuments(query);
    const crops = await Crop.find(query)
      .sort({ 'name.en': 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('recommendedDistricts', 'name');

    return successResponse(res, 200, 'Crops retrieved', {
      items: crops,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const getCropById = async (req, res, next) => {
  try {
    const crop = await Crop.findById(req.params.id).populate('recommendedDistricts', 'name code');
    if (!crop) {
      return errorResponse(res, 404, 'Crop not found');
    }
    return successResponse(res, 200, 'Crop details retrieved', crop);
  } catch (err) {
    next(err);
  }
};

// Admin CRUD
const adminGetCrops = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalItems = await Crop.countDocuments(query);
    const crops = await Crop.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return successResponse(res, 200, 'Admin crop list retrieved', {
      items: crops,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const createCrop = async (req, res, next) => {
  try {
    const crop = await Crop.create(req.body);
    return successResponse(res, 201, 'Crop created successfully', crop);
  } catch (err) {
    next(err);
  }
};

const updateCrop = async (req, res, next) => {
  try {
    const crop = await Crop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!crop) {
      return errorResponse(res, 404, 'Crop not found');
    }
    return successResponse(res, 200, 'Crop updated successfully', crop);
  } catch (err) {
    next(err);
  }
};

const deleteCrop = async (req, res, next) => {
  try {
    // Prefer soft delete / deactivation for historical integrity
    const crop = await Crop.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!crop) {
      return errorResponse(res, 404, 'Crop not found');
    }
    return successResponse(res, 200, 'Crop deactivated (soft deleted) successfully', crop);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCrops,
  getCropById,
  adminGetCrops,
  createCrop,
  updateCrop,
  deleteCrop
};
