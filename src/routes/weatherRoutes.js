const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/', weatherController.getWeather);
router.get('/current', weatherController.getCurrentWeather);
router.get('/forecast', weatherController.getWeatherForecast);

module.exports = router;
