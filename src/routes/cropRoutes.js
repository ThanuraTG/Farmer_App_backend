const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');
const decisionSupportController = require('../controllers/decisionSupportController');
const { authenticateJWT } = require('../middleware/auth.middleware');

router.get('/', cropController.getCrops);
router.get('/:id', cropController.getCropById);
router.get('/:cropId/decision-support', authenticateJWT, decisionSupportController.getDecisionSupport);

module.exports = router;
