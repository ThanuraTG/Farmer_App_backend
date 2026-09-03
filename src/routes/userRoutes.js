const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

/**
 * User Management Routes
 * Base path: /api/users
 * 
 * All routes require JWT authentication unless otherwise noted
 * Most routes require admin or manager role
 */

// Get all users (with filters and pagination)
// GET /api/users?search=...&district=...&status=...&role=...&page=1&limit=20
router.get(
  '/',
  authenticateJWT,
  authorizeRoles('admin', 'manager'),
  userController.getUsers
);

// Create a new user
// POST /api/users
router.post(
  '/',
  authenticateJWT,
  authorizeRoles('admin', 'manager'),
  userController.createUser
);

// Get a specific user by ID
// GET /api/users/:id
router.get(
  '/:id',
  authenticateJWT,
  userController.getUserById
);

// Update user information
// PUT /api/users/:id
router.put(
  '/:id',
  authenticateJWT,
  userController.updateUser
);

// Update user status (active/inactive/suspended)
// PUT /api/users/:id/status
router.put(
  '/:id/status',
  authenticateJWT,
  authorizeRoles('admin'),
  userController.updateUserStatus
);

module.exports = router;
