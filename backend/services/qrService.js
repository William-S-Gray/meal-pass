const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const cloudinary = require('cloudinary').v2;

// Initialize Cloudinary if credentials are available
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  logger.info('Cloudinary initialized');
} else {
  logger.warn('Cloudinary credentials not provided, using local storage');
}

/**
 * Generate QR code for a unique ID and store it persistently
 * @param {string} uniqueId - Unique identifier to encode in QR code
 * @returns {string} URL to the generated QR code image
 */
const generateQRCode = async (uniqueId) => {
  try {
    logger.info('Generating QR code', { uniqueId });
    
    // Generate QR code as Data URI (base64)
    const dataUri = await QRCode.toDataURL(uniqueId, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // If Cloudinary is configured, upload to Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      logger.info('Uploading QR code to Cloudinary', { uniqueId });
      
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'mealpass_qr_codes',
        public_id: `qr-${uniqueId.replace(/[^a-zA-Z0-9]/g, '-')}`,
        overwrite: true,
        resource_type: 'image'
      });
      
      logger.info('QR code uploaded to Cloudinary successfully', { uniqueId, url: result.secure_url });
      return result.secure_url;
    } else {
      // Fallback to local storage for development
      logger.info('Using local storage for QR code', { uniqueId });
      
      // Ensure qrcodes directory exists
      const qrDir = path.join(__dirname, '..', 'public', 'qrcodes');
      await fs.mkdir(qrDir, { recursive: true });
      
      // Check if directory is writable
      try {
        await fs.access(qrDir, fs.constants.W_OK);
      } catch (accessError) {
        logger.error('QR codes directory is not writable', { qrDir, error: accessError.message });
        throw new Error(`QR codes directory is not writable: ${qrDir}`);
      }
      
      // Generate QR code as file
      const fileName = `qr-${uniqueId.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      const filePath = path.join(qrDir, fileName);
      const fileUrl = `/qrcodes/${fileName}`;
      
      // Convert data URI to buffer and save file
      const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(filePath, buffer);
      
      logger.info('QR code generated and saved locally', { uniqueId, filePath });
      return fileUrl;
    }
  } catch (error) {
    logger.error('Error generating QR code', { uniqueId, error: error.message });
    throw error;
  }
};

/**
 * Generate QR code data URI for immediate use
 * @param {string} uniqueId - Unique identifier to encode in QR code
 * @returns {string} Data URI of QR code
 */
const generateQRCodeDataUri = async (uniqueId) => {
  try {
    logger.info('Generating QR code data URI', { uniqueId });
    
    // Use smaller size for better performance
    const dataUri = await QRCode.toDataURL(uniqueId, {
      width: 200, // Reduced size for better performance
      margin: 2,
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
 * @returns {Buffer} Buffer of QR code image
 */
const generateQRCodeOnDemand = async (uniqueId) => {
  try {
    logger.info('Generating QR code on-demand', { uniqueId });
    
    // Generate QR code as buffer
    const buffer = await QRCode.toBuffer(uniqueId, {
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

module.exports = {
  generateQRCode,
  generateQRCodeDataUri,
  generateQRCodeOnDemand
};