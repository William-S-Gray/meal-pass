const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Beneficiary = require('../models/Beneficiary');
const FeedingRecord = require('../models/FeedingRecord');
const logger = require('../utils/logger');
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
    const { name, gender, age } = req.body;
    
    logger.info(`Creating new beneficiary: ${name}`);
    
    // Generate unique ID
    const uniqueId = await generateUniqueId();
    
    // Generate QR code
    const qrCodeUrl = await generateQRCode(uniqueId);
    
    // Handle photo upload
    let photo = null;
    if (req.file) {
      photo = `/photos/${req.file.filename}`;
    }
    
    // Create beneficiary
    const beneficiary = new Beneficiary({
      name,
      gender,
      age: age ? parseInt(age) : undefined,
      uniqueId,
      qrCodeUrl,
      photo
    });
    
    await beneficiary.save();
    
    logger.info(`Successfully created beneficiary with ID: ${uniqueId}`);
    
    res.status(201).json({
      success: true,
      data: beneficiary
    });
  } catch (error) {
    logger.error(`Error creating beneficiary: ${error.message}`);
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
    
    logger.info(`Fetching beneficiaries - Page: ${page}, Limit: ${limit}`);
    
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
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Get all beneficiary unique IDs
    const beneficiaryUniqueIds = beneficiaries.map(b => b.uniqueId);
    
    // Find feeding records for today for these beneficiaries
    const todayFeedingRecords = await FeedingRecord.find({
      uniqueId: { $in: beneficiaryUniqueIds },
      date: dateString
    });
    
    // Create a set of beneficiary unique IDs that were fed today
    const fedTodayIds = new Set(todayFeedingRecords.map(record => record.uniqueId));
    
    // Add fedToday property to each beneficiary
    const beneficiariesWithFedStatus = beneficiaries.map(beneficiary => ({
      ...beneficiary.toObject(),
      fedToday: fedTodayIds.has(beneficiary.uniqueId)
    }));
    
    logger.info(`Successfully fetched ${beneficiariesWithFedStatus.length} beneficiaries`);
    
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
    logger.error(`Error fetching beneficiaries: ${error.message}`);
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
    
    // Check if beneficiary is active
    if (!beneficiary.active) {
      return res.status(400).json({
        success: false,
        error: 'Beneficiary is inactive'
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
    
    // Check if beneficiary is active
    if (!beneficiary.active) {
      return res.status(400).json({
        success: false,
        error: 'Beneficiary is inactive'
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
    const { name, gender, age } = req.body;
    
    const beneficiary = await Beneficiary.findById(req.params.id);
    
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    // Check if beneficiary is active
    if (!beneficiary.active) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update inactive beneficiary'
      });
    }
    
    // Handle photo update
    let photo = beneficiary.photo;
    if (req.file) {
      photo = `/photos/${req.file.filename}`;
    }
    
    // Update beneficiary
    if (name !== undefined) beneficiary.name = name;
    if (gender !== undefined) beneficiary.gender = gender;
    if (age !== undefined) beneficiary.age = age ? parseInt(age) : undefined;
    beneficiary.photo = photo;
    
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
    logger.info(`Deleting beneficiary with ID: ${req.params.id}`);
    
    const beneficiary = await Beneficiary.findById(req.params.id);
    
    if (!beneficiary) {
      logger.warn(`Beneficiary not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    // Check if already inactive
    if (!beneficiary.active) {
      logger.warn(`Beneficiary already inactive with ID: ${req.params.id}`);
      return res.status(400).json({
        success: false,
        error: 'Beneficiary is already inactive'
      });
    }
    
    // Set beneficiary as inactive instead of removing
    beneficiary.active = false;
    await beneficiary.save();
    
    logger.info(`Successfully deactivated beneficiary with ID: ${req.params.id}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Error deleting beneficiary with ID ${req.params.id}: ${error.message}`);
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
      const fields = ['uniqueId', 'name', 'gender', 'age', 'qrCodeUrl', 'photo'];
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

/**
 * @desc    Generate bulk print cards as PDF
 * @route   POST /api/beneficiaries/print-cards
 * @access  Public (or Private if auth enabled)
 */
const printBulkCards = async (req, res, next) => {
  try {
    logger.info('printBulkCards called with:', req.body);
    const { beneficiaryIds } = req.body;
    
    if (!beneficiaryIds || !Array.isArray(beneficiaryIds) || beneficiaryIds.length === 0) {
      logger.warn('Invalid beneficiaryIds provided:', beneficiaryIds);
      return res.status(400).json({
        success: false,
        error: 'beneficiaryIds array is required and cannot be empty'
      });
    }
    
    // Limit to 40 beneficiaries per request
    if (beneficiaryIds.length > 40) {
      logger.warn('Too many beneficiaries requested:', beneficiaryIds.length);
      return res.status(400).json({
        success: false,
        error: 'Cannot print more than 40 cards at once'
      });
    }
    
    // Fetch beneficiaries
    logger.info('Fetching beneficiaries with IDs:', beneficiaryIds);
    const beneficiaries = await Beneficiary.find({
      _id: { $in: beneficiaryIds },
      active: true
    });
    
    logger.info('Found beneficiaries:', beneficiaries.length);
    
    if (beneficiaries.length === 0) {
      logger.warn('No active beneficiaries found for the provided IDs');
      return res.status(404).json({
        success: false,
        error: 'No active beneficiaries found for the provided IDs'
      });
    }
    
    // Generate HTML for the card sheet
    const htmlContent = generateCardSheetHTML(beneficiaries);
    
    // Log the HTML content size for debugging
    logger.info('Generated HTML content size:', htmlContent.length);
    
    // Save HTML content to a file for debugging
    const fs = require('fs');
    const path = require('path');
    const debugDir = path.join(__dirname, '..', 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir);
    }
    const htmlFilePath = path.join(debugDir, `bulk_cards_${Date.now()}.html`);
    fs.writeFileSync(htmlFilePath, htmlContent);
    logger.info('Saved HTML content to:', htmlFilePath);
    
    // Convert HTML to PDF using Puppeteer
    let pdfBuffer;
    try {
      pdfBuffer = await convertHtmlToPdf(htmlContent);
    } catch (pdfError) {
      logger.error('Error converting HTML to PDF:', pdfError);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate PDF: ' + pdfError.message
      });
    }
    
    // Log the PDF buffer size for debugging
    logger.info('Generated PDF buffer size:', pdfBuffer.length);
    
    // Save PDF to a file for debugging
    const pdfFilePath = path.join(debugDir, `bulk_cards_${Date.now()}.pdf`);
    fs.writeFileSync(pdfFilePath, pdfBuffer);
    logger.info('Saved PDF to:', pdfFilePath);
    
    // Validate that we have a valid PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      logger.error('Generated PDF buffer is empty or invalid');
      return res.status(500).json({
        success: false,
        error: 'Generated PDF is empty or invalid'
      });
    }
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="beneficiary-cards-${Date.now()}.pdf"`);
    
    // Send the PDF
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error in printBulkCards:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
};

/**
 * @desc    Generate single card print template as PDF
 * @route   GET /api/beneficiaries/:id/print-card
 * @access  Public (or Private if auth enabled)
 */
const printSingleCard = async (req, res, next) => {
  try {
    logger.info('printSingleCard called with ID:', req.params.id);
    
    const beneficiary = await Beneficiary.findById(req.params.id);
    
    if (!beneficiary) {
      logger.warn('Beneficiary not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found'
      });
    }
    
    if (!beneficiary.active) {
      logger.warn('Cannot print card for inactive beneficiary:', req.params.id);
      return res.status(400).json({
        success: false,
        error: 'Cannot print card for inactive beneficiary'
      });
    }
    
    // Generate HTML for the single card
    const htmlContent = generateSingleCardHTML(beneficiary);
    
    // Log the HTML content size for debugging
    logger.info('Generated HTML content size:', htmlContent.length);
    
    // Save HTML content to a file for debugging
    const fs = require('fs');
    const path = require('path');
    const debugDir = path.join(__dirname, '..', 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir);
    }
    const htmlFilePath = path.join(debugDir, `single_card_${beneficiary.uniqueId}_${Date.now()}.html`);
    fs.writeFileSync(htmlFilePath, htmlContent);
    logger.info('Saved HTML content to:', htmlFilePath);
    
    // Convert HTML to PDF using Puppeteer
    let pdfBuffer;
    try {
      pdfBuffer = await convertHtmlToPdf(htmlContent);
    } catch (pdfError) {
      logger.error('Error converting HTML to PDF:', pdfError);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate PDF: ' + pdfError.message
      });
    }
    
    // Log the PDF buffer size for debugging
    logger.info('Generated PDF buffer size:', pdfBuffer.length);
    
    // Save PDF to a file for debugging
    const pdfFilePath = path.join(debugDir, `single_card_${beneficiary.uniqueId}_${Date.now()}.pdf`);
    fs.writeFileSync(pdfFilePath, pdfBuffer);
    logger.info('Saved PDF to:', pdfFilePath);
    
    // Validate that we have a valid PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      logger.error('Generated PDF buffer is empty or invalid');
      return res.status(500).json({
        success: false,
        error: 'Generated PDF is empty or invalid'
      });
    }
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${beneficiary.uniqueId}-card.pdf"`);
    
    // Send the PDF
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error in printSingleCard:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
};

