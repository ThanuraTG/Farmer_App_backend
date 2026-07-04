const express = require('express');
const { getPrices, createPrice, updatePrice, deletePrice } = require('../controllers/priceController');
const { protect, staff } = require('../middleware/authMiddleware');

const router = express.Router();

// Public read, protected writes
router.route('/')
  .get(getPrices)
  .post(protect, staff, createPrice);

router.route('/:id')
  .put(protect, staff, updatePrice)
  .delete(protect, staff, deletePrice);

module.exports = router;
