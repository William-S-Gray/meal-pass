const Beneficiary = require('../models/Beneficiary');
const FeedingRecord = require('../models/FeedingRecord'); // Changed from FeedLog to FeedingRecord

/**
 * @desc    Get daily feeding report
 * @route   GET /api/reports/today
 * @access  Private (Admin only)
 */
const getDailyReport = async (req, res, next) => {
  try {
    // Check if admin
    if (req.admin && req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can access reports'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Get feeding records for today with pagination
    const feedingRecords = await FeedingRecord.find({ // Changed from FeedLog to FeedingRecord
      date: dateString
    })
      .populate('beneficiary', 'name gender group uniqueId')
      .skip(skip)
      .limit(limit)
      .sort({ fedAt: -1 });
    
    const total = await FeedingRecord.countDocuments({ // Changed from FeedLog to FeedingRecord
      date: dateString
    });
    
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
 * @desc    Get date range feeding report
 * @route   GET /api/reports/date-range
 * @access  Private (Admin only)
 */
const getDateRangeReport = async (req, res, next) => {
  try {
    // Check if admin
    if (req.admin && req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can access reports'
      });
    }

    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Both "from" and "to" date parameters are required'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Get feeding records for date range with pagination
    const feedingRecords = await FeedingRecord.find({ // Changed from FeedLog to FeedingRecord
      date: {
        $gte: from,
        $lte: to
      }
    })
      .populate('beneficiary', 'name gender group uniqueId')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, fedAt: -1 });
    
    const total = await FeedingRecord.countDocuments({ // Changed from FeedLog to FeedingRecord
      date: {
        $gte: from,
        $lte: to
      }
    });
    
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
 * @desc    Get feeding history for a specific beneficiary
 * @route   GET /api/reports/beneficiary/:uniqueId
 * @access  Private (Admin only)
 */
const getBeneficiaryReport = async (req, res, next) => {
  try {
    // Check if admin
    if (req.admin && req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can access reports'
      });
    }

    const { uniqueId } = req.params;
    
    // Find beneficiary
    const beneficiary = await Beneficiary.findOne({ uniqueId });
    
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Get feeding records for this beneficiary with pagination
    const feedingRecords = await FeedingRecord.find({ beneficiary: beneficiary._id }) // Changed from FeedLog to FeedingRecord
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, fedAt: -1 });
    
    const total = await FeedingRecord.countDocuments({ beneficiary: beneficiary._id }); // Changed from FeedLog to FeedingRecord
    
    res.status(200).json({
      success: true,
      count: feedingRecords.length,
      data: {
        beneficiary: {
          id: beneficiary._id,
          uniqueId: beneficiary.uniqueId,
          name: beneficiary.name,
          gender: beneficiary.gender,
          group: beneficiary.group
        },
        feedLogs: feedingRecords, // Keep the same name for frontend compatibility
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get statistics for reports dashboard
 * @route   GET /api/reports/statistics
 * @access  Private (Admin only)
 */
const getReportStatistics = async (req, res, next) => {
  try {
    // Check if admin
    if (req.admin && req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can access reports'
      });
    }

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
    
    // Get date range for weekly stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Weekly feeding trend
    const weeklyStats = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayString = date.toISOString().split('T')[0];
      
      const count = await FeedingRecord.countDocuments({ // Changed from FeedLog to FeedingRecord
        date: dayString
      });
      
      weeklyStats.push({
        date: dayString,
        count: count
      });
    }
    
    // Monthly feeding trend (last 30 days)
    const monthlyStats = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayString = date.toISOString().split('T')[0];
      
      const count = await FeedingRecord.countDocuments({ // Changed from FeedLog to FeedingRecord
        date: dayString
      });
      
      monthlyStats.push({
        date: dayString,
        count: count
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalBeneficiaries,
        totalFedToday,
        feedRate,
        weeklyStats: weeklyStats.reverse(), // Reverse to show oldest first
        monthlyStats: monthlyStats.reverse() // Reverse to show oldest first
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailyReport,
  getDateRangeReport,
  getBeneficiaryReport,
  getReportStatistics
};