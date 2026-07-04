const express = require('express');
const {
  getCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
  getCropDetails,
  updateCropDetails
} = require('../controllers/cropController');
const { protect, staff } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getCrops)
  .post(protect, staff, createCrop);

router.route('/:id')
  .get(getCropById)
  .put(protect, staff, updateCrop)
  .delete(protect, staff, deleteCrop);

router.route('/:id/details')
  .get(getCropDetails)
  .put(protect, staff, updateCropDetails);

module.exports = router;
