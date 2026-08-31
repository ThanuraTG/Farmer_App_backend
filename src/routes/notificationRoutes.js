const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateJWT } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

router.get('/my', notificationController.getMyNotifications);
router.put('/:id/read', notificationController.markRead);

module.exports = router;
