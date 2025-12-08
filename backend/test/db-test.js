const mongoose = require('mongoose');

// Test MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mealpass_user:mealpass_password@localhost:27017/mealpass';

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
    
    // Test a simple operation
    const db = mongoose.connection;
    const collections = await db.db.listCollections().toArray();
    console.log('✅ Database operations working');
    
    await mongoose.connection.close();
    console.log('🔒 Connection closed');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();