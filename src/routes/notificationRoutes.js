const express = require('express');
const { getNotificationsForUser, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:userId', protect, getNotificationsForUser);
router.patch('/:id/read', protect, markAsRead);

module.exports = router;
