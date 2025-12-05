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
  getQRCodeDataUrl,
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

// QR Code download route
router.route('/:id/qrcode')
  .get(authMiddleware, downloadQRCode);

// QR Code DataURL route
router.route('/:id/qrcode/dataurl')
  .get(authMiddleware, getQRCodeDataUrl);

module.exports = router;