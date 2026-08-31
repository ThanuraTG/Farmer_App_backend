const { errorResponse } = require('../utils/responseHandler');

const validateRequest = (validatorFn) => {
  return (req, res, next) => {
    const { isValid, errors } = validatorFn(req.body, req.query, req.params);
    if (!isValid) {
      return errorResponse(res, 400, 'Validation failed', errors);
    }
    next();
  };
};

module.exports = {
  validateRequest
};
