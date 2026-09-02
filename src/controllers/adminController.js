const User = require('../models/User');
const Crop = require('../models/Crop');
const MarketPrice = require('../models/MarketPrice');
const Notification = require('../models/Notification');
const { successResponse } = require('../utils/responseHandler');

const getDashboardStats = async (_req, res, next) => {
  try {
    const [totalUsers, totalCrops, totalMarketPrices, activeNotifications] = await Promise.all([
      User.countDocuments(),
      Crop.countDocuments({ status: 'active' }),
      MarketPrice.countDocuments(),
      Notification.countDocuments({ active: true })
    ]);

    return successResponse(res, 200, 'Admin dashboard statistics retrieved', {
      totalUsers,
      totalCrops,
      totalMarketPrices,
      activeNotifications,
      // These arrays keep the reports screen functional until cultivation-plan data is introduced.
      plansByCrop: [],
      plansByDistrict: [],
      highSupplyRiskCrops: []
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
