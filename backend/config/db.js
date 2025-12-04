const mongoose = require('mongoose');
const colors = require('colors');

const connectDB = async () => {
  try {
    // Configure mongoose connection options for better performance
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Connection pool settings for better performance
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

module.exports = connectDB;