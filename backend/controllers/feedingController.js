const Beneficiary = require('../models/Beneficiary');
const FeedingRecord = require('../models/FeedingRecord');
const logger = require('../utils/logger');

// Simple in-memory cache for tracking recent scans (3-second protection)
const recentScans = new Map();
const SCAN_PROTECTION_DURATION = 3000;

// Helper function to get YYYY-MM-DD format
const getYYYYMMDD = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * @desc    Scan QR code and record feeding
 * @route   POST /api/feeding/scan
 * @access  Private
 */
const scanQRCode = async (req, res, next) => {
  try {
    const { uniqueId, deviceId, method } = req.body;
    
    logger.info(`Scanning QR code for beneficiary: ${uniqueId}, method: ${method}, device: ${deviceId}`);
    
    // Validate input
    if (!uniqueId) {
      logger.warn('Unique ID is required for QR scan');
      return res.status(400).json({
        status: 'error',
        message: 'Unique ID is required'
      });
    }
    
    if (!deviceId) {
      logger.warn('Device ID is required for QR scan');
      return res.status(400).json({
        status: 'error',
        message: 'Device ID is required'
      });
    }
    
    if (!method || !['scan', 'manual'].includes(method)) {
      logger.warn(`Invalid method for QR scan: ${method}`);
      return res.status(400).json({
        status: 'error',
        message: 'Method must be either "scan" or "manual"'
      });
    }
    
    // Check for double-scan protection (3-second cooldown)
    const scanKey = `${uniqueId}-${deviceId}`;
    const lastScanTime = recentScans.get(scanKey);
    const currentTime = Date.now();
    
    if (lastScanTime && (currentTime - lastScanTime) < SCAN_PROTECTION_DURATION) {
      logger.warn(`Double scan attempt prevented for ${uniqueId} on device ${deviceId}`);
      return res.status(429).json({
        status: 'error',
        message: 'Please wait before scanning again'
      });
    }
    
    // Update the last scan time
    recentScans.set(scanKey, currentTime);
    
    // Clean up old entries periodically
    if (recentScans.size > 1000) {
      const fiveMinutesAgo = currentTime - (5 * 60 * 1000);
      for (const [key, timestamp] of recentScans.entries()) {
        if (timestamp < fiveMinutesAgo) {
          recentScans.delete(key);
        }
      }
    }
    
    // Check if beneficiary exists
    const beneficiary = await Beneficiary.findOne({ uniqueId });
    if (!beneficiary) {
      logger.warn(`Beneficiary not found for QR scan: ${uniqueId}`);
      return res.status(404).json({
        status: 'not_found',
        message: 'Beneficiary not found'
      });
    }
    
    // Check if beneficiary is active
    if (!beneficiary.active) {
      logger.warn(`Inactive beneficiary attempted QR scan: ${uniqueId}`);
      return res.status(400).json({
        status: 'error',
        message: 'Beneficiary is inactive'
      });
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const dateString = getYYYYMMDD(today);
    
    // Check if already fed today
    const existingRecord = await FeedingRecord.findOne({
      uniqueId,
      date: dateString
    });
    
    if (existingRecord) {
      logger.info(`Beneficiary already fed today: ${uniqueId}`);
      return res.status(200).json({
        status: 'already_fed',
        message: 'Beneficiary already fed today.'
      });
    }
    
    // Create feeding record
    const feedingRecord = new FeedingRecord({
      uniqueId,
      beneficiary: beneficiary._id,
      date: dateString,
      fedAt: today,
      method,
      deviceId
    });
    
    await feedingRecord.save();
    
    logger.info(`Feeding recorded successfully for beneficiary: ${uniqueId}`);
    
    // Emit event to notify clients about the new feeding record
    const io = req.app.get('io');
    if (io) {
      io.emit('feedingUpdated', {
        uniqueId: uniqueId,
        beneficiary: {
          name: beneficiary.name,
          group: beneficiary.group,
          uniqueId: beneficiary.uniqueId
        },
        date: dateString,
        fedAt: today,
        method: method,
        deviceId: deviceId
      });
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Feeding recorded successfully.'
    });
  } catch (error) {
    logger.error(`Error scanning QR code: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Remove feeding record for today
 * @route   DELETE /api/feeding/record/:uniqueId
 * @access  Private (Admin only)
 */
const removeFeedingRecord = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;
    
    logger.info(`Removing feeding record for beneficiary: ${uniqueId}`);
    
    // Check if admin (only admins can remove feeding records)
    if (req.admin && req.admin.role !== 'admin') {
      logger.warn(`Non-admin attempted to remove feeding record: ${uniqueId}`);
      return res.status(403).json({
        success: false,
        error: 'Only administrators can remove feeding records'
      });
    }
    
    // Check if beneficiary exists
    const beneficiary = await Beneficiary.findOne({ uniqueId });
    if (!beneficiary) {
      logger.warn(`Beneficiary not found when removing feeding record: ${uniqueId}`);
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    // Check if beneficiary is active
    if (!beneficiary.active) {
      logger.warn(`Inactive beneficiary attempted to remove feeding record: ${uniqueId}`);
      return res.status(400).json({
        success: false,
        error: 'Cannot remove feeding record for inactive beneficiary'
      });
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const dateString = getYYYYMMDD(today);
    
    // Find and remove the feeding record for today
    const deletedRecord = await FeedingRecord.findOneAndDelete({
      uniqueId,
      date: dateString
    });
    
    if (!deletedRecord) {
      logger.info(`No feeding record found to remove for beneficiary: ${uniqueId}`);
      return res.status(404).json({
        success: false,
        error: 'No feeding record found for today'
      });
    }
    
    logger.info(`Feeding record removed successfully for beneficiary: ${uniqueId}`);
    
    // Emit event to notify clients about the removed feeding record
    const io = req.app.get('io');
    if (io) {
      io.emit('feedingRemoved', {
        uniqueId: uniqueId,
        date: dateString
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Feeding record removed successfully'
    });
  } catch (error) {
    logger.error(`Error removing feeding record: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Undo last feeding record for a beneficiary
 * @route   DELETE /api/feeding/undo/:uniqueId
 * @access  Private
 */
const undoLastFeeding = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;
    
    logger.info(`Undoing last feeding record for beneficiary: ${uniqueId}`);
    
    // Check if beneficiary exists
    const beneficiary = await Beneficiary.findOne({ uniqueId });
    if (!beneficiary) {
      logger.warn(`Beneficiary not found when undoing feeding record: ${uniqueId}`);
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    // Check if beneficiary is active
    if (!beneficiary.active) {
      logger.warn(`Inactive beneficiary attempted to undo feeding record: ${uniqueId}`);
      return res.status(400).json({
        success: false,
        error: 'Cannot undo feeding record for inactive beneficiary'
      });
    }
    
    // Find the most recent feeding record for this beneficiary and delete it
    const deletedRecord = await FeedingRecord.findOneAndDelete(
      { uniqueId },
      { sort: { fedAt: -1 } } // Sort by fedAt descending to get the most recent
    );
    
    if (!deletedRecord) {
      logger.warn(`No feeding record found when undoing for beneficiary: ${uniqueId}`);
      return res.status(404).json({
        success: false,
        error: 'No feeding record found for this beneficiary'
      });
    }
    
    // Emit event to notify clients about the removed feeding record
    const io = req.app.get('io');
    if (io) {
      io.emit('feedingRemoved', {
        uniqueId: uniqueId,
        date: deletedRecord.date
      });
    }
    
    logger.info(`Last feeding record undone successfully for beneficiary: ${uniqueId}`);
    
    res.status(200).json({
      success: true,
      message: 'Last feeding record undone successfully',
      data: {
        deletedRecord
      }
    });
  } catch (error) {
    logger.error(`Error undoing feeding record: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get all people fed today
 * @route   GET /api/feeding/today
 * @access  Public (or Private if auth enabled)
 */
const getFedToday = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Build filter
    const filter = {
      date: dateString
    };
    
    const feedingRecords = await FeedingRecord.find(filter)
      .populate('beneficiary', 'name gender group uniqueId')
      .skip(skip)
      .limit(limit)
      .sort({ fedAt: -1 });
    
    const total = await FeedingRecord.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: feedingRecords.length,
      data: feedingRecords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get statistics
 * @route   GET /api/feeding/stats
 * @access  Public (or Private if auth enabled)
 */
const getFeedingStats = async (req, res, next) => {
  try {
    // Total beneficiaries
    const totalBeneficiaries = await Beneficiary.countDocuments();
    
    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Total fed today
    const totalFedToday = await FeedingRecord.countDocuments({
      date: dateString
    });
    
    // Calculate feed rate percentage
    const feedRate = totalBeneficiaries > 0 
      ? Math.round((totalFedToday / totalBeneficiaries) * 100) 
      : 0;
    
    // Get date range if provided
    let startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago
    
    let endDate = req.query.endDate 
      ? new Date(req.query.endDate) 
      : new Date();
    
    // Format dates to YYYY-MM-DD
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    // Total fed in date range
    const totalFedInRange = await FeedingRecord.countDocuments({
      date: {
        $gte: startDateString,
        $lte: endDateString
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalBeneficiaries,
        totalFedToday,
        totalFedInRange,
        feedRate,
        dateRange: {
          startDate: startDateString,
          endDate: endDateString
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get feeding records for a specific beneficiary
 * @route   GET /api/feeding/beneficiary/:uniqueId
 * @access  Private
 */
const getFeedingRecordsForBeneficiary = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;
    
    // Check if beneficiary exists and is active
    const beneficiary = await Beneficiary.findOne({ uniqueId });
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    if (!beneficiary.active) {
      return res.status(400).json({
        success: false,
        error: 'Beneficiary is inactive'
      });
    }
    
    // Find all feeding records for the beneficiary
    const feedingRecords = await FeedingRecord.find({ uniqueId })
      .sort({ date: -1 }) // Sort by date descending
      .populate('beneficiary', 'name group uniqueId');
    
    res.status(200).json({
      success: true,
      count: feedingRecords.length,
      data: feedingRecords
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanQRCode,
  removeFeedingRecord,
  getFedToday,
  getFeedingRecordsForBeneficiary,
  getFeedingStats
};