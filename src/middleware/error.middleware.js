const logger = require('../utils/logger');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message || 'Unhandled Application Error', err.stack);

  let statusCode = err.statusCode || res.statusCode;
  if (statusCode < 400) statusCode = 500;

  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(val => val.message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    errors = [`${field} already exists`];
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with invalid id format: ${err.value}`;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : [message],
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  errorHandler
};
