const QRCode = require('qrcode');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { getGridFsBucket } = require('../utils/gridfs');

/**
 * Generate QR code for a unique ID and store it in GridFS
 * @param {string} uniqueId - Unique identifier to encode in QR code
 * @param {string} name - Employee name to encode in QR code
 * @returns {string} Filename of the generated QR code in GridFS
 */
const generateQRCode = async (uniqueId, name = '') => {
  try {
    logger.info('Generating QR code and storing in GridFS', { uniqueId, name });
    
    // Create a URL that points to our QR landing page
    // This prevents mobile cameras from treating it as a search query
    // Ensure we use the correct BASE_URL for production
    const baseUrl = process.env.BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://meal-backend-9zm8.onrender.com' 
        : 'http://localhost:5000');
    const qrUrl = `${baseUrl}/qr/${uniqueId}`;
    
    // Generate QR code as buffer with the URL
    // Use higher error correction level for better scanning reliability
    const buffer = await QRCode.toBuffer(qrUrl, {
      width: 300,
      margin: 4, // Increased margin for better scanning
      errorCorrectionLevel: 'H', // High error correction
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Get GridFS bucket
    const gridFsBucket = getGridFsBucket();
    
    // Generate filename
    const fileName = `qr-${uniqueId.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    
    // Create upload stream
    const uploadStream = gridFsBucket.openUploadStream(fileName, {
      metadata: {
        uniqueId: uniqueId,
        name: name,
        createdAt: new Date()
      }
    });
    
    // Write buffer to GridFS
    await new Promise((resolve, reject) => {
      uploadStream.end(buffer, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
    
    logger.info('QR code generated and saved to GridFS successfully', { uniqueId, fileName });
    return fileName;
  } catch (error) {
    logger.error('Error generating QR code in GridFS', { uniqueId, error: error.message });
    throw error;
  }
};

/**
 * Generate QR code data URI for immediate use
 * @param {string} uniqueId - Unique identifier to encode in QR code
 * @param {string} name - Employee name to encode in QR code
 * @returns {string} Data URI of QR code
 */
const generateQRCodeDataUri = async (uniqueId, name = '') => {
  try {
    logger.info('Generating QR code data URI', { uniqueId, name });
    
    // Create a URL that points to our QR landing page
    // This prevents mobile cameras from treating it as a search query
    // Ensure we use the correct BASE_URL for production
    const baseUrl = process.env.BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://meal-backend-9zm8.onrender.com' 
        : 'http://localhost:5000');
    const qrUrl = `${baseUrl}/qr/${uniqueId}`;
    
    // Use smaller size for better performance
    // Use higher error correction level for better scanning reliability
    const dataUri = await QRCode.toDataURL(qrUrl, {
      width: 200, // Reduced size for better performance
      margin: 4, // Increased margin for better scanning
      errorCorrectionLevel: 'H', // High error correction
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    logger.info('QR code data URI generated successfully', { uniqueId });
    return dataUri;
  } catch (error) {
    logger.error('Error generating QR code data URI', { uniqueId, error: error.message });
    throw error;
  }
};

/**
 * Generate QR code on-demand without storing it
 * @param {string} uniqueId - Unique identifier to encode in QR code
 * @param {string} name - Employee name to encode in QR code
 * @returns {Buffer} Buffer of QR code image
 */
const generateQRCodeOnDemand = async (uniqueId, name = '') => {
  try {
    logger.info('Generating QR code on-demand', { uniqueId, name });
    
    // Create a URL that points to our QR landing page
    // This prevents mobile cameras from treating it as a search query
    // Ensure we use the correct BASE_URL for production
    const baseUrl = process.env.BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://meal-backend-9zm8.onrender.com' 
        : 'http://localhost:5000');
    const qrUrl = `${baseUrl}/qr/${uniqueId}`;
    
    // Generate QR code as buffer with the URL
    const buffer = await QRCode.toBuffer(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    logger.info('QR code generated on-demand successfully', { uniqueId });
    return buffer;
  } catch (error) {
    logger.error('Error generating QR code on-demand', { uniqueId, error: error.message });
    throw error;
  }
};

/**
 * Get QR code from GridFS by filename
 * @param {string} fileName - Name of the QR code file in GridFS
 * @returns {Promise<Buffer>} Buffer containing the QR code image
 */
const getQRCodeFromGridFS = async (fileName) => {
  try {
    logger.info('Retrieving QR code from GridFS', { fileName });
    
    // Get GridFS bucket
    const gridFsBucket = getGridFsBucket();
    
    // Create download stream
    const downloadStream = gridFsBucket.openDownloadStreamByName(fileName);
    
    // Collect data chunks
    const chunks = [];
    return new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        logger.info('QR code retrieved from GridFS successfully', { fileName });
        resolve(buffer);
      });
      
      downloadStream.on('error', (error) => {
        logger.error('Error retrieving QR code from GridFS', { fileName, error: error.message });
        reject(error);
      });
    });
  } catch (error) {
    logger.error('Error retrieving QR code from GridFS', { fileName, error: error.message });
    throw error;
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeDataUri,
  generateQRCodeOnDemand,
  getQRCodeFromGridFS
};