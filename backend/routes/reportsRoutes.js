const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  getDailyReport,
  getDateRangeReport,
  getBeneficiaryReport,
  getReportStatistics
} = require('../controllers/reportsController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Routes
router.route('/today')
  .get(getDailyReport);

router.route('/date-range')
  .get(getDateRangeReport);

router.route('/beneficiary/:uniqueId')
  .get(getBeneficiaryReport);

router.route('/statistics')
  .get(getReportStatistics);

module.exports = router;