/**
 * @desc    Generate HTML for card sheet
 * @param   {Array} beneficiaries - Array of beneficiary objects
 * @returns {String} HTML content for card sheet
 */
const generateCardSheetHTML = (beneficiaries) => {
  logger.info(`Generating card sheet HTML for ${beneficiaries.length} beneficiaries`);
  
  // Create card HTML for each beneficiary
  const cardsHtml = beneficiaries.map(beneficiary => {
    logger.info(`Processing beneficiary: ${beneficiary.name} (${beneficiary.uniqueId})`);
    logger.info(`QR Code URL: ${beneficiary.qrCodeUrl}`);
    logger.info(`Photo URL: ${beneficiary.photo}`);
    
    // Ensure URLs are properly formatted
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const qrCodeUrl = beneficiary.qrCodeUrl ? `${baseUrl}${beneficiary.qrCodeUrl}` : '';
    const photoUrl = beneficiary.photo ? `${baseUrl}${beneficiary.photo}` : '';
    
    return `
    <div class="beneficiary-card">
      <div class="card-header">
        <div class="logo-placeholder"></div>
        <div class="organization-name">Meal Pass Program 2025</div>
      </div>
      
      <div class="beneficiary-info">
        <div class="beneficiary-name">${escapeHtml(beneficiary.name || 'Unknown')}</div>
        <div class="beneficiary-id">${escapeHtml(beneficiary.uniqueId || 'Unknown ID')}</div>
      </div>
      
      <div class="qr-container">
        ${qrCodeUrl ? 
          `<img src="${qrCodeUrl}" alt="QR Code" class="qr-code" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiPkNSQyBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+';">` :
          `<div class="qr-placeholder">QR Code Not Available</div>`
        }
      </div>
      
      ${photoUrl ? 
        `<div class="photo-container">
          <img src="${photoUrl}" alt="Photo" class="beneficiary-photo">
        </div>` : 
        ''
      }
    </div>
    `;
  }).join('\n');
  
  // Create the full HTML document
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meal Pass Beneficiary Cards</title>
  <style>
    /* Print Styles */
    @media print {
      @page {
        size: A4;
        margin: 8mm;
      }
      
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        font-size: 12pt;
        line-height: 1.3;
        color: #000;
        background: #fff;
      }
      
      .print-header {
        text-align: center;
        margin-bottom: 5mm;
        page-break-after: avoid;
      }
      
      .print-header h1 {
        margin: 0;
        font-size: 18pt;
        font-weight: bold;
      }
      
      .logo-placeholder {
        width: 40px;
        height: 40px;
        background-color: #ddd;
        border: 1px dashed #999;
        float: left;
        margin-right: 10px;
      }
      
      .card-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2.5mm;
        page-break-inside: avoid;
      }
      
      .beneficiary-card {
        width: 85mm;
        height: 53mm;
        border: 1pt solid #333;
        padding: 2mm;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        page-break-inside: avoid;
        background: #fff;
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      
      .organization-name {
        font-size: 10pt;
        font-weight: bold;
        text-align: right;
      }
      
      .beneficiary-info {
        text-align: center;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      
      .beneficiary-name {
        font-size: 13pt;
        font-weight: bold;
        margin: 1.5mm 0;
        word-wrap: break-word;
        line-height: 1.2;
      }
      
      .beneficiary-id {
        font-size: 10pt;
        font-family: 'Courier New', monospace;
        margin: 1mm 0;
        color: #666;
      }
      
      .qr-container {
        text-align: center;
        margin: 2mm 0;
      }
      
      .qr-code {
        width: 22mm;
        height: 22mm;
        border: 1pt solid #666;
        padding: 1mm;
        background: #fff;
      }
      
      .qr-placeholder {
        width: 22mm;
        height: 22mm;
        border: 1pt solid #666;
        padding: 1mm;
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 6pt;
        color: #666;
        margin: 0 auto;
      }
      
      .photo-container {
        text-align: center;
        margin-top: 2mm;
      }
      
      .beneficiary-photo {
        max-width: 18mm;
        max-height: 18mm;
        border: 1pt solid #666;
        background: #f0f0f0;
      }
      
      .print-footer {
        text-align: center;
        margin-top: 10mm;
        font-size: 10pt;
        background: white;
        padding: 5mm;
        border-radius: 2mm;
      }
    }
  </style>
</head>
<body>
  <div class="print-header">
    <div class="logo-placeholder"></div>
    <h1>Meal Pass Program 2025</h1>
  </div>
  
  <div class="card-grid" id="cardGrid">
    ${cardsHtml}
  </div>
  
  <div class="print-footer">
    <p>Generated by Meal Pass System</p>
  </div>
</body>
</html>`;
  
  logger.info('Generated card sheet HTML successfully');
  return htmlContent;
};

/**
 * @desc    Generate HTML for single card
 * @param   {Object} beneficiary - Beneficiary object
 * @returns {String} HTML content for single card
 */
const generateSingleCardHTML = (beneficiary) => {
  logger.info(`Generating single card HTML for beneficiary: ${beneficiary.name} (${beneficiary.uniqueId})`);
  logger.info(`QR Code URL: ${beneficiary.qrCodeUrl}`);
  logger.info(`Photo URL: ${beneficiary.photo}`);
  
  // Ensure URLs are properly formatted
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const qrCodeUrl = beneficiary.qrCodeUrl ? `${baseUrl}${beneficiary.qrCodeUrl}` : '';
  const photoUrl = beneficiary.photo ? `${baseUrl}${beneficiary.photo}` : '';
  
  // Create the full HTML document for single card
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(beneficiary.name || 'Unknown')} - Meal Pass Card</title>
  <style>
    /* Print Styles */
    @media print {
      @page {
        size: A4;
        margin: 20mm;
      }
      
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #000;
        background: #fff;
      }
      
      .single-card-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      
      .single-card {
        width: 85mm;
        border: 2pt solid #333;
        padding: 5mm;
        box-sizing: border-box;
        background: #fff;
        text-align: center;
      }
      
      .card-header {
        margin-bottom: 5mm;
        padding-bottom: 3mm;
        border-bottom: 1pt solid #ccc;
      }
      
      .logo-placeholder {
        width: 50px;
        height: 50px;
        background-color: #ddd;
        border: 1px dashed #999;
        margin: 0 auto 3mm;
      }
      
      .organization-name {
        font-size: 14pt;
        font-weight: bold;
      }
      
      .beneficiary-info {
        margin: 5mm 0;
      }
      
      .beneficiary-name {
        font-size: 15pt;
        font-weight: bold;
        margin: 2mm 0;
        line-height: 1.2;
      }
      
      .beneficiary-id {
        font-size: 11pt;
        font-family: 'Courier New', monospace;
        margin: 2mm 0;
        color: #666;
      }
      
      .qr-container {
        margin: 5mm 0;
        text-align: center;
      }
      
      .qr-code {
        width: 40mm;
        height: 40mm;
        border: 1pt solid #666;
        padding: 2mm;
        background: #fff;
        margin: 0 auto;
      }
      
      .qr-placeholder {
        width: 40mm;
        height: 40mm;
        border: 1pt solid #666;
        padding: 2mm;
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8pt;
        color: #666;
        margin: 0 auto;
      }
      
      ${photoUrl ? `.photo-container {
        margin: 5mm 0;
        text-align: center;
      }
      
      .beneficiary-photo {
        max-width: 30mm;
        max-height: 30mm;
        border: 1pt solid #666;
        background: #f0f0f0;
        margin: 0 auto;
      }` : ''}
      
      .print-footer {
        margin-top: 5mm;
        padding-top: 3mm;
        border-top: 1pt solid #ccc;
        font-size: 10pt;
      }
      
      .generated-date {
        font-size: 9pt;
        color: #666;
      }
    }
  </style>
