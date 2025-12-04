const feedingService = require('../services/feedingService');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseHelper');
const logger = require('../utils/logger');
const { record, query } = require('../validators/feedingValidator');

/**
 * @desc    Record feeding event
 * @route   POST /api/feeding/scan
 * @access  Private (Volunteer/Admin)
 */
const recordFeeding = async (req, res, next) => {
  try {
    // Validate request body early to fail fast
    const { error, value } = record.validate(req.body);
    if (error) {
      return sendValidationError(res, error);
    }

    const result = await feedingService.recordFeeding(value);
    sendSuccess(res, 201, result, 'Feeding recorded successfully');
  } catch (error) {
    logger.error('Error in recordFeeding:', error);
    
    if (error.message === 'Beneficiary not found or inactive') {
      return sendError(res, 404, error.message);
    }
    
    if (error.message === 'Beneficiary already fed today') {
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

    const result = await feedingService.getTodaysRecords(value.page, value.limit);
    sendSuccess(res, 200, result.data, null, result.pagination);
  } catch (error) {
    logger.error('Error in getTodaysRecords:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get feeding records for a beneficiary
 * @route   GET /api/feeding/beneficiary/:uniqueId
 * @access  Private (Volunteer/Admin)
 */
const getRecordsByBeneficiary = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;
    
    // Validate query parameters early to fail fast
    const { error, value } = query.validate(req.query);
    if (error) {
      return sendValidationError(res, error);
    }

    const result = await feedingService.getRecordsByBeneficiary(uniqueId, value.page, value.limit);
    sendSuccess(res, 200, result.data, null, result.pagination);
  } catch (error) {
    logger.error('Error in getRecordsByBeneficiary:', error);
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
    
    const removed = await feedingService.removeTodaysRecord(uniqueId);
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
  getRecordsByBeneficiary,
  removeTodaysRecord
};