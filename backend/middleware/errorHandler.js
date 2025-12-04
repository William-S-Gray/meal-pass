const logger = require('../utils/logger');
const { sendError } = require('../utils/responseHelper');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return sendError(res, 404, 'Resource not found');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return sendError(res, 400, 'Duplicate field value entered');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return sendError(res, 400, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Not authorized, token failed');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Not authorized, token expired');
  }

  // Default error
  sendError(res, err.statusCode || 500, error.message || 'Server Error');
};

module.exports = errorHandler;