const Crop = require('../models/Crop');
const User = require('../models/User');
const MarketPrice = require('../models/MarketPrice');
const Notification = require('../models/Notification');
const AdminLog = require('../models/AdminLog');

// @desc    Get dashboard statistics for admin panel
// @route   GET /api/admin/stats
// @access  Private (Staff/Admin)
const getAdminStats = async (req, res) => {
  try {
    const [
      totalCrops,
      totalUsers,
      priceRecordsCount,
      alertsCount,
      recentLogs
    ] = await Promise.all([
      Crop.countDocuments({}),
      User.countDocuments({}),
      MarketPrice.countDocuments({}),
      Notification.countDocuments({ is_read: false }),
      AdminLog.find({})
        .populate('admin_id', 'username email')
        .sort({ logged_at: -1 })
        .limit(10)
    ]);

    return res.json({
      total_crops: totalCrops,
      total_users: totalUsers,
      price_records: priceRecordsCount,
      alerts: alertsCount,
      recent_logs: recentLogs
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ message: 'Server error generating dashboard statistics', error: error.message });
  }
};

module.exports = {
  getAdminStats
};