</head>
<body>
  <div class="single-card-container">
    <div class="single-card">
      <div class="card-header">
        <div class="logo-placeholder"></div>
        <div class="organization-name">Meal Pass Program 2025</div>
      </div>
      
      <div class="beneficiary-info">
        <div class="beneficiary-name">${escapeHtml(beneficiary.name || 'Unknown')}</div>
        <div class="beneficiary-id">ID: ${escapeHtml(beneficiary.uniqueId || 'Unknown ID')}</div>
      </div>
      
      <div class="qr-container">
        ${qrCodeUrl ? 
          `<img src="${qrCodeUrl}" alt="QR Code" class="qr-code" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiPkNSQyBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+';">` :
          `<div class="qr-placeholder">QR Code Not Available</div>`
        }
      </div>
      
      ${photoUrl ? `<div class="photo-container">
        <img src="${photoUrl}" alt="Photo" class="beneficiary-photo">
      </div>` : ''}
      
      <div class="print-footer">
        <p>Please present this card when collecting meals</p>
        <p class="generated-date">Generated: ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  
  logger.info('Generated single card HTML successfully');
  return htmlContent;
};

/**
 * @desc    Convert HTML to PDF using Puppeteer
 * @param   {String} html - HTML content to convert
 * @returns {Buffer} PDF buffer
 */
