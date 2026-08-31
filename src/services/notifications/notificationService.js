const Notification = require('../../models/Notification');
const Advisory = require('../../models/Advisory');

const getFarmerNotifications = async (user) => {
  const now = new Date();

  const query = {
    active: true,
    startAt: { $lte: now },
    $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
    $or: [
      { audience: 'all' },
      { audience: 'farmers' },
      { targetDistrict: user.district },
      { targetUsers: user._id }
    ]
  };

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .populate('targetCrop', 'name')
    .populate('targetDistrict', 'name');

  return notifications.map(n => {
    const obj = n.toObject();
    obj.isRead = n.readBy && n.readBy.some(id => id.toString() === user._id.toString());
    return obj;
  });
};

const markNotificationRead = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    throw err;
  }

  if (!notification.readBy.includes(userId)) {
    notification.readBy.push(userId);
    await notification.save();
  }

  return { message: 'Notification marked as read' };
};

const getFarmerAdvisories = async (districtId = null, cropId = null) => {
  const now = new Date();
  const query = {
    active: true,
    start: { $lte: now },
    $or: [{ expiry: null }, { expiry: { $gte: now } }]
  };

  if (districtId) {
    query.$or = [{ targetDistricts: { $size: 0 } }, { targetDistricts: districtId }];
  }

  return Advisory.find(query)
    .sort({ start: -1 })
    .populate('targetDistricts', 'name')
    .populate('targetCrops', 'name');
};

module.exports = {
  getFarmerNotifications,
  markNotificationRead,
  getFarmerAdvisories
};
