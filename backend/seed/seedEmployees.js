const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const Employee = require('../models/Employee');
const { generateUniqueId } = require('../utils/idGenerator');
const { generateQRCode } = require('../utils/generateQR');

// Sample employees data
const sampleEmployees = [
  { name: 'John Doe', gender: 'Male', department: 'Housekeeping' },
  { name: 'Jane Smith', gender: 'Female', department: 'Front Desk' },
  { name: 'Robert Johnson', gender: 'Male', department: 'Maintenance' },
  { name: 'Emily Davis', gender: 'Female', department: 'Housekeeping' },
  { name: 'Michael Wilson', gender: 'Male', department: 'Security' },
  { name: 'Sarah Brown', gender: 'Female', department: 'Front Desk' },
  { name: 'David Taylor', gender: 'Male', department: 'Maintenance' },
  { name: 'Lisa Anderson', gender: 'Female', department: 'Housekeeping' },
  { name: 'James Thomas', gender: 'Male', department: 'Security' },
  { name: 'Jennifer Jackson', gender: 'Female', department: 'Front Desk' }
];

const seedEmployees = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing employees
    const deleteResult = await Employee.deleteMany();
    console.log(`Cleared ${deleteResult.deletedCount} existing employees`);
    
    // Wait a moment to ensure the database is fully cleared
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create sample employees one by one to ensure unique IDs
    const employees = [];
    
    for (const employeeData of sampleEmployees) {
      // Generate unique ID
      const uniqueId = await generateUniqueId();
      
      // Generate QR code
      const qrCodeUrl = await generateQRCode(uniqueId);
      
      // Create employee object
      const employee = {
        ...employeeData,
        uniqueId,
        qrCodeUrl,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      };
      
      // Save employee immediately to ensure ID uniqueness
      const savedEmployee = await Employee.create(employee);
      employees.push(savedEmployee);
      
      // Small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Inserted ${employees.length} sample employees`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding employees:', error);
    process.exit(1);
  }
};

// Run seeder if file is executed directly
if (require.main === module) {
  seedEmployees();
}

module.exports = seedEmployees;