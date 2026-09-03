const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/admin/list', authenticateJWT, authorizeRoles('admin', 'manager'), cropController.adminGetCrops);
router.get('/', cropController.getCrops);
router.get('/:id/decision-support', cropController.getDecisionSupport);
router.get('/:id', cropController.getCropById);
router.post('/', authenticateJWT, authorizeRoles('admin', 'manager'), cropController.createCrop);
router.put('/:id', authenticateJWT, authorizeRoles('admin', 'manager'), cropController.updateCrop);
router.delete('/:id', authenticateJWT, authorizeRoles('admin', 'manager'), cropController.deleteCrop);

module.exports = router;
