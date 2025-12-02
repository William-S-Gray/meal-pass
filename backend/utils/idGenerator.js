const Beneficiary = require('../models/Beneficiary');

/**
 * Generates a unique ID in the format: BEN-{year}-{increment}
 * @returns {Promise<string>} The generated unique ID
 */
const generateUniqueId = async () => {
  const year = new Date().getFullYear();
  
  // Find the highest increment number for this year
  const lastBeneficiary = await Beneficiary
    .findOne({ uniqueId: new RegExp(`^BEN-${year}-`) })
    .sort({ uniqueId: -1 })
    .limit(1);
  
  let increment = 1;
  
  if (lastBeneficiary) {
    const lastIdParts = lastBeneficiary.uniqueId.split('-');
    if (lastIdParts.length === 3) {
      increment = parseInt(lastIdParts[2]) + 1;
    }
  }
  
  // Format increment to have leading zeros (e.g., 0001, 0002, etc.)
  const formattedIncrement = increment.toString().padStart(4, '0');
  
  // Ensure the generated ID is unique by checking if it already exists
  const uniqueId = `BEN-${year}-${formattedIncrement}`;
  const existingBeneficiary = await Beneficiary.findOne({ uniqueId });
  
  if (existingBeneficiary) {
    // If it exists, increment and try again
    return await generateUniqueId();
  }
  
  return uniqueId;
};

module.exports = { generateUniqueId };