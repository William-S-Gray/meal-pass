const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const Beneficiary = require('../models/Beneficiary');
const { generateUniqueId } = require('../utils/idGenerator');
const { generateQRCode } = require('../utils/generateQR');

// Sample beneficiaries data
const sampleBeneficiaries = [
  { name: 'John Doe', gender: 'Male', group: 'Group A' },
  { name: 'Jane Smith', gender: 'Female', group: 'Group B' },
  { name: 'Robert Johnson', gender: 'Male', group: 'Group A' },
  { name: 'Emily Davis', gender: 'Female', group: 'Group C' },
  { name: 'Michael Wilson', gender: 'Male', group: 'Group B' },
  { name: 'Sarah Brown', gender: 'Female', group: 'Group A' },
  { name: 'David Taylor', gender: 'Male', group: 'Group C' },
  { name: 'Lisa Anderson', gender: 'Female', group: 'Group B' },
  { name: 'James Thomas', gender: 'Male', group: 'Group A' },
  { name: 'Jennifer Jackson', gender: 'Female', group: 'Group C' }
];

const seedBeneficiaries = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing beneficiaries
    const deleteResult = await Beneficiary.deleteMany();
    console.log(`Cleared ${deleteResult.deletedCount} existing beneficiaries`);
    
    // Wait a moment to ensure the database is fully cleared
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create sample beneficiaries one by one to ensure unique IDs
    const beneficiaries = [];
    
    for (const beneficiaryData of sampleBeneficiaries) {
      // Generate unique ID
      const uniqueId = await generateUniqueId();
      
      // Generate QR code
      const qrCodeUrl = await generateQRCode(uniqueId);
      
      // Create beneficiary object
      const beneficiary = {
        ...beneficiaryData,
        uniqueId,
        qrCodeUrl
      };
      
      // Save beneficiary immediately to ensure ID uniqueness
      const savedBeneficiary = await Beneficiary.create(beneficiary);
      beneficiaries.push(savedBeneficiary);
      
      // Small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Inserted ${beneficiaries.length} sample beneficiaries`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding beneficiaries:', error);
    process.exit(1);
  }
};

// Run seeder if file is executed directly
if (require.main === module) {
  seedBeneficiaries();
}

module.exports = seedBeneficiaries;