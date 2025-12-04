const { formatResponse } = require('./helpers');

/**
 * Send success response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Response data
 * @param {string} message - Optional message
 * @param {object} pagination - Pagination info
 */
const sendSuccess = (res, statusCode, data = null, message = null, pagination = null) => {
  res.status(statusCode).json(formatResponse(true, data, message, pagination));
};

/**
 * Send error response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
const sendError = (res, statusCode, message = 'An error occurred') => {
  res.status(statusCode).json(formatResponse(false, null, message));
};

/**
 * Send validation error response
 * @param {object} res - Express response object
 * @param {object} error - Joi validation error
 */
const sendValidationError = (res, error) => {
  const errorMessage = error.details?.[0]?.message || 'Validation error';
  sendError(res, 400, errorMessage);
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError
};