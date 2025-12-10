/**
 * Decodes QR code data and extracts the uniqueId
 * Handles both old format (plain uniqueId) and new format (JSON with uniqueId and name)
 * @param {string} qrData - Raw QR code data
 * @returns {string|null} The extracted uniqueId or null if invalid
 */
const decodeQRData = (qrData) => {
  try {
    // Try to parse as JSON first (new format)
    const parsedData = JSON.parse(qrData);
    
    // Check if it has the expected structure
    if (parsedData && typeof parsedData === 'object' && parsedData.uniqueId) {
      return parsedData.uniqueId;
    }
    
    // If parsing succeeded but structure is wrong, fall through to return null
  } catch (error) {
    // If parsing fails, treat as old format (plain uniqueId)
    // Validate that it looks like a valid uniqueId
    if (qrData && typeof qrData === 'string' && qrData.trim().length > 0) {
      return qrData.trim();
    }
  }
  
  // Invalid format
  return null;
};

module.exports = { decodeQRData };