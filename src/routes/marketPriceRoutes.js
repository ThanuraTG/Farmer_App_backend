const express = require('express');
const router = express.Router();
const marketPriceController = require('../controllers/marketPriceController');

router.get('/latest', marketPriceController.getLatest);
router.get('/history', marketPriceController.getHistory);
router.get('/summary', marketPriceController.getSummary);

module.exports = router;
