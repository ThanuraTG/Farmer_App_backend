const express = require('express');
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, managerOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getProducts)
  .post(protect, managerOrAdmin, createProduct);

router.route('/:id')
  .put(protect, managerOrAdmin, updateProduct)
  .delete(protect, managerOrAdmin, deleteProduct);

module.exports = router;
