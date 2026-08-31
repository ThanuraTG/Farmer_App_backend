const express = require('express');
const router = express.Router();
const { getMarkets, createMarket } = require('../controllers/marketController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(getMarkets)
  .post(protect, createMarket);

module.exports = router;
