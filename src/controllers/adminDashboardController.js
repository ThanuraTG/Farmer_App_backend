const User = require('../models/User');
const Crop = require('../models/Crop');
const CultivationPlan = require('../models/CultivationPlan');
const MarketPrice = require('../models/MarketPrice');
const EconomicCentre = require('../models/EconomicCentre');
const Notification = require('../models/Notification');
const { getSupplyRiskAnalysis } = require('../services/supply/supplyAnalysisService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      farmerCount,
      cropCount,
      cultivationPlanCount,
      activePlanCount,
      marketRecordCount,
      economicCentreCount,
      activeAlertCount
    ] = await Promise.all([
      User.countDocuments({ role: 'farmer' }),
      Crop.countDocuments({ status: 'active' }),
      CultivationPlan.countDocuments(),
      CultivationPlan.countDocuments({ status: 'active' }),
      MarketPrice.countDocuments(),
      EconomicCentre.countDocuments({ active: true }),
      Notification.countDocuments({ active: true })
    ]);

    // MongoDB Aggregations
    const plansByCrop = await CultivationPlan.aggregate([
      { $group: { _id: '$cropId', count: { $sum: 1 }, totalArea: { $sum: '$normalizedLandSizeAcres' }, totalYieldKg: { $sum: '$expectedYieldKg' } } },
      { $lookup: { from: 'crops', localField: '_id', foreignField: '_id', as: 'crop' } },
      { $unwind: '$crop' },
      { $project: { cropId: '$_id', cropName: '$crop.name', count: 1, totalArea: 1, totalYieldKg: 1 } },
      { $sort: { count: -1 } }
    ]);

    const plansByDistrict = await CultivationPlan.aggregate([
      { $group: { _id: '$districtId', count: { $sum: 1 }, totalArea: { $sum: '$normalizedLandSizeAcres' } } },
      { $lookup: { from: 'districts', localField: '_id', foreignField: '_id', as: 'district' } },
      { $unwind: '$district' },
      { $project: { districtId: '$_id', districtName: '$district.name', count: 1, totalArea: 1 } },
      { $sort: { count: -1 } }
    ]);

    const harvestByMonth = await CultivationPlan.aggregate([
      {
        $group: {
          _id: { year: { $year: '$expectedHarvestDate' }, month: { $month: '$expectedHarvestDate' } },
          totalYieldKg: { $sum: '$expectedYieldKg' },
          planCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // High supply risk crops evaluation
    const activeCrops = await Crop.find({ status: 'active' }).limit(10);
    const highSupplyRiskCrops = [];

    for (const crop of activeCrops) {
      try {
        const riskAnalysis = await getSupplyRiskAnalysis(crop._id);
        if (riskAnalysis.risk === 'high') {
          highSupplyRiskCrops.push({
            cropId: crop._id,
            cropName: crop.name,
            risk: 'high',
            estimatedSupplyKg: riskAnalysis.estimatedExpectedSupplyKg,
            referenceSupplyKg: riskAnalysis.referenceSupplyKg,
            explanation: riskAnalysis.explanation
          });
        }
      } catch (e) {}
    }

    return successResponse(res, 200, 'Admin dashboard analytics retrieved', {
      farmerCount,
      cropCount,
      cultivationPlanCount,
      activePlanCount,
      marketRecordCount,
      economicCentreCount,
      activeAlertCount,
      plansByCrop,
      plansByDistrict,
      harvestByMonth,
      highSupplyRiskCrops
    });
  } catch (err) {
    next(err);
  }
};

// Admin User Management
const getUsers = async (req, res, next) => {
  try {
    const { search, district, status, page = 1, limit = 20 } = req.query;

    const query = { role: 'farmer' };
    if (district) query.district = district;
    if (status) query.accountStatus = status;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalItems = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash -password_hash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('province', 'name')
      .populate('district', 'name');

    return successResponse(res, 200, 'Admin users list retrieved', {
      items: users,
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

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash -password_hash')
      .populate('province', 'name')
      .populate('district', 'name')
      .populate('division', 'name');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'User details retrieved', user);
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return errorResponse(res, 400, 'Valid status is required (active, inactive, suspended)');
    }

    const user = await User.findByIdAndUpdate(req.params.id, { accountStatus: status }, { new: true })
      .select('-passwordHash -password_hash');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'User status updated', user);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus
};
