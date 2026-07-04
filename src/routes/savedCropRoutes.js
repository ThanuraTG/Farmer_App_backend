const express = require('express');
const { saveCrop, unsaveCrop, getUserSavedCrops } = require('../controllers/savedCropController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// The project specification lists:
// GET /api/users/:id/saved-crops
// POST /api/saved-crops
// DELETE /api/saved-crops/:id

// We will mount savedCropRoutes in server.js to match these paths:
// router.get('/users/:id/saved-crops', protect, getUserSavedCrops) will be registered on app level, or here.
// Let's create two files or map them cleanly. In server.js, we can map both routing namespaces.
// In savedCropRoutes.js, we will define the bookmarking writes.

router.post('/', protect, saveCrop);
router.delete('/:id', protect, unsaveCrop);

module.exports = router;
