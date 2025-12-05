const Joi = require('joi');

// Create employee validation schema
const create = Joi.object({
  name: Joi.string().required().trim().min(1).max(100).messages({
    'string.empty': 'Employee name is required',
    'string.min': 'Employee name must be at least 1 character',
    'string.max': 'Employee name must be less than 100 characters'
  }),
  gender: Joi.string().required().valid('Male', 'Female', 'Other').messages({
    'any.only': 'Gender must be Male, Female, or Other',
    'any.required': 'Gender is required'
  }),
  uniqueId: Joi.string().optional().trim().max(50).messages({
    'string.max': 'Unique ID must be less than 50 characters'
  }),
  phone: Joi.string().optional().trim().max(20).messages({
    'string.max': 'Phone number must be less than 20 characters'
  }),
  department: Joi.string().optional().trim().max(100).messages({
    'string.max': 'Department must be less than 100 characters'
  }),
  position: Joi.string().optional().trim().max(100).messages({
    'string.max': 'Position must be less than 100 characters'
  }),
  validUntil: Joi.date().iso().required().messages({
    'date.iso': 'Valid until must be a valid date',
    'any.required': 'Valid until date is required'
  }),
  photo: Joi.string().optional().uri().messages({
    'string.uri': 'Photo must be a valid URL'
  })
});

// Update employee validation schema
const update = Joi.object({
  name: Joi.string().optional().trim().min(1).max(100).messages({
    'string.min': 'Employee name must be at least 1 character',
    'string.max': 'Employee name must be less than 100 characters'
  }),
  gender: Joi.string().optional().valid('Male', 'Female', 'Other').messages({
    'any.only': 'Gender must be Male, Female, or Other'
  }),
  phone: Joi.string().optional().trim().max(20).messages({
    'string.max': 'Phone number must be less than 20 characters'
  }),
  department: Joi.string().optional().trim().max(100).messages({
    'string.max': 'Department must be less than 100 characters'
  }),
  position: Joi.string().optional().trim().max(100).messages({
    'string.max': 'Position must be less than 100 characters'
  }),
  validUntil: Joi.date().iso().optional().messages({
    'date.iso': 'Valid until must be a valid date'
  }),
  photo: Joi.string().optional().uri().messages({
    'string.uri': 'Photo must be a valid URL'
  }),
  active: Joi.boolean().optional()
});

// Query validation schema
const query = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().trim().max(100)
});

module.exports = {
  create,
  update,
  query
};