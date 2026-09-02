const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin-login', authController.adminLogin);
router.get('/me', authenticateJWT, authController.getMe);

module.exports = router;
