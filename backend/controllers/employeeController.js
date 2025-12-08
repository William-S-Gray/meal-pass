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
 * Create employee
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createEmployee = async (req, res, next) => {
  try {
    logger.info('Creating new employee', { body: req.body });
    
    // Validate request
    const { error, value } = create.validate(req.body);
    if (error) {
      logger.warn('Employee creation validation failed', { error: error.details });
      return sendValidationError(res, error);
    }
    
    // Capitalize the employee name
    const capitalizedData = {
      ...value,
      name: capitalizeName(value.name)
    };
    
    // Create employee
    const employee = await employeeService.create(capitalizedData);
    
    // Generate QR code and store filename in database
    const qrFileName = await qrService.generateQRCode(employee.uniqueId);
    
    // Update employee with QR code filename
    await employeeService.update(employee._id, { qrFileName: qrFileName });
    
    logger.info('Employee created successfully', { id: employee._id, uniqueId: employee.uniqueId });
    
    // Send success response
    sendSuccess(res, 201, 'Employee created successfully', {
      _id: employee._id,
      uniqueId: employee.uniqueId,
      name: employee.name,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      validUntil: employee.validUntil,
      qrFileName: qrFileName,
      createdAt: employee.createdAt
    });
  } catch (error) {
    logger.error('Error in createEmployee:', error);
    next(error);
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
 * Update employee
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateEmployee = async (req, res, next) => {
  try {
    logger.info('Updating employee', { id: req.params.id, body: req.body });
    
    // Validate request
    const { error, value } = update.validate(req.body);
    if (error) {
      logger.warn('Employee update validation failed', { error: error.details });
      return sendError(res, 400, error.details[0].message);
    }
    
    // Capitalize the employee name if provided
    const updateData = { ...value };
    if (updateData.name) {
      updateData.name = capitalizeName(updateData.name);
    }
    
    // Update employee
    const employee = await employeeService.update(req.params.id, updateData);
    if (!employee) {
      logger.warn('Employee not found for update', { id: req.params.id });
      return sendError(res, 404, 'Employee not found');
    }
    
    logger.info('Employee updated successfully', { id: employee._id });
    
    // Send success response
    sendSuccess(res, 200, 'Employee updated successfully', employee);
  } catch (error) {
    logger.error('Error in updateEmployee:', error);
    next(error);
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
      logger.warn('Employee not found for QR code download', { id });
      return sendError(res, 404, 'Employee not found');
    }
    
    if (!employee.qrFileName) {
      logger.warn('QR code filename not found for employee', { id, employee });
      return sendError(res, 404, 'QR code not found');
    }
    
    // Set proper headers for file download
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Get QR code from GridFS
    const qrBuffer = await qrService.getQRCodeFromGridFS(employee.qrFileName);
    
    // Set content type and serve file
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${employee.qrFileName}"`);
    
    // Send the image buffer
    res.send(qrBuffer);
  } catch (error) {
    logger.error('Error in downloadQRCode:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Download QR code for employee by uniqueId
 * @route   GET /api/employees/uid/:uid/qrcode
 * @access  Private
 */
const downloadQRCodeByUid = async (req, res, next) => {
  try {
    const { uid } = req.params;
    
    const employee = await employeeService.getByUniqueId(uid);
    if (!employee) {
      logger.warn('Employee not found for QR code download by UID', { uid });
      return sendError(res, 404, 'Employee not found');
    }
    
    if (!employee.qrFileName) {
      logger.warn('QR code filename not found for employee by UID', { uid, employee });
      return sendError(res, 404, 'QR code not found');
    }
    
    // Set proper headers for file download
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Get QR code from GridFS
    const qrBuffer = await qrService.getQRCodeFromGridFS(employee.qrFileName);
    
    // Set content type and serve file
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${employee.qrFileName}"`);
    
    // Send the image buffer
    res.send(qrBuffer);
  } catch (error) {
    logger.error('Error in downloadQRCodeByUid:', error);
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

/**
 * @desc    Generate QR code on-demand for employee by uniqueId
 * @route   GET /api/employees/uid/:uid/qrcode/dynamic
 * @access  Public
 */
const generateDynamicQRCode = async (req, res, next) => {
  try {
    const { uid } = req.params;
    
    const employee = await employeeService.getByUniqueId(uid);
    if (!employee) {
      return sendError(res, 404, 'Employee not found');
    }
    
    if (!employee.uniqueId) {
      return sendError(res, 404, 'Employee unique ID not found');
    }
    
    // Generate QR code on-demand
    const qrCodeBuffer = await qrService.generateQRCodeOnDemand(employee.uniqueId);
    
    // Set proper headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-${employee.uniqueId}.png"`);
    
    // Send the image buffer
    res.send(qrCodeBuffer);
  } catch (error) {
    logger.error('Error in generateDynamicQRCode:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Generate printable card sheet for multiple employees
 * @route   POST /api/employees/print-cards
 * @access  Private (Admin/Volunteer)
 */
const printBulkCards = async (req, res, next) => {
  try {
    const { employeeIds } = req.body;
    
    // Validate input
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return sendError(res, 400, 'Employee IDs are required');
    }
    
    // Limit to reasonable number of employees per request
    if (employeeIds.length > 100) {
      return sendError(res, 400, 'Cannot generate more than 100 cards at once');
    }
    
    // Find employees by IDs
    const employees = await Employee.find({
      '_id': { $in: employeeIds },
      'active': { $ne: false }
    }).select('name gender uniqueId qrCodeUrl validUntil department position');
    
    if (employees.length === 0) {
      return sendError(res, 404, 'No employees found');
    }
    
    // Generate HTML for card sheet
    const cardHtml = employees.map(employee => {
      return `
        <div class="employee-card">
          <div class="card-header">
            <div class="logo-placeholder"></div>
            <div class="organization-name">Africa Accommodation Providers</div>
          </div>
          
          <div class="employee-info">
            <div class="employee-name">${escapeHtml(employee.name)}</div>
            <div class="employee-id">${escapeHtml(employee.uniqueId)}</div>
            ${employee.gender ? `<div class="employee-gender">${escapeHtml(employee.gender)}</div>` : ''}
            ${employee.department ? `<div class="employee-department">${escapeHtml(employee.department)}</div>` : ''}
            ${employee.position ? `<div class="employee-position">${escapeHtml(employee.position)}</div>` : ''}
            <div class="employee-valid-until">Valid Until: ${employee.validUntil ? new Date(employee.validUntil).toLocaleDateString() : 'N/A'}</div>
          </div>
          
          <div class="qr-container">
            ${employee.qrCodeUrl ? 
              `<img src="${process.env.BASE_URL || 'http://localhost:5000'}${employee.qrCodeUrl}" alt="QR Code" class="qr-code" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiPkNSQyBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+';">` : 
              `<div class="qr-placeholder">QR Code<br>Not Available</div>`
            }
          </div>
        </div>
      `;
    }).join('\n');
    
    // Read CSS content
    const cssPath = path.join(__dirname, '..', 'public', 'cardSheet.css');
    let cssContent = '';
    try {
      cssContent = fs.readFileSync(cssPath, 'utf8');
    } catch (cssError) {
      // Fallback CSS if file not found
      cssContent = `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { margin: 0; font-family: Arial, sans-serif; font-size: 12pt; }
          .card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; }
          .employee-card { width: 85mm; height: 55mm; border: 1pt solid #333; padding: 3mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
          .card-header { text-align: center; margin-bottom: 1mm; }
          .logo-placeholder { height: 8pt; background-color: #eee; margin-bottom: 1mm; }
          .organization-name { font-size: 10pt; font-weight: bold; }
          .employee-info { flex-grow: 1; }
          .employee-name { font-size: 14pt; font-weight: bold; margin: 1mm 0; word-wrap: break-word; }
          .employee-id { font-size: 11pt; font-family: 'Courier New', monospace; margin: 1mm 0; }
          .employee-gender { font-size: 10pt; margin: 1mm 0; }
          .employee-department, .employee-position { font-size: 9pt; margin: 1mm 0; }
          .employee-valid-until { font-size: 8pt; margin: 1mm 0; }
          .qr-container { text-align: center; margin-top: 1mm; }
          .qr-code { max-width: 100%; max-height: 25mm; }
          .qr-placeholder { font-size: 8pt; color: #666; }
          .print-header, .print-footer { text-align: center; margin: 5mm 0; }
        }
        body { font-family: Arial, sans-serif; margin: 10mm; }
        .print-header h1 { margin: 0; }
      `;
    }
    
    // Create the full HTML document
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee ID Cards - Africa Accommodation Providers</title>
    <style>
        ${cssContent}
    </style>
</head>
<body>
    <div class="print-header">
        <div class="logo-placeholder"></div>
        <h1>Africa Accommodation Providers</h1>
    </div>
    
    <div class="card-grid">
        ${cardHtml}
    </div>
    
    <div class="print-footer">
        <p>Generated by Meal Pass System - ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;
    
    // Send HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlContent);
  } catch (error) {
    logger.error('Error in printBulkCards:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Generate printable card for a single employee
 * @route   GET /api/employees/:id/print-card
 * @access  Private (Admin/Volunteer)
 */
const printSingleCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get employee by ID
    const employee = await Employee.findById(id).select('name gender uniqueId qrCodeUrl validUntil department position');
    
    if (!employee) {
      return sendError(res, 404, 'Employee not found');
    }
    
    // Generate HTML for single card
    const cardHtml = `
      <div class="employee-card">
        <div class="card-header">
          <div class="logo-placeholder"></div>
          <div class="organization-name">Africa Accommodation Providers</div>
        </div>
        
        <div class="employee-info">
          <div class="employee-name">${escapeHtml(employee.name)}</div>
          <div class="employee-id">${escapeHtml(employee.uniqueId)}</div>
          ${employee.gender ? `<div class="employee-gender">${escapeHtml(employee.gender)}</div>` : ''}
          ${employee.department ? `<div class="employee-department">${escapeHtml(employee.department)}</div>` : ''}
          ${employee.position ? `<div class="employee-position">${escapeHtml(employee.position)}</div>` : ''}
          <div class="employee-valid-until">Valid Until: ${employee.validUntil ? new Date(employee.validUntil).toLocaleDateString() : 'N/A'}</div>
        </div>
        
        <div class="qr-container">
          ${employee.qrCodeUrl ? 
            `<img src="${process.env.BASE_URL || 'http://localhost:5000'}${employee.qrCodeUrl}" alt="QR Code" class="qr-code" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiPkNSQyBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+';">` : 
            `<div class="qr-placeholder">QR Code<br>Not Available</div>`
          }
        </div>
      </div>
    `;

    // Read CSS content
    const cssPath = path.join(__dirname, '..', 'public', 'cardSheet.css');
    let cssContent = '';
    try {
      cssContent = fs.readFileSync(cssPath, 'utf8');
    } catch (cssError) {
      // Fallback CSS if file not found
      cssContent = `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { margin: 0; font-family: Arial, sans-serif; font-size: 12pt; }
          .card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; }
          .employee-card { width: 85mm; height: 55mm; border: 1pt solid #333; padding: 3mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
          .card-header { text-align: center; margin-bottom: 1mm; }
          .logo-placeholder { height: 8pt; background-color: #eee; margin-bottom: 1mm; }
          .organization-name { font-size: 10pt; font-weight: bold; }
          .employee-info { flex-grow: 1; }
          .employee-name { font-size: 14pt; font-weight: bold; margin: 1mm 0; word-wrap: break-word; }
          .employee-id { font-size: 11pt; font-family: 'Courier New', monospace; margin: 1mm 0; }
          .employee-gender { font-size: 10pt; margin: 1mm 0; }
          .employee-department, .employee-position { font-size: 9pt; margin: 1mm 0; }
          .employee-valid-until { font-size: 8pt; margin: 1mm 0; }
          .qr-container { text-align: center; margin-top: 1mm; }
          .qr-code { max-width: 100%; max-height: 25mm; }
          .qr-placeholder { font-size: 8pt; color: #666; }
          .print-header, .print-footer { text-align: center; margin: 5mm 0; }
        }
        body { font-family: Arial, sans-serif; margin: 10mm; }
        .print-header h1 { margin: 0; }
      `;
    }
    
    // Create the full HTML document
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee ID Card - Africa Accommodation Providers</title>
    <style>
        ${cssContent}
    </style>
</head>
<body>
    <div class="print-header">
        <div class="logo-placeholder"></div>
        <h1>Africa Accommodation Providers</h1>
    </div>
    
    <div class="card-grid">
        ${cardHtml}
    </div>
    
    <div class="print-footer">
        <p>Generated by Meal Pass System - ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;
    
    // Send HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlContent);
  } catch (error) {
    logger.error('Error in printSingleCard:', error);
    sendError(res, 500, error.message);
  }
};

// Helper function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  return text
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  createEmployee,
  getEmployees,
  getEmployee,
  getEmployeeByUid,
  updateEmployee,
  deleteEmployee,
  upload,
  downloadQRCode,
  downloadQRCodeByUid,
  getQRCodeDataUrl,
  printBulkCards,
  printSingleCard
};