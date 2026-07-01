const express = require('express');
const { getSummary, getPriceComparison, getDemandAnalysis, exportCSV } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/summary', protect, getSummary);
router.get('/price-comparison', protect, getPriceComparison);
router.get('/demand-analysis', protect, getDemandAnalysis);
router.get('/export-csv', protect, exportCSV);

module.exports = router;
