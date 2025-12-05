const employeeFeedingService = require('../services/employeeFeedingService');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseHelper');
const logger = require('../utils/logger');
const { record, query } = require('../validators/feedingValidator');

/**
 * @desc    Record feeding event for employee
 * @route   POST /api/feeding/scan
 * @access  Private (Volunteer/Admin)
 * 
 * This endpoint prevents duplicate feedings by:
 * 1. Checking if a feeding record already exists for the same employee on the same day
 * 2. Checking if the employee's access is still valid
 * 3. Using a compound unique index in the database for additional protection
 */
const recordFeeding = async (req, res, next) => {
  try {
    // Log the incoming request for debugging
    logger.info('Received feeding record request', { body: req.body });
    
    // Validate request body early to fail fast
    const { error, value } = record.validate(req.body);
    if (error) {
      logger.warn('Feeding record validation failed', { error: error.details });
      return sendValidationError(res, error);
    }

    const result = await employeeFeedingService.recordFeeding(value);
    logger.info('Feeding recorded successfully', { uniqueId: value.uniqueId });
    sendSuccess(res, 201, result, 'Feeding recorded successfully');
  } catch (error) {
    logger.error('Error in recordFeeding:', error);
    
    if (error.message === 'Employee not found or inactive') {
      return sendError(res, 404, error.message);
    }
    
    if (error.message === 'Employee meal access expired') {
      return sendError(res, 400, error.message);
    }
    
    if (error.message === 'Employee already fed today') {
      return sendError(res, 400, error.message);
    }
    
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get today's feeding records
 * @route   GET /api/feeding/today
 * @access  Private (Volunteer/Admin)
 */
const getTodaysRecords = async (req, res, next) => {
  try {
    // Validate query parameters early to fail fast
    const { error, value } = query.validate(req.query);
    if (error) {
      return sendValidationError(res, error);
    }

    const result = await employeeFeedingService.getTodaysRecords(value.page, value.limit);
    sendSuccess(res, 200, result.data, null, result.pagination);
  } catch (error) {
    logger.error('Error in getTodaysRecords:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get feeding records for an employee
 * @route   GET /api/feeding/employee/:uniqueId
 * @access  Private (Volunteer/Admin)
 */
const getRecordsByEmployee = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;
    
    // Validate query parameters early to fail fast
    const { error, value } = query.validate(req.query);
    if (error) {
      return sendValidationError(res, error);
    }

    const result = await employeeFeedingService.getRecordsByEmployee(uniqueId, value.page, value.limit);
    sendSuccess(res, 200, result.data, null, result.pagination);
  } catch (error) {
    logger.error('Error in getRecordsByEmployee:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Remove today's feeding record
 * @route   DELETE /api/feeding/record/:uniqueId
 * @access  Private (Volunteer/Admin)
 */
const removeTodaysRecord = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;
    
    const removed = await employeeFeedingService.removeTodaysRecord(uniqueId);
    if (!removed) {
      return sendError(res, 404, 'Feeding record not found');
    }
    
    sendSuccess(res, 200, null, 'Feeding record removed successfully');
  } catch (error) {
    logger.error('Error in removeTodaysRecord:', error);
    sendError(res, 500, error.message);
  }
};

module.exports = {
  recordFeeding,
  getTodaysRecords,
  getRecordsByEmployee,
  removeTodaysRecord
};