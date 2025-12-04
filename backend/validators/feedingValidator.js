const Joi = require('joi');

/**
 * Validation schema for recording a feeding
 */
const recordSchema = Joi.object({
  uniqueId: Joi.string().required().messages({
    'string.empty': 'Unique ID is required'
  }),
  deviceId: Joi.string().required().messages({
    'string.empty': 'Device ID is required'
  }),
  method: Joi.string().valid('scan', 'manual').required().messages({
    'any.only': 'Method must be either scan or manual'
  })
});

/**
 * Validation schema for querying feeding records
 */
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must be no more than 100'
  })
});

module.exports = {
  record: recordSchema,
  query: querySchema
};