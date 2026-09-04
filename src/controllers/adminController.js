const User = require('../models/User');
const Crop = require('../models/Crop');
const MarketPrice = require('../models/MarketPrice');
const Notification = require('../models/Notification');
const { successResponse } = require('../utils/responseHandler');

const getEconomicCentreCount = async () => {
  const [economicCentreIds, marketLocations] = await Promise.all([
    MarketPrice.distinct('economicCentreId', { economicCentreId: { $ne: null } }),
    MarketPrice.distinct('market_location', { market_location: { $nin: [null, ''] } })
  ]);

  return new Set([
    ...economicCentreIds.map((value) => String(value)),
    ...marketLocations
      .filter((value) => typeof value === 'string' && value.trim())
      .map((value) => value.trim().toLowerCase())
  ]).size;
};

const getDashboardStats = async (_req, res, next) => {
  try {
    const [
      totalUsers,
      farmerCount,
      cropCount,
      marketRecordCount,
      activeNotifications,
      cropsByCategory,
      economicCentreCount
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer', accountStatus: 'active' }),
      Crop.countDocuments({ status: 'active' }),
      MarketPrice.countDocuments(),
      Notification.countDocuments({ active: true }),
      Crop.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            category: {
              $cond: [
                { $gt: [{ $strLenCP: { $ifNull: ['$_id', ''] } }, 0] },
                '$_id',
                'Uncategorized'
              ]
            },
            count: 1
          }
        },
        { $sort: { count: -1, category: 1 } }
      ]),
      getEconomicCentreCount()
    ]);

    return successResponse(res, 200, 'Admin dashboard statistics retrieved', {
      farmerCount,
      cropCount,
      cultivationPlanCount: 0,
      activePlanCount: 0,
      marketRecordCount,
      economicCentreCount,
      activeAlertCount: activeNotifications,
      cropsByCategory,
      recentCrops: [],
      harvestByMonth: [],
      totalUsers,
      totalCrops: cropCount,
      totalMarketPrices: marketRecordCount,
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
