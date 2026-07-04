const express = require('express');
const { getWeatherForDivision } = require('../controllers/weatherController');

const router = express.Router();

router.get('/', getWeatherForDivision);

module.exports = router;
