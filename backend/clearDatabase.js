const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const Beneficiary = require('./models/Beneficiary');

const clearDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Clear all beneficiaries
    const result = await Beneficiary.deleteMany({});
    console.log(`Cleared ${result.deletedCount} beneficiaries`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();