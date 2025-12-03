const Beneficiary = require('../models/Beneficiary');
const FeedLog = require('../models/FeedLog');
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
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingLog = await FeedLog.findOne({
      uniqueId,
      fedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    if (existingLog) {
      return res.status(200).json({
        success: true,
        data: {
          beneficiary,
          alreadyFed: true,
          feedLog: existingLog,
          message: 'Beneficiary already fed today'
        }
      });
    }
    
    // Create feed log
    const feedLog = new FeedLog({
      beneficiaryId: beneficiary._id,
      uniqueId: beneficiary.uniqueId,
      fedAt: new Date()
    });
    
    await feedLog.save();
    
    res.status(200).json({
      success: true,
      data: {
        beneficiary,
        alreadyFed: false,
        feedLog,
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
    
    // Build date range for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Check if already has a feed log for today
    const existingLog = await FeedLog.findOne({
      uniqueId,
      fedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    let feedLog;
    let message;
    
    if (fed) {
      // Mark as fed
      if (existingLog) {
        // Already fed, return existing log
        feedLog = existingLog;
        message = 'Beneficiary already marked as fed today';
      } else {
        // Create new feed log
        feedLog = new FeedLog({
          beneficiaryId: beneficiary._id,
          uniqueId: beneficiary.uniqueId,
          fedAt: new Date(),
          servedBy: `${admin.name} (Manual)`
        });
        await feedLog.save();
        message = 'Beneficiary manually marked as fed';
      }
    } else {
      // Mark as not fed (remove feed log if exists)
      if (existingLog) {
        await FeedLog.deleteOne({ _id: existingLog._id });
        message = 'Beneficiary manually marked as not fed (removed feed record)';
      } else {
        message = 'Beneficiary already not fed today';
      }
      feedLog = null;
    }
    
    res.status(200).json({
      success: true,
      data: {
        beneficiary,
        fed: !!feedLog,
        feedLog,
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
    
    // Build date range for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Build filter
    const filter = {
      fedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };
    
    // Add group filter if provided
    if (req.query.group) {
      filter.group = req.query.group;
    }
    
    const feedLogs = await FeedLog.find(filter)
      .populate('beneficiaryId', 'name gender group')
      .skip(skip)
      .limit(limit)
      .sort({ fedAt: -1 });
    
    const total = await FeedLog.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: feedLogs.length,
      data: feedLogs,
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
    
    // Get feed logs for this beneficiary
    const feedLogs = await FeedLog.find({ beneficiaryId: beneficiary._id })
      .sort({ fedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: feedLogs.length,
      data: feedLogs
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
    
    // Build date range for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Total fed today
    const totalFedToday = await FeedLog.countDocuments({
      fedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
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
    
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);
    
    // Total fed in date range
    const totalFedInRange = await FeedLog.countDocuments({
      fedAt: {
        $gte: startDate,
        $lte: endDate
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
          startDate,
          endDate
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
    
    // Build date range for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Find beneficiaries who have been fed today
    const fedBeneficiaries = await FeedLog.distinct('beneficiaryId', {
      fedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
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
      filter.fedAt = {};
      
      if (req.query.startDate) {
        filter.fedAt.$gte = new Date(req.query.startDate);
      }
      
      if (req.query.endDate) {
        filter.fedAt.$lte = new Date(req.query.endDate);
        // Set to end of day
        filter.fedAt.$lte.setHours(23, 59, 59, 999);
      }
    }
    
    // Get feed logs
    const feedLogs = await FeedLog.find(filter)
      .populate('beneficiaryId', 'name gender group uniqueId')
      .sort({ fedAt: -1 });
    
    // Prepare data for export
    const exportData = feedLogs.map(log => ({
      date: log.fedAt.toISOString().split('T')[0],
      time: log.fedAt.toTimeString().split(' ')[0],
      beneficiaryId: log.beneficiaryId?.uniqueId || log.uniqueId,
      name: log.beneficiaryId?.name || 'Unknown',
      gender: log.beneficiaryId?.gender || 'Unknown',
      group: log.beneficiaryId?.group || 'Unknown',
      servedBy: log.servedBy
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

module.exports = {
  scanQRCode,
  setManualFeedingStatus,
  getFedToday,
  getFeedHistory,
  getStats,
  getUnfed,
  exportFeedLogs
};