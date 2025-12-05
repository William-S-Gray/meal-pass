const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Employee = require('../models/Employee');
const FeedingRecord = require('../models/FeedingRecord');
const employeeService = require('../services/employeeService');
const qrService = require('../services/qrService');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseHelper');
const logger = require('../utils/logger');
const { create, update, query } = require('../validators/employeeValidator');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @desc    Create new employee
 * @route   POST /api/employees
 * @access  Private (Admin/Volunteer)
 */
const createEmployee = async (req, res, next) => {
  try {
    // Log the incoming request body for debugging
    console.log('Incoming employee data:', req.body);
    
    // Check if we have any data at all
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('No body data received');
      return sendError(res, 400, 'No data received. Please check your request format.');
    }
    
    // Validate request body
    const { error, value } = create.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details);
      return sendValidationError(res, error);
    }

    const result = await employeeService.create(value);
    
    // Return the response with _id as required and the complete data object
    res.status(201).json({
      success: true,
      _id: result._id,
      data: result
    });
  } catch (error) {
    logger.error('Error in createEmployee:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get all employees
 * @route   GET /api/employees
 * @access  Private (Admin/Volunteer)
 */
const getEmployees = async (req, res, next) => {
  try {
    // Validate query parameters
    const { error, value } = query.validate(req.query);
    if (error) {
      return sendValidationError(res, error);
    }

    const result = await employeeService.getAll(value, value.page, value.limit);
    sendSuccess(res, 200, result.data, null, result.pagination);
  } catch (error) {
    logger.error('Error in getEmployees:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get single employee
 * @route   GET /api/employees/:id
 * @access  Private (Admin/Volunteer)
 */
const getEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const employee = await employeeService.getById(id);
    if (!employee) {
      return sendError(res, 404, 'Employee not found');
    }
    
    sendSuccess(res, 200, employee);
  } catch (error) {
    logger.error('Error in getEmployee:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get employee by unique ID
 * @route   GET /api/employees/uid/:uid
 * @access  Public
 */
const getEmployeeByUid = async (req, res, next) => {
  try {
    const { uid } = req.params;
    
    const employee = await employeeService.getByUniqueId(uid);
    if (!employee) {
      return sendError(res, 404, 'Employee not found');
    }
    
    sendSuccess(res, 200, employee);
  } catch (error) {
    logger.error('Error in getEmployeeByUid:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private (Admin/Volunteer)
 */
const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const { error, value } = update.validate(req.body);
    if (error) {
      return sendValidationError(res, error);
    }

    const employee = await employeeService.update(id, value);
    if (!employee) {
      return sendError(res, 404, 'Employee not found');
    }
    
    sendSuccess(res, 200, employee, 'Employee updated successfully');
  } catch (error) {
    logger.error('Error in updateEmployee:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Delete employee
 * @route   DELETE /api/employees/:id
 * @access  Private (Admin)
 */
const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deleted = await employeeService.remove(id);
    if (!deleted) {
      return sendError(res, 404, 'Employee not found');
    }
    
    sendSuccess(res, 200, null, 'Employee deleted successfully');
  } catch (error) {
    logger.error('Error in deleteEmployee:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Download QR code for employee
 * @route   GET /api/employees/:id/qrcode
 * @access  Private
 */
const downloadQRCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const employee = await employeeService.getById(id);
    if (!employee) {
      return sendError(res, 404, 'Employee not found');
    }
    
    if (!employee.qrCodeUrl) {
      return sendError(res, 404, 'QR code not found');
    }
    
    // Set proper headers for file download
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Serve the file directly instead of redirecting
    const filePath = path.join(__dirname, '..', 'public', employee.qrCodeUrl);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return sendError(res, 404, 'QR code file not found');
    }
    
    // Set content type and serve file
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(employee.qrCodeUrl)}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Error in downloadQRCode:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get QR code as DataURL (Base64) for employee
 * @route   GET /api/employees/:id/qrcode/dataurl
 * @access  Private
 */
const getQRCodeDataUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const employee = await employeeService.getById(id);
    if (!employee) {
      return sendError(res, 404, 'Employee not found');
    }
    
    if (!employee.uniqueId) {
      return sendError(res, 404, 'Employee unique ID not found');
    }
    
    // Generate QR code as DataURL
    const qrCodeDataUrl = await qrService.generateQRCodeDataUri(employee.uniqueId);
    
    res.status(200).json({
      success: true,
      data: qrCodeDataUrl
    });
  } catch (error) {
    logger.error('Error in getQRCodeDataUrl:', error);
    sendError(res, 500, error.message);
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployee,
  getEmployeeByUid,
  updateEmployee,
  deleteEmployee,
  downloadQRCode,
  getQRCodeDataUrl,
  upload
};