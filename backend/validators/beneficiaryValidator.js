const Joi = require('joi');

/**
 * Validation schema for creating a beneficiary
 */
const createSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 1 character',
    'string.max': 'Name must be less than 100 characters'
  }),
  gender: Joi.string().valid('male', 'female', 'other').required().messages({
    'any.only': 'Gender must be male, female, or other'
  }),
  group: Joi.string().max(100).allow('').optional().messages({
    'string.max': 'Group must be less than 100 characters'
  })
});

/**
 * Validation schema for updating a beneficiary
 */
const updateSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Name must be at least 1 character',
    'string.max': 'Name must be less than 100 characters'
  }),
  gender: Joi.string().valid('male', 'female', 'other').optional().messages({
    'any.only': 'Gender must be male, female, or other'
  }),
  group: Joi.string().max(100).allow('').optional().messages({
    'string.max': 'Group must be less than 100 characters'
  }),
  active: Joi.boolean().optional()
});

/**
 * Validation schema for querying beneficiaries
 */
const querySchema = Joi.object({
  search: Joi.string().max(100).optional().messages({
    'string.max': 'Search term must be less than 100 characters'
  }),
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
  create: createSchema,
  update: updateSchema,
  query: querySchema
};