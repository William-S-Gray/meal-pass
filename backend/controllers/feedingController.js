const Beneficiary = require('../models/Beneficiary');
const FeedingRecord = require('../models/FeedingRecord');

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
    
    // Validate input
    if (!uniqueId) {
      return res.status(400).json({
        status: 'error',
        message: 'Unique ID is required'
      });
    }
    
    if (!deviceId) {
      return res.status(400).json({
        status: 'error',
        message: 'Device ID is required'
      });
    }
    
    if (!method || !['scan', 'manual'].includes(method)) {
      return res.status(400).json({
        status: 'error',
        message: 'Method must be either "scan" or "manual"'
      });
    }
    
    // Check if beneficiary exists
    const beneficiary = await Beneficiary.findOne({ uniqueId });
    if (!beneficiary) {
      return res.status(404).json({
        status: 'not_found',
        message: 'Beneficiary not found'
      });
    }
    
    // Check if beneficiary is active
    if (!beneficiary.active) {
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
    
    res.status(201).json({
      status: 'success',
      message: 'Feeding recorded successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all feeding records for today
 * @route   GET /api/feeding/today
 * @access  Private
 */
const getTodayFeedingRecords = async (req, res, next) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const dateString = getYYYYMMDD(today);
    
    // Find all feeding records for today
    const feedingRecords = await FeedingRecord.find({ date: dateString })
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
  getTodayFeedingRecords,
  getYYYYMMDD
};