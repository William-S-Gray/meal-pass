const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  scanQRCode, 
  setManualFeedingStatus,
  getFedToday, 
  getFeedHistory,
  getStats, 
  getUnfed,
  exportFeedLogs,
  getFeedRecordsByDateRange
} = require('../controllers/feedController');

const router = express.Router();

// Apply auth middleware based on ENABLE_AUTH setting
const authMiddleware = process.env.ENABLE_AUTH === 'true' ? [protect] : [];

// Routes
router.route('/scan')
  .post(authMiddleware, scanQRCode);

router.route('/manual')
  .post(authMiddleware, setManualFeedingStatus);

router.route('/today')
  .get(authMiddleware, getFedToday);

router.route('/history/:uniqueId')
  .get(authMiddleware, getFeedHistory);

router.route('/stats')
  .get(authMiddleware, getStats);

router.route('/unfed')
  .get(authMiddleware, getUnfed);

router.route('/export')
  .get(authMiddleware, exportFeedLogs);

router.route('/date-range')
  .get(authMiddleware, getFeedRecordsByDateRange);

module.exports = router;