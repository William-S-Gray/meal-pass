/**
 * Decodes QR code data and extracts the uniqueId
 * Handles multiple formats:
 * 1. New URL format: http://domain/api/employees/qr/UNIQUE_ID
 * 2. Direct URL format: http://domain/qr/UNIQUE_ID (with redirect)
 * 3. Old JSON format (with uniqueId and name)
 * 4. Legacy plain uniqueId format
 * @param {string} qrData - Raw QR code data
 * @returns {string|null} The extracted uniqueId or null if invalid
 */
const decodeQRData = (qrData) => {
  try {
    // Handle URL format first
    if (qrData && typeof qrData === 'string') {
      // Check if it's a URL format pointing to our QR endpoint
      // Updated to match the correct endpoint pattern: /api/employees/qr/{uniqueId}
      const apiUrlMatch = qrData.match(/\/api\/employees\/qr\/([A-Za-z0-9\-_]+)/);
      if (apiUrlMatch && apiUrlMatch[1]) {
        return apiUrlMatch[1];
      }
      
      // Also check for direct /qr/ format (for mobile camera compatibility)
      const directUrlMatch = qrData.match(/\/qr\/([A-Za-z0-9\-_]+)/);
      if (directUrlMatch && directUrlMatch[1]) {
        return directUrlMatch[1];
      }
      
      // Try to parse as JSON (old format)
      const parsedData = JSON.parse(qrData);
      
      // Check if it has the expected structure
      if (parsedData && typeof parsedData === 'object' && parsedData.uniqueId) {
        return parsedData.uniqueId;
      }
    }
  } catch (error) {
    // If parsing fails, treat as legacy format (plain uniqueId)
    // Validate that it looks like a valid uniqueId
    if (qrData && typeof qrData === 'string' && qrData.trim().length > 0) {
      return qrData.trim();
    }
  }
  
  // Invalid format
  return null;
};

module.exports = { decodeQRData };