const mongoose = require('mongoose');
const { initGridFS, getGridFsBucket } = require('../utils/gridfs');

// Test MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mealpass-test';

async function testGridFS() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Initializing GridFS...');
    await initGridFS();
    
    console.log('Getting GridFS bucket...');
    const bucket = getGridFsBucket();
    
    if (bucket) {
      console.log('✓ GridFS is properly configured');
      
      // Test creating a file
      console.log('Testing file creation...');
      const uploadStream = bucket.openUploadStream('test-file.txt', {
        metadata: {
          test: true,
          createdAt: new Date()
        }
      });
      
      const testData = 'This is a test file for GridFS verification';
      uploadStream.end(Buffer.from(testData), async (error) => {
        if (error) {
          console.error('✗ Error creating test file:', error);
        } else {
          console.log('✓ Successfully created test file in GridFS');
          
          // Clean up test file
          try {
            await bucket.delete(uploadStream.id);
            console.log('✓ Successfully cleaned up test file');
          } catch (cleanupError) {
            console.warn('Warning: Could not clean up test file:', cleanupError.message);
          }
        }
        
        console.log('GridFS verification complete');
        process.exit(0);
      });
    } else {
      console.error('✗ GridFS bucket is not available');
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ GridFS test failed:', error.message);
    process.exit(1);
  }
}

testGridFS();