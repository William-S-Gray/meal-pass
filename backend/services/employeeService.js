const Employee = require('../models/Employee');
const qrService = require('./qrService');
const { generateUniqueId } = require('../utils/helpers');
const logger = require('../utils/logger');
const { performanceTracker } = require('../utils/performanceLogger');

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
    const operationId = `create-employee-${Date.now()}`;
    performanceTracker.start(operationId);
    
    logger.info('Creating new employee', { name: employeeData.name });
    
    // Generate unique ID if not provided
    const uniqueId = employeeData.uniqueId || generateUniqueId();
    
    // Create employee
    const employee = new Employee({
      ...employeeData,
      uniqueId
    });
    
    await employee.save();
    
    // Generate QR code with both uniqueId and name, and store filename in qrFileName field
    try {
      const qrFileName = await qrService.generateQRCode(uniqueId, employeeData.name);
      employee.qrFileName = qrFileName; // Store filename in correct field
      await employee.save();
    } catch (qrError) {
      logger.error('Failed to generate QR code for employee', { 
        id: employee._id, 
        uniqueId,
        error: qrError.message 
      });
      // Don't throw error here as we still want to create the employee
    }
    
    const duration = performanceTracker.end(operationId, 'createEmployee');
    
    return formatEmployeeResponse(employee);
  } catch (error) {
    logger.error('Error creating employee', { error: error.message });
    
    // Handle duplicate key error for uniqueId
    if (error.code === 11000 && error.keyPattern && error.keyPattern.uniqueId) {
      throw new Error('An employee with this ID already exists. Please use a different ID.');
    }
    
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
    const operationId = `get-all-employees-${Date.now()}`;
    performanceTracker.start(operationId);
    
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
    
    const duration = performanceTracker.end(operationId, 'getAllEmployees', { 
      resultCount: employees.length,
      page,
      limit
    });
    
    performanceTracker.logDbQuery('employees', query, duration, employees.length);

    return result;
  } catch (error) {
    logger.error('Error fetching employees', { error: error.message });
    throw error;
  }
};

/**
 * Get employee by unique ID with performance tracking
 * @param {string} uniqueId - Employee unique ID
 * @returns {Object} Employee data
 */
const getByUniqueId = async (uniqueId) => {
  try {
    const operationId = `get-employee-by-uid-${uniqueId}`;
    performanceTracker.start(operationId);
    
    logger.info('Fetching employee by unique ID', { uniqueId });
    
    // Find employee by uniqueId with optimized query
    const employee = await Employee.findOne({ uniqueId, active: true })
      .select('_id uniqueId name gender phone department position validUntil qrCodeUrl qrFileName photo createdAt updatedAt active')
      .lean()
      .exec();
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    const duration = performanceTracker.end(operationId, 'getEmployeeByUniqueId');
    performanceTracker.logDbQuery('employees', { uniqueId, active: true }, duration);
    
    return formatEmployeeResponse(employee);
  } catch (error) {
    logger.error('Error fetching employee by unique ID', { uniqueId, error: error.message });
    throw error;
  }
};

/**
 * Get employee by ID with performance tracking
 * @param {string} id - Employee ID
 * @returns {Object} Employee data
 */
const getById = async (id) => {
  try {
    const operationId = `get-employee-by-id-${id}`;
    performanceTracker.start(operationId);
    
    logger.info('Fetching employee by ID', { id });
    
    // Find employee by ID with optimized query
    const employee = await Employee.findById(id)
      .select('_id uniqueId name gender phone department position validUntil qrCodeUrl qrFileName photo createdAt updatedAt active')
      .lean()
      .exec();
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    const duration = performanceTracker.end(operationId, 'getEmployeeById');
    performanceTracker.logDbQuery('employees', { _id: id }, duration);
    
    return formatEmployeeResponse(employee);
  } catch (error) {
    logger.error('Error fetching employee by ID', { id, error: error.message });
    throw error;
  }
};

/**
 * Remove an employee (soft delete)
 * @param {string} id - Employee ID
 * @returns {boolean} Success status
 */
const remove = async (id) => {
  try {
    const operationId = `remove-employee-${id}`;
    performanceTracker.start(operationId);
    
    logger.info('Removing employee', { id });
    
    // Soft delete by setting active to false
    const employee = await Employee.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    const duration = performanceTracker.end(operationId, 'removeEmployee');
    
    return true;
  } catch (error) {
    logger.error('Error removing employee', { id, error: error.message });
    throw error;
  }
};

/**
 * Update an employee
 * @param {string} id - Employee ID
 * @param {Object} updateData - Update data
 * @returns {Object} Updated employee
 */
const update = async (id, updateData) => {
  try {
    const operationId = `update-employee-${id}`;
    performanceTracker.start(operationId);
    
    logger.info('Updating employee', { id, updateData });
    
    // Find the existing employee
    const existingEmployee = await Employee.findById(id);
    if (!existingEmployee) {
      throw new Error('Employee not found');
    }
    
    // Check if name is being updated
    const nameChanged = updateData.name && updateData.name !== existingEmployee.name;
    
    // Update employee
    const employee = await Employee.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    // If name changed or QR code doesn't exist, regenerate QR code
    if (nameChanged || !employee.qrFileName) {
      try {
        // Generate new QR code with updated name
        const qrFileName = await qrService.generateQRCode(employee.uniqueId, employee.name);
        employee.qrFileName = qrFileName;
        await employee.save();
      } catch (qrError) {
        logger.error('Failed to regenerate QR code for employee', { 
          id: employee._id, 
          uniqueId: employee.uniqueId,
          error: qrError.message 
        });
        // Don't throw error here as we still want to update the employee
      }
    }
    
    const duration = performanceTracker.end(operationId, 'updateEmployee');
    
    return formatEmployeeResponse(employee);
  } catch (error) {
    logger.error('Error updating employee', { id, error: error.message });
    throw error;
  }
};

module.exports = {
  capitalizeName,
  formatEmployeeResponse,
  create,
  getAll,
  getById,
  getByUniqueId,
  remove,
  update
};