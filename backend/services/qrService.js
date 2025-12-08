const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

/**
 * Generate QR code for a unique ID
 * @param {string} uniqueId - Unique identifier to encode in QR code
 * @returns {string} Path to generated QR code image
 */
const generateQRCode = async (uniqueId) => {
  try {
    logger.info('Generating QR code', { uniqueId });
    
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
    
    // Generate QR code
    const fileName = `qr-${uniqueId.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    const filePath = path.join(qrDir, fileName);
    const fileUrl = `/qrcodes/${fileName}`;
    
    // Use smaller size for better performance
    await QRCode.toFile(filePath, uniqueId, {
      width: 300, // Increased size for better readability
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Verify file was created
    try {
      await fs.access(filePath, fs.constants.F_OK);
      logger.info('QR code generated successfully', { uniqueId, filePath });
    } catch (fileError) {
      logger.error('QR code file was not created', { uniqueId, filePath, error: fileError.message });
      throw new Error(`QR code file was not created: ${filePath}`);
    }
    
    return fileUrl;
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

module.exports = {
  generateQRCode,
  generateQRCodeDataUri
};