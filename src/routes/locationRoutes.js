const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/provinces', locationController.getProvinces);
router.get('/districts', locationController.getDistricts);
router.get('/divisions', locationController.getDivisions);

module.exports = router;
