/**
 * Generate a unique ID for beneficiaries
 * @returns {string} Unique ID in format BNF-YYYY-XXXX
 */
const generateUniqueId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `BNF-${year}-${randomNum}`;
};

/**
 * Format API response
 * @param {boolean} success - Success status
 * @param {any} data - Response data
 * @param {string} message - Optional message
 * @param {object} pagination - Pagination info
 * @returns {object} Formatted response
 */
const formatResponse = (success, data = null, message = null, pagination = null) => {
  const response = { success };
  
  if (data !== null) response.data = data;
  if (message) response.message = message;
  if (pagination) response.pagination = pagination;
  
  return response;
};

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Validate ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} Validity status
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

module.exports = {
  generateUniqueId,
  formatResponse,
  sanitizeInput,
  isValidObjectId
};