const express = require('express');
const { getAdminStats } = require('../controllers/adminController');
const { protect, staff } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, staff, getAdminStats);

module.exports = router;
