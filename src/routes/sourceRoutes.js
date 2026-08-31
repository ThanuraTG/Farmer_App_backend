const express = require('express');
const router = express.Router();
const { getSources } = require('../controllers/sourceController');

router.get('/', getSources);

module.exports = router;
