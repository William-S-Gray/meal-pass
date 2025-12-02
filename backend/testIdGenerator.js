const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const { generateUniqueId } = require('./utils/idGenerator');

const testIdGenerator = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Test the generateUniqueId function
    for (let i = 0; i < 5; i++) {
      const id = await generateUniqueId();
      console.log(`Generated ID ${i + 1}:`, id);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing ID generator:', error);
    process.exit(1);
  }
};

testIdGenerator();