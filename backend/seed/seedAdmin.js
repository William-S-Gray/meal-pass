const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email: 'grayw@gmail.com' });
    
    if (adminExists) {
      console.log('Demo admin user already exists');
      process.exit(0);
    }

    // Create demo admin user
    const admin = new Admin({
      name: 'William Gray',
      email: 'grayw@gmail.com',
      password: 'Meal123'
    });

    await admin.save();
    
    console.log('Demo admin user created successfully');
    console.log('Email: grayw@gmail.com');
    console.log('Password: Meal123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

// Run seeder if file is executed directly
if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;