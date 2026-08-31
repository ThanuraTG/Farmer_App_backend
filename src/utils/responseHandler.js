/**
 * Standard API Success Response
 */
const successResponse = (res, statusCode = 200, message = 'Operation successful', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standard API Error Response
 */
const errorResponse = (res, statusCode = 500, message = 'An error occurred', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

module.exports = {
  successResponse,
  errorResponse
};
