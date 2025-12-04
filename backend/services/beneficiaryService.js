const Beneficiary = require('../models/Beneficiary');
const qrService = require('./qrService');
const { generateUniqueId } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Format beneficiary response data
 * @param {Object} beneficiary - Beneficiary document
 * @returns {Object} Formatted beneficiary data
 */
const formatBeneficiaryResponse = (beneficiary) => {
  return {
    _id: beneficiary._id,
    uniqueId: beneficiary.uniqueId,
    name: beneficiary.name,
    dob: beneficiary.dob,
    gender: beneficiary.gender,
    group: beneficiary.group,
    qrCodeUrl: beneficiary.qrCodeUrl,
    photo: beneficiary.photo,
    active: beneficiary.active,
    createdAt: beneficiary.createdAt,
    updatedAt: beneficiary.updatedAt
  };
};

/**
 * Create a new beneficiary
 * @param {Object} beneficiaryData - Beneficiary data
 * @returns {Object} Created beneficiary
 */
const create = async (beneficiaryData) => {
  try {
    logger.info('Creating new beneficiary', { name: beneficiaryData.name });
    
    // Generate unique ID
    const uniqueId = generateUniqueId();
    
    // Create beneficiary
    const beneficiary = new Beneficiary({
      ...beneficiaryData,
      uniqueId
    });
    
    await beneficiary.save();
    
    // Generate QR code
    const qrCodePath = await qrService.generateQRCode(uniqueId);
    beneficiary.qrCodeUrl = qrCodePath;
    await beneficiary.save();
    
    logger.info('Beneficiary created successfully', { id: beneficiary._id, uniqueId });
    return formatBeneficiaryResponse(beneficiary);
  } catch (error) {
    logger.error('Error creating beneficiary', { error: error.message });
    throw error;
  }
};

/**
 * Get all beneficiaries with pagination
 * @param {Object} filters - Search and filter parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Paginated beneficiaries
 */
const getAll = async (filters = {}, page = 1, limit = 10) => {
  try {
    logger.info('Fetching beneficiaries', { page, limit, filters });
    
    const query = { active: true };
    
    // Apply search filter
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { uniqueId: { $regex: filters.search, $options: 'i' } },
        { group: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination using lean for better performance
    const beneficiaries = await Beneficiary.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Use lean to get plain JavaScript objects instead of Mongoose documents
    
    const total = await Beneficiary.countDocuments(query);
    
    const result = {
      data: beneficiaries.map(formatBeneficiaryResponse),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    logger.info('Beneficiaries fetched successfully', { count: beneficiaries.length });
    return result;
  } catch (error) {
    logger.error('Error fetching beneficiaries', { error: error.message });
    throw error;
  }
};

/**
 * Get beneficiary by ID
 * @param {string} id - Beneficiary ID
 * @returns {Object|null} Beneficiary data or null if not found
 */
const getById = async (id) => {
  try {
    logger.info('Fetching beneficiary by ID', { id });
    
    const beneficiary = await Beneficiary.findById(id).lean(); // Use lean for better performance
    if (!beneficiary) {
      logger.warn('Beneficiary not found', { id });
      return null;
    }
    
    logger.info('Beneficiary fetched successfully', { id });
    return formatBeneficiaryResponse(beneficiary);
  } catch (error) {
    logger.error('Error fetching beneficiary by ID', { id, error: error.message });
    throw error;
  }
};

/**
 * Get beneficiary by unique ID
 * @param {string} uniqueId - Beneficiary unique ID
 * @returns {Object|null} Beneficiary data or null if not found
 */
const getByUniqueId = async (uniqueId) => {
  try {
    logger.info('Fetching beneficiary by unique ID', { uniqueId });
    
    const beneficiary = await Beneficiary.findOne({ uniqueId, active: true }).lean(); // Use lean for better performance
    if (!beneficiary) {
      logger.warn('Beneficiary not found', { uniqueId });
      return null;
    }
    
    logger.info('Beneficiary fetched successfully', { uniqueId });
    return formatBeneficiaryResponse(beneficiary);
  } catch (error) {
    logger.error('Error fetching beneficiary by unique ID', { uniqueId, error: error.message });
    throw error;
  }
};

/**
 * Update beneficiary
 * @param {string} id - Beneficiary ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated beneficiary
 */
const update = async (id, updateData) => {
  try {
    logger.info('Updating beneficiary', { id });
    
    // Remove protected fields
    const protectedFields = ['uniqueId', 'qrCodeUrl', 'createdAt', 'updatedAt'];
    protectedFields.forEach(field => delete updateData[field]);
    
    const beneficiary = await Beneficiary.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean(); // Use lean for better performance
    
    if (!beneficiary) {
      logger.warn('Beneficiary not found for update', { id });
      throw new Error('Beneficiary not found');
    }
    
    logger.info('Beneficiary updated successfully', { id });
    return formatBeneficiaryResponse(beneficiary);
  } catch (error) {
    logger.error('Error updating beneficiary', { id, error: error.message });
    throw error;
  }
};

/**
 * Delete beneficiary (soft delete)
 * @param {string} id - Beneficiary ID
 * @returns {boolean} Success status
 */
const remove = async (id) => {
  try {
    logger.info('Deleting beneficiary', { id });
    
    const beneficiary = await Beneficiary.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    ).lean(); // Use lean for better performance
    
    if (!beneficiary) {
      logger.warn('Beneficiary not found for deletion', { id });
      return false;
    }
    
    logger.info('Beneficiary deleted successfully', { id });
    return true;
  } catch (error) {
    logger.error('Error deleting beneficiary', { id, error: error.message });
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