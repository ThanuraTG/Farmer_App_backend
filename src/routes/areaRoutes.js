const express = require('express');
const { getAreas, createArea, updateArea, deleteArea } = require('../controllers/areaController');
const { protect, staff } = require('../middleware/authMiddleware');

const router = express.Router();

// Allow public GET for registration dropdown, and staff protection for writes
router.route('/')
  .get(getAreas)
  .post(protect, staff, createArea);

router.route('/:id')
  .put(protect, staff, updateArea)
  .delete(protect, staff, deleteArea);

module.exports = router;