const convertHtmlToPdf = async (html) => {
  const puppeteer = require('puppeteer');
  const logger = require('../utils/logger');
  
  logger.info('Starting PDF conversion process');
  
  // First try with Puppeteer
  try {
    logger.info('Attempting PDF generation with Puppeteer');
    
    let browser;
    try {
      // Launch browser with more permissive options for compatibility
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      });
      
      logger.info('Browser launched successfully');
      
      // Create a new page
      const page = await browser.newPage();
      
      logger.info('Page created successfully');
      
      // Set content
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 // Increase timeout to 30 seconds
      });
      
      logger.info('HTML content set successfully');
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '8mm',
          right: '8mm',
          bottom: '8mm',
          left: '8mm'
        }
      });
      
      logger.info('PDF generated successfully with Puppeteer');
      
      // Close browser
      await browser.close();
      logger.info('Browser closed successfully');
      
      return pdfBuffer;
    } finally {
      // Ensure browser is closed even if there's an error
      if (browser) {
        await browser.close();
        logger.info('Browser closed in finally block');
      }
    }
  } catch (puppeteerError) {
    logger.error('Puppeteer failed, trying fallback method:', puppeteerError);
    
    // Fallback to simple PDF generation
    try {
      const PDFDocument = require('pdfkit');
      const fs = require('fs');
      const path = require('path');
      
      logger.info('Using PDFKit as fallback method');
      
      // Create a document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      
      // Collect PDF data
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {});
      
      // Add simple text content as fallback
      doc.fontSize(16).text('Meal Pass Beneficiary Cards', 100, 100);
      doc.fontSize(12).text('PDF generation with Puppeteer failed. This is a fallback PDF.', 100, 150);
      doc.fontSize(10).text('Original HTML content was: ' + html.substring(0, 500) + '...', 100, 200);
      
      // Finalize PDF file
      doc.end();
      
      // Wait for the PDF to be generated
      const pdfBuffer = await new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfData = Buffer.concat(chunks);
          resolve(pdfData);
        });
        doc.on('error', reject);
      });
      
      logger.info('Fallback PDF generated successfully');
      return pdfBuffer;
    } catch (fallbackError) {
      logger.error('Fallback PDF generation also failed:', fallbackError);
      throw new Error('Failed to generate PDF with both Puppeteer and fallback method: ' + fallbackError.message);
    }
  }
};

/**
 * @desc    Escape HTML characters to prevent XSS
 * @param   {String} text - Text to escape
 * @returns {String} Escaped text
 */
const escapeHtml = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
  printBulkCards,
  printSingleCard,
  upload
};