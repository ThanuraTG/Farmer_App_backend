const Notification = require('../../models/Notification');

const getFarmerNotifications = async (user) => {
  const now = new Date();

  const query = {
    active: true,
    startAt: { $lte: now },
    $and: [
      { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
      {
        $or: [
          { audience: 'all' },
          { audience: 'farmers' },
          { targetDistrict: user.district },
          { targetUsers: user._id }
        ]
      }
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

  if (!notification.readBy.some((id) => id.toString() === userId.toString())) {
    notification.readBy.push(userId);
    await notification.save();
  }

  return { message: 'Notification marked as read' };
};

module.exports = {
  getFarmerNotifications,
  markNotificationRead
};
