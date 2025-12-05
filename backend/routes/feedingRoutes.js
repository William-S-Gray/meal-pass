const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  recordFeeding, 
  getTodaysRecords, 
  getRecordsByEmployee, 
  removeTodaysRecord
} = require('../controllers/employeeFeedingController'); // Changed to employee feeding controller

const router = express.Router();

// Apply auth middleware based on ENABLE_AUTH setting
const authMiddleware = process.env.ENABLE_AUTH === 'true' ? [protect] : [];

// Routes
router.route('/scan')
  .post(authMiddleware, recordFeeding);

router.route('/today')
  .get(authMiddleware, getTodaysRecords);

router.route('/employee/:uniqueId') // Changed from /beneficiary to /employee
  .get(authMiddleware, getRecordsByEmployee);

router.route('/record/:uniqueId')
  .delete(authMiddleware, removeTodaysRecord);

module.exports = router;