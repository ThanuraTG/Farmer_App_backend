const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentGuidelineController');

router.get('/', contentController.getContentGuidelines);
router.get('/:id', contentController.getContentGuidelineById);

module.exports = router;
