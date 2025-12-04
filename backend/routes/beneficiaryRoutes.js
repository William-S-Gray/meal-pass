const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  createBeneficiary, 
  getBeneficiaries, 
  getBeneficiary, 
  getBeneficiaryByUid, // Add this import
  updateBeneficiary, 
  deleteBeneficiary, 
  downloadQRCode,
  upload
} = require('../controllers/beneficiaryController');

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
  .post(authMiddleware, optionalUpload, createBeneficiary)
  .get(authMiddleware, getBeneficiaries);

// Parameterized routes
router.route('/:id')
  .get(authMiddleware, getBeneficiary)
  .put(authMiddleware, optionalUpload, updateBeneficiary)
  .delete(authMiddleware, deleteBeneficiary);

// New route for getting beneficiary by UID
router.route('/uid/:uid')
  .get(authMiddleware, getBeneficiaryByUid);

// QR Code download route
router.route('/:id/qrcode')
  .get(authMiddleware, downloadQRCode);

module.exports = router;