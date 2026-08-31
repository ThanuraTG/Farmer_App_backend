const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { errorResponse } = require('../utils/responseHandler');

const authenticateJWT = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-passwordHash -password_hash');

      if (!user) {
        return errorResponse(res, 401, 'Authentication failed: User account not found');
      }

      if (user.accountStatus === 'inactive' || user.accountStatus === 'suspended') {
        return errorResponse(res, 403, `Account is ${user.accountStatus}. Contact administrator.`);
      }

      req.user = user;
      return next();
    } catch (error) {
      return errorResponse(res, 401, 'Authentication failed: Invalid or expired token', [error.message]);
    }
  }

  return errorResponse(res, 401, 'Authentication required: No token provided');
};

const optionalJWT = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash -password_hash');
      if (user && user.accountStatus === 'active') {
        req.user = user;
      }
    } catch (e) {
      // Ignore invalid token for optional auth
    }
  }
  return next();
};

module.exports = {
  authenticateJWT,
  protect: authenticateJWT,
  optionalJWT
};
