const express = require('express');
const { getWeatherForDivision, getAllWeather } = require('../controllers/weatherController');

const router = express.Router();

router.get('/all', getAllWeather);
router.get('/', getWeatherForDivision);

module.exports = router;

