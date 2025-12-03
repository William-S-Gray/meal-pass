const Beneficiary = require('../models/Beneficiary');
const FeedingRecord = require('../models/FeedingRecord'); // Changed from FeedLog to FeedingRecord
const { exportToCSV } = require('../utils/csvExporter');

/**
 * @desc    Scan QR code and mark beneficiary as fed
 * @route   POST /api/feed/scan
 * @access  Public (or Private if auth enabled)
 */
const scanQRCode = async (req, res, next) => {
  try {
    const { uniqueId } = req.body;
    
    if (!uniqueId) {
      return res.status(400).json({
        success: false,
        error: 'Unique ID is required'
      });
    }
    
    // Find beneficiary
    const beneficiary = await Beneficiary.findOne({ uniqueId });
    
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    // Check if already fed today
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    const existingRecord = await FeedingRecord.findOne({ // Changed from FeedLog to FeedingRecord
      uniqueId,
      date: dateString
    });
    
    if (existingRecord) {
      return res.status(200).json({
        success: true,
        data: {
          beneficiary,
          alreadyFed: true,
          feedRecord: existingRecord, // Changed name from feedLog to feedRecord
          message: 'Beneficiary already fed today'
        }
      });
    }
    
    // Create feeding record
    const feedingRecord = new FeedingRecord({ // Changed from FeedLog to FeedingRecord
      beneficiaryId: beneficiary._id,
      uniqueId: beneficiary.uniqueId,
      date: dateString,
      fedAt: new Date(),
      method: 'scan', // Added method field
      deviceId: 'unknown' // Added deviceId field
    });
    
    await feedingRecord.save();
    
    res.status(200).json({
      success: true,
      data: {
        beneficiary,
        alreadyFed: false,
        feedRecord: feedingRecord, // Changed name from feedLog to feedRecord
        message: 'Beneficiary marked as fed successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manually set beneficiary feeding status for today (Admin only)
 * @route   POST /api/feed/manual
 * @access  Private (Admin only)
 */
const setManualFeedingStatus = async (req, res, next) => {
  try {
    const { uniqueId, fed } = req.body;
    const admin = req.admin; // Set by auth middleware
    
    if (!uniqueId) {
      return res.status(400).json({
        success: false,
        error: 'Unique ID is required'
      });
    }
    
    if (fed === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Fed status is required'
      });
    }
    
    // Check if admin (only admins can manually set feeding status)
    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can manually set feeding status'
      });
    }
    
    // Find beneficiary
    const beneficiary = await Beneficiary.findOne({ uniqueId });
    
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Check if already has a feeding record for today
    const existingRecord = await FeedingRecord.findOne({ // Changed from FeedLog to FeedingRecord
      uniqueId,
      date: dateString
    });
    
    let feedingRecord; // Changed name from feedLog to feedingRecord
    let message;
    
    if (fed) {
      // Mark as fed
      if (existingRecord) {
        // Already fed, return existing record
        feedingRecord = existingRecord;
        message = 'Beneficiary already marked as fed today';
      } else {
        // Create new feeding record
        feedingRecord = new FeedingRecord({ // Changed from FeedLog to FeedingRecord
          beneficiaryId: beneficiary._id,
          uniqueId: beneficiary.uniqueId,
          date: dateString,
          fedAt: new Date(),
          method: 'manual', // Added method field
          deviceId: `${admin.name} (Manual)` // Changed from servedBy to deviceId
        });
        await feedingRecord.save();
        message = 'Beneficiary manually marked as fed';
      }
    } else {
      // Mark as not fed (remove feeding record if exists)
      if (existingRecord) {
        await FeedingRecord.deleteOne({ _id: existingRecord._id }); // Changed from FeedLog to FeedingRecord
        message = 'Beneficiary manually marked as not fed (removed feeding record)';
      } else {
        message = 'Beneficiary already not fed today';
      }
      feedingRecord = null;
    }
    
    res.status(200).json({
      success: true,
      data: {
        beneficiary,
        fed: !!feedingRecord,
        feedRecord: feedingRecord, // Changed name from feedLog to feedRecord
        message
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all people fed today
 * @route   GET /api/feed/today
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
    
    // Add group filter if provided
    if (req.query.group) {
      filter.group = req.query.group;
    }
    
    const feedingRecords = await FeedingRecord.find(filter) // Changed from FeedLog to FeedingRecord
      .populate('beneficiary', 'name gender group')
      .skip(skip)
      .limit(limit)
      .sort({ fedAt: -1 });
    
    const total = await FeedingRecord.countDocuments(filter); // Changed from FeedLog to FeedingRecord
    
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
 * @desc    Get feed history for a specific beneficiary
 * @route   GET /api/feed/history/:uniqueId
 * @access  Public (or Private if auth enabled)
 */
const getFeedHistory = async (req, res, next) => {
  try {
    const { uniqueId } = req.params;
    
    // Find beneficiary
    const beneficiary = await Beneficiary.findOne({ uniqueId });
    
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    // Get feeding records for this beneficiary
    const feedingRecords = await FeedingRecord.find({ beneficiary: beneficiary._id }) // Changed from FeedLog to FeedingRecord
      .sort({ date: -1, fedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: feedingRecords.length,
      data: feedingRecords
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get statistics
 * @route   GET /api/feed/stats
 * @access  Public (or Private if auth enabled)
 */
const getStats = async (req, res, next) => {
  try {
    // Total beneficiaries
    const totalBeneficiaries = await Beneficiary.countDocuments();
    
    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Total fed today
    const totalFedToday = await FeedingRecord.countDocuments({ // Changed from FeedLog to FeedingRecord
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
    const totalFedInRange = await FeedingRecord.countDocuments({ // Changed from FeedLog to FeedingRecord
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
 * @desc    Get unfed persons
 * @route   GET /api/feed/unfed
 * @access  Public (or Private if auth enabled)
 */
const getUnfed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Find beneficiaries who have been fed today
    const fedBeneficiaries = await FeedingRecord.distinct('beneficiary', { // Changed from FeedLog to FeedingRecord
      date: dateString
    });
    
    // Build filter for unfed beneficiaries
    const filter = {
      _id: { $nin: fedBeneficiaries }
    };
    
    // Add group filter if provided
    if (req.query.group) {
      filter.group = req.query.group;
    }
    
    const unfedBeneficiaries = await Beneficiary.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Beneficiary.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: unfedBeneficiaries.length,
      data: unfedBeneficiaries,
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
 * @desc    Export feed logs
 * @route   GET /api/feed/export
 * @access  Public (or Private if auth enabled)
 */
const exportFeedLogs = async (req, res, next) => {
  try {
    // Build date filter
    const filter = {};
    
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      
      if (req.query.startDate) {
        filter.date.$gte = req.query.startDate;
      }
      
      if (req.query.endDate) {
        filter.date.$lte = req.query.endDate;
      }
    }
    
    // Get feeding records
    const feedingRecords = await FeedingRecord.find(filter) // Changed from FeedLog to FeedingRecord
      .populate('beneficiary', 'name gender group uniqueId')
      .sort({ date: -1, fedAt: -1 });
    
    // Prepare data for export
    const exportData = feedingRecords.map(record => ({
      date: record.date,
      time: record.fedAt.toTimeString().split(' ')[0],
      beneficiaryId: record.beneficiary?.uniqueId || record.uniqueId,
      name: record.beneficiary?.name || 'Unknown',
      gender: record.beneficiary?.gender || 'Unknown',
      group: record.beneficiary?.group || 'Unknown',
      servedBy: record.deviceId || 'Unknown' // Changed from servedBy to deviceId
    }));
    
    const fields = ['date', 'time', 'beneficiaryId', 'name', 'gender', 'group', 'servedBy'];
    const filename = `feed-logs-${Date.now()}`;
    const csvPath = await exportToCSV(exportData, fields, filename);
    
    res.status(200).json({
      success: true,
      data: {
        url: csvPath
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get feed records by date range
 * @route   GET /api/feed/date-range
 * @access  Public (or Private if auth enabled)
 */
const getFeedRecordsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const filter = {};
    
    if (startDate || endDate) {
      filter.date = {};
      
      if (startDate) {
        filter.date.$gte = startDate;
      }
      
      if (endDate) {
        filter.date.$lte = endDate;
      }
    }
    
    // Get feeding records
    const feedingRecords = await FeedingRecord.find(filter) // Changed from FeedLog to FeedingRecord
      .populate('beneficiary', 'name gender group uniqueId')
      .sort({ date: -1, fedAt: -1 });
    
    // Prepare data for response
    const records = feedingRecords.map(record => ({
      id: record._id,
      beneficiaryUid: record.beneficiary?.uniqueId || record.uniqueId,
      beneficiaryName: record.beneficiary?.name || 'Unknown',
      date: record.date,
      time: record.fedAt.toTimeString().split(' ')[0],
      scannerName: record.deviceId || 'Unknown', // Changed from servedBy to deviceId
      status: 'ok' // Assuming all records are valid
    }));
    
    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanQRCode,
  setManualFeedingStatus,
  getFedToday,
  getFeedHistory,
  getStats,
  getUnfed,
  exportFeedLogs,
  getFeedRecordsByDateRange
};