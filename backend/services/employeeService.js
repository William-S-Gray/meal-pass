const Employee = require('../models/Employee');
const qrService = require('./qrService');
const { generateUniqueId } = require('../utils/helpers');
const logger = require('../utils/logger');

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
 * Format employee response data
 * @param {Object} employee - Employee data from database
 * @returns {Object} Formatted employee data
 */
const formatEmployeeResponse = (employee) => {
  // Generate the correct QR code URL for GridFS streaming
  let qrCodeUrl = '';
  if (employee.qrFileName) {
    // Use the new GridFS streaming endpoint
    qrCodeUrl = `/api/employees/uid/${employee.uniqueId}/qrcode`;
  }
  
  // Format the response to match frontend expectations
  return {
    _id: employee._id.toString(),
    uniqueId: employee.uniqueId,
    name: employee.name,
    gender: employee.gender,
    phone: employee.phone,
    department: employee.department,
    position: employee.position,
    validUntil: employee.validUntil.toISOString(),
    qrCodeUrl: qrCodeUrl, // Use the correct GridFS streaming URL
    qrFileName: employee.qrFileName || '', // New field for GridFS filename
    photo: employee.photo || '',
    createdAt: employee.createdAt?.toISOString(),
    updatedAt: employee.updatedAt?.toISOString(),
    active: employee.active !== undefined ? employee.active : true
  };
};

/**
 * Create a new employee
 * @param {Object} employeeData - Employee data
 * @returns {Object} Created employee
 */
const create = async (employeeData) => {
  try {
    logger.info('Creating new employee', { name: employeeData.name });
    
    // Generate unique ID if not provided
    const uniqueId = employeeData.uniqueId || generateUniqueId();
    
    // Create employee
    const employee = new Employee({
      ...employeeData,
      uniqueId
    });
    
    await employee.save();
    
    // Generate QR code and store filename in qrFileName field
    try {
      const qrFileName = await qrService.generateQRCode(uniqueId);
      employee.qrFileName = qrFileName; // Store filename in correct field
      await employee.save();
    } catch (qrError) {
      logger.error('Failed to generate QR code for employee', { 
        id: employee._id, 
        uniqueId,
        error: qrError.message 
      });
      // Don't fail employee creation if QR generation fails
    }
    
    logger.info('Employee created successfully', { id: employee._id, uniqueId });
    
    // Emit WebSocket event for real-time updates
    try {
      const app = require('../server'); // Get app instance to access io
      const io = app.get('io');
      if (io) {
        // Emit specific event for employee creation
        io.emit('employeeCreated', {
          employee: formatEmployeeResponse(employee)
        });
      }
    } catch (wsError) {
      logger.warn('Failed to emit WebSocket event', { 
        id: employee._id, 
        error: wsError.message 
      });
    }
    
    return formatEmployeeResponse(employee);
  } catch (error) {
    logger.error('Error creating employee', { error: error.message, stack: error.stack });
    throw error;
  }
};

/**
 * Get all employees with pagination
 * @param {Object} filters - Search and filter parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Paginated employees
 */
const getAll = async (filters = {}, page = 1, limit = 10) => {
  try {
    logger.info('Fetching employees', { page, limit, filters });
    
    const query = { active: true };
    
    // Apply search filter
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { uniqueId: { $regex: filters.search, $options: 'i' } },
        { department: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination using lean for better performance
    const employees = await Employee.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Use lean to get plain JavaScript objects instead of Mongoose documents
    
    const total = await Employee.countDocuments(query);
    
    const result = {
      data: employees.map(formatEmployeeResponse),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    logger.info('Employees fetched successfully', { count: employees.length });
    return result;
  } catch (error) {
    logger.error('Error fetching employees', { error: error.message });
    throw error;
  }
};

/**
 * Get employee by ID
 * @param {string} id - Employee ID
 * @returns {Object|null} Employee data or null if not found
 */
const getById = async (id) => {
  try {
    logger.info('Fetching employee by ID', { id });
    
    const employee = await Employee.findById(id).lean(); // Use lean for better performance
    if (!employee) {
      logger.warn('Employee not found', { id });
      return null;
    }
    
    logger.info('Employee fetched successfully', { id });
    return formatEmployeeResponse(employee);
  } catch (error) {
    logger.error('Error fetching employee by ID', { id, error: error.message });
    throw error;
  }
};

/**
 * Get employee by unique ID
 * @param {string} uniqueId - Employee unique ID
 * @returns {Object|null} Employee data or null if not found
 */
const getByUniqueId = async (uniqueId) => {
  try {
    logger.info('Fetching employee by unique ID', { uniqueId });
    
    const employee = await Employee.findOne({ uniqueId, active: true }).lean(); // Use lean for better performance
    if (!employee) {
      logger.warn('Employee not found', { uniqueId });
      return null;
    }
    
    logger.info('Employee fetched successfully', { uniqueId });
    return formatEmployeeResponse(employee);
  } catch (error) {
    logger.error('Error fetching employee by unique ID', { uniqueId, error: error.message });
    throw error;
  }
};

/**
 * Update employee
 * @param {string} id - Employee ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated employee
 */
const update = async (id, updateData) => {
  try {
    logger.info('Updating employee', { id });
    
    // Remove protected fields
    const protectedFields = ['uniqueId', 'qrCodeUrl', 'createdAt', 'updatedAt'];
    protectedFields.forEach(field => delete updateData[field]);
    
    const employee = await Employee.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean(); // Use lean for better performance
    
    if (!employee) {
      logger.warn('Employee not found for update', { id });
      throw new Error('Employee not found');
    }
    
    logger.info('Employee updated successfully', { id });
    
    // Emit WebSocket event for real-time updates
    const app = require('../server'); // Get app instance to access io
    const io = app.get('io');
    if (io) {
      // Emit specific event for employee update
      io.emit('employeeUpdated', {
        employee: formatEmployeeResponse(employee)
      });
    }
    
    return formatEmployeeResponse(employee);
  } catch (error) {
    logger.error('Error updating employee', { id, error: error.message });
    throw error;
  }
};

/**
 * Delete employee (soft delete)
 * @param {string} id - Employee ID
 * @returns {boolean} Success status
 */
const remove = async (id) => {
  try {
    logger.info('Deleting employee', { id });
    
    const employee = await Employee.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );
    
    if (!employee) {
      logger.warn('Employee not found for deletion', { id });
      return false;
    }
    
    logger.info('Employee deleted successfully', { id });
    
    // Emit WebSocket event for real-time updates
    const app = require('../server'); // Get app instance to access io
    const io = app.get('io');
    if (io) {
      // Emit specific event for employee deletion
      io.emit('employeeDeleted', {
        employeeId: id
      });
    }
    
    return true;
  } catch (error) {
    logger.error('Error deleting employee', { id, error: error.message });
    throw error;
  }
};

module.exports = {
  create,
  getAll,
  getById,
  getByUniqueId,
  update,
  remove
};