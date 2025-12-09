const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { GridFsStorage } = require('multer-gridfs-storage');
const logger = require('./logger');

let gfs;
let gridFsBucket;

// Initialize GridFS
const initGridFS = async () => {
  try {
    // Wait for mongoose connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise();
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection not established');
    }

    // Create GridFS stream
    gfs = Grid(db, mongoose.mongo);
    gfs.collection('uploads'); // Collection name for GridFS files

    // Create GridFS bucket for streaming with proper error handling
    try {
      gridFsBucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: 'uploads'
      });
      logger.info('GridFS bucket initialized successfully');
    } catch (bucketError) {
      logger.error('Failed to initialize GridFS bucket:', bucketError);
      // Fallback to default bucket name
      gridFsBucket = new mongoose.mongo.GridFSBucket(db);
      logger.info('GridFS bucket initialized with default name');
    }

    logger.info('GridFS initialized successfully');
  } catch (error) {
    logger.error('Error initializing GridFS:', error);
    throw error;
  }
};

// Get GridFS stream instance
const getGfs = () => {
  if (!gfs) {
    throw new Error('GridFS not initialized. Call initGridFS() first.');
  }
  return gfs;
};

// Get GridFS bucket instance
const getGridFsBucket = () => {
  if (!gridFsBucket) {
    throw new Error('GridFS Bucket not initialized. Call initGridFS() first.');
  }
  return gridFsBucket;
};

// Create GridFS storage for multer
const createGridFsStorage = () => {
  return new GridFsStorage({
    url: process.env.MONGODB_URI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        // Generate filename
        const filename = file.originalname;
        
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    }
  });
};

module.exports = {
  initGridFS,
  getGfs,
  getGridFsBucket,
  createGridFsStorage
};