const express = require('express');
const { getPrices, createPrice, updatePrice, deletePrice } = require('../controllers/priceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getPrices)
  .post(protect, createPrice);

router.route('/:id')
  .put(protect, updatePrice)
  .delete(protect, deletePrice);

module.exports = router;
