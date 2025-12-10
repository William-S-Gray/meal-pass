const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  createEmployee, 
  getEmployees, 
  getEmployee, 
  getEmployeeByUid,
  updateEmployee, 
  deleteEmployee, 
  downloadQRCode,
  downloadQRCodeByUid,
  getQRCodeDataUrl,
  generateDynamicQRCode,
  printBulkCards,
  printSingleCard,
  qrLandingPage,
  upload
} = require('../controllers/employeeController');

const router = express.Router();

// Apply auth middleware based on ENABLE_AUTH setting
const authMiddleware = process.env.ENABLE_AUTH === 'true' ? [protect] : [];

// Custom middleware to handle optional file upload
const optionalUpload = (req, res, next) => {
  // Only process file upload if a file is actually being sent
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return upload.single('photo')(req, res, next);
  }
  next();
};

// Routes
router.route('/')
  .post(authMiddleware, optionalUpload, createEmployee)
  .get(authMiddleware, getEmployees);

// Parameterized routes
router.route('/:id')
  .get(authMiddleware, getEmployee)
  .put(authMiddleware, optionalUpload, updateEmployee)
  .delete(authMiddleware, deleteEmployee);

// New route for getting employee by UID
router.route('/uid/:uid')
  .get(authMiddleware, getEmployeeByUid);

// QR Code download route by ID
router.route('/:id/qrcode')
  .get(authMiddleware, downloadQRCode);

// QR Code download route by UID
router.route('/uid/:uid/qrcode')
  .get(authMiddleware, downloadQRCodeByUid);

// QR Code DataURL route
router.route('/:id/qrcode/dataurl')
  .get(authMiddleware, getQRCodeDataUrl);

// Dynamic QR Code generation route (public - no auth required)
router.route('/uid/:uid/qrcode/dynamic')
  .get(generateDynamicQRCode);

// Print card routes
router.route('/print-cards')
  .post(authMiddleware, printBulkCards);

router.route('/:id/print-card')
  .get(authMiddleware, printSingleCard);

// QR landing page route (public - no auth required)
router.route('/qr/:uid')
  .get(qrLandingPage);

module.exports = router;