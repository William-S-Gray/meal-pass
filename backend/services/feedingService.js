const FeedingRecord = require('../models/FeedingRecord');
const Employee = require('../models/Employee');
const logger = require('../utils/logger');

/**
 * Format feeding record response data
 * @param {Object} record - Feeding record document
 * @returns {Object} Formatted feeding record data
 */
const formatFeedingRecordResponse = (record) => {
  return {
    id: record._id,
    uniqueId: record.uniqueId,
    employee: record.employee,
    date: record.date,
    fedAt: record.fedAt,
    method: record.method,
    deviceId: record.deviceId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
};

/**
 * Record a feeding event
 * @param {Object} feedingData - Feeding data
 * @returns {Object} Created feeding record
 */
const recordFeeding = async (feedingData) => {
  try {
    logger.info('Recording feeding event', { uniqueId: feedingData.uniqueId });
    
    // Check if employee exists and is active using lean for better performance
    const employee = await Employee.findOne({ 
      uniqueId: feedingData.uniqueId, 
      active: true 
    }).lean();
    
    if (!employee) {
      logger.warn('Employee not found or inactive', { uniqueId: feedingData.uniqueId });
      throw new Error('Employee not found or inactive');
    }
    
    // Check if already fed today using lean for better performance
    const today = new Date().toISOString().split('T')[0];
    const existingRecord = await FeedingRecord.findOne({
      uniqueId: feedingData.uniqueId,
      date: today
    }).lean();
    
    if (existingRecord) {
      logger.warn('Employee already fed today', { uniqueId: feedingData.uniqueId, date: today });
      throw new Error('Employee already fed today');
    }
    
    // Create feeding record
    const feedingRecord = new FeedingRecord({
      ...feedingData,
      employee: {
        name: employee.name,
        group: employee.group,
        uniqueId: employee.uniqueId
      },
      date: today,
      fedAt: new Date()
    });
    
    await feedingRecord.save();
    
    logger.info('Feeding recorded successfully', { id: feedingRecord._id, uniqueId: feedingData.uniqueId });
    return formatFeedingRecordResponse(feedingRecord.toObject()); // Convert to object for consistency
  } catch (error) {
    logger.error('Error recording feeding', { error: error.message, uniqueId: feedingData?.uniqueId });
    throw error;
  }
};

/**
 * Get today's feeding records
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Paginated feeding records
 */
const getTodaysRecords = async (page = 1, limit = 10) => {
  try {
    logger.info('Fetching today\'s feeding records', { page, limit });
    
    const today = new Date().toISOString().split('T')[0];
    
    const records = await FeedingRecord.find({ date: today })
      .sort({ fedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Use lean for better performance
    
    const total = await FeedingRecord.countDocuments({ date: today });
    
    const result = {
      data: records.map(formatFeedingRecordResponse),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    logger.info('Today\'s feeding records fetched successfully', { count: records.length });
    return result;
  } catch (error) {
    logger.error('Error fetching today\'s feeding records', { error: error.message });
    throw error;
  }
};

/**
 * Get feeding records for an employee
 * @param {string} uniqueId - Employee unique ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Paginated feeding records
 */
const getRecordsByEmployee = async (uniqueId, page = 1, limit = 10) => {
  try {
    logger.info('Fetching feeding records for employee', { uniqueId, page, limit });
    
    const records = await FeedingRecord.find({ uniqueId })
      .sort({ date: -1, fedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Use lean for better performance
    
    const total = await FeedingRecord.countDocuments({ uniqueId });
    
    const result = {
      data: records.map(formatFeedingRecordResponse),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    logger.info('Employee feeding records fetched successfully', { uniqueId, count: records.length });
    return result;
  } catch (error) {
    logger.error('Error fetching employee feeding records', { uniqueId, error: error.message });
    throw error;
  }
};

/**
 * Remove today's feeding record for an employee
 * @param {string} uniqueId - Employee unique ID
 * @returns {boolean} Success status
 */
const removeTodaysRecord = async (uniqueId) => {
  try {
    logger.info('Removing today\'s feeding record', { uniqueId });
    
    const today = new Date().toISOString().split('T')[0];
    
    const result = await FeedingRecord.deleteOne({
      uniqueId,
      date: today
    });
    
    if (result.deletedCount === 0) {
      logger.warn('No feeding record found to remove', { uniqueId });
      return false;
    }
    
    logger.info('Feeding record removed successfully', { uniqueId });
    return true;
  } catch (error) {
    logger.error('Error removing feeding record', { uniqueId, error: error.message });
    throw error;
  }
};

module.exports = {
  recordFeeding,
  getTodaysRecords,
  getRecordsByEmployee,
  removeTodaysRecord
};