const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  recordFeeding, 
  removeTodaysRecord,
  getTodaysRecords,
  getRecordsByBeneficiary
} = require('../controllers/feedingController');

const router = express.Router();

// Apply auth middleware based on ENABLE_AUTH setting
const authMiddleware = process.env.ENABLE_AUTH === 'true' ? [protect] : [];

// Routes
router.route('/scan')
  .post(authMiddleware, recordFeeding);

router.route('/record/:uniqueId')
  .delete(authMiddleware, removeTodaysRecord);

// New routes for feeding records and statistics
router.route('/today') // Changed from /records/today to /today
  .get(authMiddleware, getTodaysRecords);

router.route('/beneficiary/:uniqueId')
  .get(authMiddleware, getRecordsByBeneficiary);

module.exports = router;