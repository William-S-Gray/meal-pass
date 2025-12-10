const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('../models/Employee');
const qrService = require('../services/qrService');
const connectDB = require('../config/db');
const logger = require('../utils/logger');

// Load environment variables
dotenv.config();

/**
 * Script to update existing QR codes to include employee names
 * This script will regenerate QR codes for all employees who have a qrFileName
 * but whose QR code data doesn't include the employee name
 */
const updateExistingQRs = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to database');
    
    // Find all employees with existing QR codes
    const employees = await Employee.find({ 
      qrFileName: { $exists: true, $ne: null },
      active: true
    });
    
    logger.info(`Found ${employees.length} employees with existing QR codes`);
    
    let updatedCount = 0;
    
    // Process each employee
    for (const employee of employees) {
      try {
        logger.info(`Processing employee ${employee.uniqueId}: ${employee.name}`);
        
        // Regenerate QR code with both uniqueId and name
        const qrFileName = await qrService.generateQRCode(employee.uniqueId, employee.name);
        
        // Update employee with new QR filename
        await Employee.updateOne(
          { _id: employee._id },
          { qrFileName: qrFileName }
        );
        
        updatedCount++;
        logger.info(`Updated QR code for employee ${employee.uniqueId}`);
      } catch (error) {
        logger.error(`Failed to update QR code for employee ${employee.uniqueId}:`, error.message);
      }
    }
    
    logger.info(`Successfully updated QR codes for ${updatedCount} employees`);
    
    // Close database connection
    process.exit(0);
  } catch (error) {
    logger.error('Error updating existing QR codes:', error);
    process.exit(1);
  }
};

// Run the script if called directly
if (require.main === module) {
  updateExistingQRs();
}

module.exports = updateExistingQRs;