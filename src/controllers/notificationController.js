const Notification = require('../models/Notification');

// @desc    Get all notifications for a user
// @route   GET /api/notifications/:userId
// @access  Private
const getNotificationsForUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await Notification.find({ user_id: userId })
      .sort({ sent_at: -1 });

    return res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Server error fetching notifications', error: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Verify ownership
    if (notification.user_id.toString() !== (req.user.user_id || req.user._id).toString()) {
      return res.status(403).json({ message: 'Unauthorized to access this notification' });
    }

    notification.is_read = true;
    await notification.save();

    return res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return res.status(500).json({ message: 'Server error updating notification', error: error.message });
  }
};

module.exports = {
  getNotificationsForUser,
  markAsRead
};
