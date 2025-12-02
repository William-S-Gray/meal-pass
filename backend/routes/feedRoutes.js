const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  scanQRCode, 
  getFedToday, 
  getStats, 
  getUnfed,
  exportFeedLogs
} = require('../controllers/feedController');

const router = express.Router();

// Apply auth middleware based on ENABLE_AUTH setting
const authMiddleware = process.env.ENABLE_AUTH === 'true' ? [protect] : [];

// Routes
router.route('/scan')
  .post(authMiddleware, scanQRCode);

router.route('/today')
  .get(authMiddleware, getFedToday);

router.route('/stats')
  .get(authMiddleware, getStats);

router.route('/unfed')
  .get(authMiddleware, getUnfed);

router.route('/export')
  .get(authMiddleware, exportFeedLogs);

module.exports = router;