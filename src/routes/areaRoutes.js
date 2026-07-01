const express = require('express');
const { getAreas, createArea, updateArea, deleteArea } = require('../controllers/areaController');
const { protect, managerOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getAreas)
  .post(protect, managerOrAdmin, createArea);

router.route('/:id')
  .put(protect, managerOrAdmin, updateArea)
  .delete(protect, managerOrAdmin, deleteArea);

module.exports = router;
