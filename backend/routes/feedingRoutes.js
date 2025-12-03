const express = require('express');
const { scanQRCode, getTodayFeedingRecords } = require('../controllers/feedingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Routes
router.route('/scan')
  .post(scanQRCode);

router.route('/today')
  .get(getTodayFeedingRecords);

module.exports = router;