const express = require('express');
const router = express.Router();
const economicCentreController = require('../controllers/economicCentreController');

router.get('/', economicCentreController.getEconomicCentres);

module.exports = router;
