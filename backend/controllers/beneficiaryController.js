const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Beneficiary = require('../models/Beneficiary');
const FeedLog = require('../models/FeedLog');
const { generateUniqueId } = require('../utils/idGenerator');
const { generateQRCode } = require('../utils/generateQR');
const { importFromCSV } = require('../utils/csvImporter');
const { exportToCSV, exportToJSON } = require('../utils/csvExporter');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const photosDir = path.join(__dirname, '..', 'public', 'photos');
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }
    cb(null, photosDir);
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
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @desc    Create a new beneficiary
 * @route   POST /api/beneficiaries
 * @access  Public (or Private if auth enabled)
 */
const createBeneficiary = async (req, res, next) => {
  try {
    const { name, gender, group, dob, notes } = req.body;
    
    // Generate unique ID
    const uniqueId = await generateUniqueId();
    
    // Generate QR code
    const qrCodeUrl = await generateQRCode(uniqueId);
    
    // Handle photo upload
    let photoUrl = null;
    if (req.file) {
      photoUrl = `/photos/${req.file.filename}`;
    }
    
    // Create beneficiary
    const beneficiary = new Beneficiary({
      name,
      gender,
      group,
      uniqueId,
      qrCodeUrl,
      photoUrl,
      dob: dob ? new Date(dob) : null,
      notes: notes || null
    });
    
    await beneficiary.save();
    
    res.status(201).json({
      success: true,
      data: beneficiary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all beneficiaries
 * @route   GET /api/beneficiaries
 * @access  Public (or Private if auth enabled)
 */
const getBeneficiaries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (req.query.group) {
      filter.group = req.query.group;
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { uniqueId: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const beneficiaries = await Beneficiary.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Beneficiary.countDocuments(filter);
    
    // Get today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get all beneficiary IDs
    const beneficiaryIds = beneficiaries.map(b => b._id);
    
    // Find feed logs for today for these beneficiaries
    const todayFeedLogs = await FeedLog.find({
      beneficiaryId: { $in: beneficiaryIds },
      fedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    // Create a set of beneficiary IDs that were fed today
    const fedTodayIds = new Set(todayFeedLogs.map(log => log.beneficiaryId.toString()));
    
    // Add fedToday property to each beneficiary
    const beneficiariesWithFedStatus = beneficiaries.map(beneficiary => ({
      ...beneficiary.toObject(),
      fedToday: fedTodayIds.has(beneficiary._id.toString())
    }));
    
    res.status(200).json({
      success: true,
      count: beneficiariesWithFedStatus.length,
      data: beneficiariesWithFedStatus,
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
 * @desc    Get single beneficiary
 * @route   GET /api/beneficiaries/:id
 * @access  Public (or Private if auth enabled)
 */
const getBeneficiary = async (req, res, next) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);
    
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: beneficiary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single beneficiary by UID
 * @route   GET /api/beneficiaries/uid/:uid
 * @access  Public (or Private if auth enabled)
 */
const getBeneficiaryByUid = async (req, res, next) => {
  try {
    const beneficiary = await Beneficiary.findOne({ uniqueId: req.params.uid });
    
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: beneficiary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update beneficiary
 * @route   PUT /api/beneficiaries/:id
 * @access  Public (or Private if auth enabled)
 */
const updateBeneficiary = async (req, res, next) => {
  try {
    const { name, gender, group, dob, notes } = req.body;
    
    const beneficiary = await Beneficiary.findById(req.params.id);
    
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    // Handle photo update
    let photoUrl = beneficiary.photoUrl;
    if (req.file) {
      photoUrl = `/photos/${req.file.filename}`;
    }
    
    // Update beneficiary
    beneficiary.name = name || beneficiary.name;
    beneficiary.gender = gender || beneficiary.gender;
    beneficiary.group = group || beneficiary.group;
    beneficiary.photoUrl = photoUrl;
    if (dob !== undefined) beneficiary.dob = dob ? new Date(dob) : null;
    if (notes !== undefined) beneficiary.notes = notes || null;
    
    await beneficiary.save();
    
    res.status(200).json({
      success: true,
      data: beneficiary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete beneficiary
 * @route   DELETE /api/beneficiaries/:id
 * @access  Public (or Private if auth enabled)
 */
const deleteBeneficiary = async (req, res, next) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);
    
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    // Delete QR code file if exists
    if (beneficiary.qrCodeUrl) {
      const qrFilePath = path.join(__dirname, '..', 'public', beneficiary.qrCodeUrl);
      if (fs.existsSync(qrFilePath)) {
        fs.unlinkSync(qrFilePath);
      }
    }
    
    // Delete photo file if exists
    if (beneficiary.photoUrl) {
      const photoFilePath = path.join(__dirname, '..', 'public', beneficiary.photoUrl);
      if (fs.existsSync(photoFilePath)) {
        fs.unlinkSync(photoFilePath);
      }
    }
    
    await beneficiary.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Import beneficiaries from CSV
 * @route   POST /api/beneficiaries/import
 * @access  Public (or Private if auth enabled)
 */
const importBeneficiaries = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a CSV file'
      });
    }
    
    const result = await importFromCSV(req.file.path);
    
    // Delete temporary file
    fs.unlinkSync(req.file.path);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export beneficiaries
 * @route   GET /api/beneficiaries/export
 * @access  Public (or Private if auth enabled)
 */
const exportBeneficiaries = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const beneficiaries = await Beneficiary.find().select('-__v -createdAt -updatedAt');
    
    if (format === 'csv') {
      const fields = ['uniqueId', 'name', 'gender', 'group', 'qrCodeUrl', 'photoUrl'];
      const filename = `beneficiaries-${Date.now()}`;
      const csvPath = await exportToCSV(beneficiaries, fields, filename);
      
      res.status(200).json({
        success: true,
        data: {
          url: csvPath,
          format: 'csv'
        }
      });
    } else if (format === 'json') {
      const filename = `beneficiaries-${Date.now()}`;
      const jsonPath = await exportToJSON(beneficiaries, filename);
      
      res.status(200).json({
        success: true,
        data: {
          url: jsonPath,
          format: 'json'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid format. Supported formats: csv, json'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download QR code for a beneficiary
 * @route   GET /api/beneficiaries/:id/qrcode
 * @access  Public (or Private if auth enabled)
 */
const downloadQRCode = async (req, res, next) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);
    
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    // Construct the full path to the QR code file
    const qrFilePath = path.join(__dirname, '..', 'public', beneficiary.qrCodeUrl);
    
    // Check if file exists
    if (!fs.existsSync(qrFilePath)) {
      return res.status(404).json({
        success: false,
        error: 'QR code file not found'
      });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${beneficiary.uniqueId}-qrcode.png"`);
    
    // Send the file
    res.sendFile(qrFilePath);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBeneficiary,
  getBeneficiaries,
  getBeneficiary,
  getBeneficiaryByUid,
  updateBeneficiary,
  deleteBeneficiary,
  importBeneficiaries,
  exportBeneficiaries,
  downloadQRCode,
  upload
};