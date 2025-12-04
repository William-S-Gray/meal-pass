const FeedingRecord = require('../models/FeedingRecord');
const Beneficiary = require('../models/Beneficiary');
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
    beneficiary: record.beneficiary,
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
    
    // Check if beneficiary exists and is active using lean for better performance
    const beneficiary = await Beneficiary.findOne({ 
      uniqueId: feedingData.uniqueId, 
      active: true 
    }).lean();
    
    if (!beneficiary) {
      logger.warn('Beneficiary not found or inactive', { uniqueId: feedingData.uniqueId });
      throw new Error('Beneficiary not found or inactive');
    }
    
    // Check if already fed today using lean for better performance
    const today = new Date().toISOString().split('T')[0];
    const existingRecord = await FeedingRecord.findOne({
      uniqueId: feedingData.uniqueId,
      date: today
    }).lean();
    
    if (existingRecord) {
      logger.warn('Beneficiary already fed today', { uniqueId: feedingData.uniqueId });
      throw new Error('Beneficiary already fed today');
    }
    
    // Create feeding record
    const feedingRecord = new FeedingRecord({
      ...feedingData,
      beneficiary: {
        name: beneficiary.name,
        group: beneficiary.group,
        uniqueId: beneficiary.uniqueId
      },
      date: today,
      fedAt: new Date()
    });
    
    await feedingRecord.save();
    
    logger.info('Feeding recorded successfully', { id: feedingRecord._id });
    return formatFeedingRecordResponse(feedingRecord.toObject()); // Convert to object for consistency
  } catch (error) {
    logger.error('Error recording feeding', { error: error.message });
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
 * Get feeding records for a beneficiary
 * @param {string} uniqueId - Beneficiary unique ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Paginated feeding records
 */
const getRecordsByBeneficiary = async (uniqueId, page = 1, limit = 10) => {
  try {
    logger.info('Fetching feeding records for beneficiary', { uniqueId, page, limit });
    
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
    
    logger.info('Beneficiary feeding records fetched successfully', { uniqueId, count: records.length });
    return result;
  } catch (error) {
    logger.error('Error fetching beneficiary feeding records', { uniqueId, error: error.message });
    throw error;
  }
};

/**
 * Remove today's feeding record for a beneficiary
 * @param {string} uniqueId - Beneficiary unique ID
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
  getRecordsByBeneficiary,
  removeTodaysRecord
};
