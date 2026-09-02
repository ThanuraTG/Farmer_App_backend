const express = require('express');
const { getWeather, getAllWeather } = require('../controllers/weatherController');

const router = express.Router();

router.get('/', getWeather);
router.get('/all', getAllWeather);

module.exports = router;
