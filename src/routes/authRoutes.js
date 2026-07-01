const express = require('express');
const { registerUser, loginUser, getMe, getAllUsers } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/users', protect, admin, getAllUsers);

module.exports = router;
