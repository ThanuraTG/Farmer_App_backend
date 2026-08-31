const express = require('express');
const router = express.Router();
const advisoryController = require('../controllers/advisoryController');

router.get('/', advisoryController.getAdvisories);

module.exports = router;
