const Employee = require('../models/Employee');
const FeedingRecord = require('../models/FeedingRecord');

/**
 * Capitalizes a name properly (First letter of each word uppercase, rest lowercase)
 * @param {string} name - The name to capitalize
 * @returns {string} The properly capitalized name
 */
function capitalizeName(name) {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
    const feedingRecords = await FeedingRecord.find({
      date: dateString
    })
      .populate('employee', 'name department position uniqueId')
      .skip(skip)
      .limit(limit)
      .sort({ fedAt: -1 });
    
    // Format the response to capitalize names
    const formattedRecords = feedingRecords.map(record => ({
      ...record.toObject(),
      employee: record.employee ? {
        ...record.employee.toObject(),
        name: capitalizeName(record.employee.name)
      } : record.employee
    }));
    
    const total = await FeedingRecord.countDocuments({
      date: dateString
    });
    
    res.status(200).json({
      success: true,
      count: formattedRecords.length,
      data: formattedRecords,
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
    const feedingRecords = await FeedingRecord.find({
      date: {
        $gte: from,
        $lte: to
      }
    })
      .populate('employee', 'name department position uniqueId')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, fedAt: -1 });
    
    // Format the response to capitalize names
    const formattedRecords = feedingRecords.map(record => ({
      ...record.toObject(),
      employee: record.employee ? {
        ...record.employee.toObject(),
        name: capitalizeName(record.employee.name)
      } : record.employee
    }));
    
    const total = await FeedingRecord.countDocuments({
      date: {
        $gte: from,
        $lte: to
      }
    });
    
    res.status(200).json({
      success: true,
      count: formattedRecords.length,
      data: formattedRecords,
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
 * @desc    Get feeding history for a specific employee
 * @route   GET /api/reports/employee/:uniqueId
 * @access  Private (Admin only)
 */
const getEmployeeReport = async (req, res, next) => {
  try {
    // Check if admin
    if (req.admin && req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can access reports'
      });
    }

    const { uniqueId } = req.params;
    
    // Find employee
    const employee = await Employee.findOne({ uniqueId });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Get feeding records for this employee with pagination
    const feedingRecords = await FeedingRecord.find({ employee: employee._id })
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, fedAt: -1 });
    
    const total = await FeedingRecord.countDocuments({ employee: employee._id });
    
    res.status(200).json({
      success: true,
      count: feedingRecords.length,
      data: {
        employee: {
          id: employee._id,
          uniqueId: employee.uniqueId,
          name: capitalizeName(employee.name), // Capitalize employee name
          department: employee.department,
          position: employee.position
        },
        feedLogs: feedingRecords,
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

    // Total employees
    const totalEmployees = await Employee.countDocuments();
    
    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Total fed today
    const totalFedToday = await FeedingRecord.countDocuments({
      date: dateString
    });
    
    // Calculate feed rate percentage
    const feedRate = totalEmployees > 0 
      ? Math.round((totalFedToday / totalEmployees) * 100) 
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
      
      const count = await FeedingRecord.countDocuments({
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
      
      const count = await FeedingRecord.countDocuments({
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
        totalEmployees,
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
  getEmployeeReport,
  getReportStatistics
};