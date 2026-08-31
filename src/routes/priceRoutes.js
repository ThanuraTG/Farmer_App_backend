const express = require('express');
const {
  getPrices,
  getLatestPricesController,
  getPricesByCropController,
  getPricesByMarketController,
  getPriceHistoryController,
  syncPricesController,
  createPrice,
  updatePrice,
  deletePrice
} = require('../controllers/priceController');
const { protect, staff } = require('../middleware/authMiddleware');

const router = express.Router();

// Special Price Queries & Actions
router.get('/latest', getLatestPricesController);
router.get('/crop/:crop', getPricesByCropController);
router.get('/market/:market', getPricesByMarketController);
router.get('/history', getPriceHistoryController);
router.post('/sync', syncPricesController);

// Base route & Legacy CRUD
router.route('/')
  .get(getPrices)
  .post(protect, staff, createPrice);

router.route('/:id')
  .put(protect, staff, updatePrice)
  .delete(protect, staff, deletePrice);

module.exports = router;
