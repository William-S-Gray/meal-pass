const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  createBeneficiary, 
  getBeneficiaries, 
  getBeneficiary, 
  updateBeneficiary, 
  deleteBeneficiary, 
  importBeneficiaries, 
  exportBeneficiaries,
  upload
} = require('../controllers/beneficiaryController');

const router = express.Router();

// Apply auth middleware based on ENABLE_AUTH setting
const authMiddleware = process.env.ENABLE_AUTH === 'true' ? [protect] : [];

// Routes
router.route('/')
  .post(authMiddleware, upload.single('photo'), createBeneficiary)
  .get(authMiddleware, getBeneficiaries);

// Specific routes must be defined before parameterized routes
router.route('/import')
  .post(authMiddleware, upload.single('csvFile'), importBeneficiaries);

router.route('/export')
  .get(authMiddleware, exportBeneficiaries);

// Parameterized routes
router.route('/:id')
  .get(authMiddleware, getBeneficiary)
  .put(authMiddleware, upload.single('photo'), updateBeneficiary)
  .delete(authMiddleware, deleteBeneficiary);

module.exports = router;