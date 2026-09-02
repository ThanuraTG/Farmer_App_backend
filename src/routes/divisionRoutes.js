const express = require('express');
const divisionController = require('../controllers/divisionController');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();
const adminOnly = [authenticateJWT, authorizeRoles('admin', 'manager')];

// Registration needs the location master data before a user has a JWT.
router.get('/', divisionController.listDivisions);
router.post('/', ...adminOnly, divisionController.createDivision);
router.put('/:id', ...adminOnly, divisionController.updateDivision);
router.delete('/:id', ...adminOnly, divisionController.deleteDivision);

module.exports = router;
