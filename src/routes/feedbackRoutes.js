const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { optionalJWT } = require('../middleware/auth.middleware');

router.post('/', optionalJWT, feedbackController.submitFeedback);
router.get('/', optionalJWT, feedbackController.getFarmerFeedbacks);

module.exports = router;
