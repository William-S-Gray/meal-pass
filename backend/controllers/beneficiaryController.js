const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Beneficiary = require('../models/Beneficiary');
const FeedingRecord = require('../models/FeedingRecord');
const beneficiaryService = require('../services/beneficiaryService');
const qrService = require('../services/qrService');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseHelper');
const logger = require('../utils/logger');
const { create, update, query } = require('../validators/beneficiaryValidator');

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
 * @desc    Create new beneficiary
 * @route   POST /api/beneficiaries
 * @access  Private (Admin/Volunteer)
 */
const createBeneficiary = async (req, res, next) => {
  try {
    // Log the incoming request body for debugging
    console.log('Incoming beneficiary data:', req.body);
    
    // Validate request body
    const { error, value } = create.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details);
      return sendValidationError(res, error);
    }

    const result = await beneficiaryService.create(value);
    sendSuccess(res, 201, result, 'Beneficiary created successfully');
  } catch (error) {
    logger.error('Error in createBeneficiary:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get all beneficiaries
 * @route   GET /api/beneficiaries
 * @access  Private (Admin/Volunteer)
 */
const getBeneficiaries = async (req, res, next) => {
  try {
    // Validate query parameters
    const { error, value } = query.validate(req.query);
    if (error) {
      return sendValidationError(res, error);
    }

    const result = await beneficiaryService.getAll(value, value.page, value.limit);
    sendSuccess(res, 200, result.data, null, result.pagination);
  } catch (error) {
    logger.error('Error in getBeneficiaries:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get single beneficiary
 * @route   GET /api/beneficiaries/:id
 * @access  Private (Admin/Volunteer)
 */
const getBeneficiary = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const beneficiary = await beneficiaryService.getById(id);
    if (!beneficiary) {
      return sendError(res, 404, 'Beneficiary not found');
    }
    
    sendSuccess(res, 200, beneficiary);
  } catch (error) {
    logger.error('Error in getBeneficiary:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Get beneficiary by unique ID
 * @route   GET /api/beneficiaries/uid/:uid
 * @access  Public
 */
const getBeneficiaryByUid = async (req, res, next) => {
  try {
    const { uid } = req.params;
    
    const beneficiary = await beneficiaryService.getByUniqueId(uid);
    if (!beneficiary) {
      return sendError(res, 404, 'Beneficiary not found');
    }
    
    sendSuccess(res, 200, beneficiary);
  } catch (error) {
    logger.error('Error in getBeneficiaryByUid:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Update beneficiary
 * @route   PUT /api/beneficiaries/:id
 * @access  Private (Admin/Volunteer)
 */
const updateBeneficiary = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const { error, value } = update.validate(req.body);
    if (error) {
      return sendValidationError(res, error);
    }

    const beneficiary = await beneficiaryService.update(id, value);
    if (!beneficiary) {
      return sendError(res, 404, 'Beneficiary not found');
    }
    
    sendSuccess(res, 200, beneficiary, 'Beneficiary updated successfully');
  } catch (error) {
    logger.error('Error in updateBeneficiary:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Delete beneficiary
 * @route   DELETE /api/beneficiaries/:id
 * @access  Private (Admin)
 */
const deleteBeneficiary = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deleted = await beneficiaryService.remove(id);
    if (!deleted) {
      return sendError(res, 404, 'Beneficiary not found');
    }
    
    sendSuccess(res, 200, null, 'Beneficiary deleted successfully');
  } catch (error) {
    logger.error('Error in deleteBeneficiary:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * @desc    Download QR code for beneficiary
 * @route   GET /api/beneficiaries/:id/qrcode
 * @access  Private
 */
const downloadQRCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const beneficiary = await beneficiaryService.getById(id);
    if (!beneficiary) {
      return sendError(res, 404, 'Beneficiary not found');
    }
    
    if (!beneficiary.qrCodeUrl) {
      return sendError(res, 404, 'QR code not found');
    }
    
    const fullPath = `${req.protocol}://${req.get('host')}${beneficiary.qrCodeUrl}`;
    res.redirect(fullPath);
  } catch (error) {
    logger.error('Error in downloadQRCode:', error);
    sendError(res, 500, error.message);
  }
};

module.exports = {
  createBeneficiary,
  getBeneficiaries,
  getBeneficiary,
  getBeneficiaryByUid,
  updateBeneficiary,
  deleteBeneficiary,
  downloadQRCode,
  upload
};