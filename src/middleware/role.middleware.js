const { errorResponse } = require('../utils/responseHandler');

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required');
    }

    const userRole = (req.user.role || '').toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return errorResponse(
        res,
        403,
        `Access denied: Role '${req.user.role}' is not authorized to perform this operation`
      );
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
  admin: authorizeRoles('admin')
};
