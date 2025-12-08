const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { initGridFS, getGridFsBucket } = require('../utils/gridfs');

// Load environment variables
dotenv.config();

async function verifyGridFS() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully');
    
    // Initialize GridFS
    console.log('Initializing GridFS...');
    await initGridFS();
    console.log('GridFS initialized successfully');
    
    // Test storing and retrieving a file
    console.log('Testing GridFS operations...');
    const bucket = getGridFsBucket();
    
    // Test data
    const testData = 'Hello GridFS!';
    const filename = 'test-file.txt';
    
    // Store file
    console.log('Storing test file...');
    const uploadStream = bucket.openUploadStream(filename);
    uploadStream.end(testData);
    
    // Wait for upload to complete
    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });
    
    console.log('File stored successfully');
    
    // Retrieve file
    console.log('Retrieving test file...');
    const downloadStream = bucket.openDownloadStreamByName(filename);
    const chunks = [];
    
    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    const result = await new Promise((resolve, reject) => {
      downloadStream.on('end', () => {
        const data = Buffer.concat(chunks).toString();
        resolve(data);
      });
      downloadStream.on('error', reject);
    });
    
    // Verify data
    if (result === testData) {
      console.log('✅ GridFS test passed: File stored and retrieved successfully');
    } else {
      console.log('❌ GridFS test failed: Retrieved data does not match');
    }
    
    // Clean up test file
    console.log('Cleaning up test file...');
    await bucket.delete(uploadStream.id);
    console.log('Test file cleaned up');
    
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyGridFS();