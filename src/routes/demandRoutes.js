const express = require('express');
const { getDemands, createDemand, updateDemand, deleteDemand } = require('../controllers/demandController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getDemands)
  .post(protect, createDemand);

router.route('/:id')
  .put(protect, updateDemand)
  .delete(protect, deleteDemand);

module.exports = router;
