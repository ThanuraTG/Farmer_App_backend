const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticateJWT } = require('../middleware/auth.middleware');

router.get('/alternatives', authenticateJWT, recommendationController.getAlternatives);

module.exports = router;
