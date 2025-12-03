const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  scanQRCode, 
  removeFeedingRecord,
  getFedToday, // Added import
  getFeedingRecordsForBeneficiary,
  getFeedingStats // Added import
} = require('../controllers/feedingController');

const router = express.Router();

// Apply auth middleware based on ENABLE_AUTH setting
const authMiddleware = process.env.ENABLE_AUTH === 'true' ? [protect] : [];

// Routes
router.route('/scan')
  .post(authMiddleware, scanQRCode);

router.route('/record/:uniqueId')
  .delete(authMiddleware, removeFeedingRecord);

// New routes for feeding records and statistics
router.route('/today') // Changed from /records/today to /today
  .get(authMiddleware, getFedToday);

router.route('/beneficiary/:uniqueId')
  .get(authMiddleware, getFeedingRecordsForBeneficiary);

router.route('/stats') // Added route for statistics
  .get(authMiddleware, getFeedingStats);

module.exports = router;