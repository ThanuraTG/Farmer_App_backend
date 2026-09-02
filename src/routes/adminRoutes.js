const express = require('express');
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();
const adminOnly = [authenticateJWT, authorizeRoles('admin', 'manager')];

router.get('/dashboard', ...adminOnly, adminController.getDashboardStats);
router.get('/notifications', ...adminOnly, notificationController.adminGetNotifications);
router.post('/notifications', ...adminOnly, notificationController.adminCreateNotification);
router.put('/notifications/:id', ...adminOnly, notificationController.adminUpdateNotification);
router.delete('/notifications/:id', ...adminOnly, notificationController.adminDeleteNotification);

module.exports = router;
