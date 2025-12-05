const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Employee = require('./models/Employee');
const FeedingRecord = require('./models/FeedingRecord');

const clearDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear all employees
    const result = await Employee.deleteMany({});
    console.log(`Cleared ${result.deletedCount} employees`);

    // Clear all feeding records
    const feedingResult = await FeedingRecord.deleteMany({});
    console.log(`Cleared ${feedingResult.deletedCount} feeding records`);

    console.log('Database cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  clearDatabase();
}

module.exports = clearDatabase;