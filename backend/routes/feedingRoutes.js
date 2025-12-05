const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  recordFeeding, 
  getTodaysRecords, 
  getRecordsByEmployee, 
  removeTodaysRecord,
  getFeedingStats
} = require('../controllers/employeeFeedingController'); // Changed to employee feeding controller

const router = express.Router();

// Apply auth middleware based on ENABLE_AUTH setting
const authMiddleware = process.env.ENABLE_AUTH === 'true' ? [protect] : [];

// Routes
router.route('/scan')
  .post(authMiddleware, recordFeeding);

router.route('/today')
  .get(authMiddleware, getTodaysRecords);

router.route('/employee/:uniqueId') // Get feeding records for an employee
  .get(authMiddleware, getRecordsByEmployee);

router.route('/record/:uniqueId')
  .delete(authMiddleware, removeTodaysRecord);

router.route('/stats')
  .get(authMiddleware, getFeedingStats);

module.exports = router;