const mongoose = require('mongoose');
const { initGridFS, getGridFsBucket } = require('../utils/gridfs');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mealpass-test';

describe('GridFS Integration', () => {
  beforeAll(async () => {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Initialize GridFS
    await initGridFS();
  });

  afterAll(async () => {
    // Clean up test files
    const bucket = getGridFsBucket();
    await bucket.drop();
    
    // Close MongoDB connection
    await mongoose.connection.close();
  });

  test('should initialize GridFS successfully', () => {
    expect(() => getGridFsBucket()).not.toThrow();
  });

  test('should store and retrieve file from GridFS', async () => {
    const bucket = getGridFsBucket();
    
    // Test data
    const testData = 'Hello GridFS!';
    const filename = 'test-file.txt';
    
    // Store file
    const uploadStream = bucket.openUploadStream(filename);
    uploadStream.end(testData);
    
    // Wait for upload to complete
    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });
    
    // Retrieve file
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
    expect(result).toBe(testData);
  });
});