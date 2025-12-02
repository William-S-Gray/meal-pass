const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Generates a QR code for a given unique ID and saves it as a PNG file
 * @param {string} uniqueId - The unique ID to encode in the QR code
 * @returns {Promise<string>} The URL/path to the saved QR code image
 */
const generateQRCode = async (uniqueId) => {
  try {
    // Define the path where QR codes will be saved
    const qrCodesDir = path.join(__dirname, '..', 'public', 'qrcodes');
    
    // Ensure the directory exists
    if (!fs.existsSync(qrCodesDir)) {
      fs.mkdirSync(qrCodesDir, { recursive: true });
    }
    
    // Generate filename
    const fileName = `${uniqueId}.png`;
    const filePath = path.join(qrCodesDir, fileName);
    
    // Generate QR code and save as PNG
    await QRCode.toFile(filePath, uniqueId, {
      color: {
        dark: '#000000',  // Black dots
        light: '#FFFFFF'  // White background
      },
      width: 300,
      margin: 2
    });
    
    // Return the URL that can be accessed via the server
    return `/qrcodes/${fileName}`;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

module.exports = { generateQRCode };