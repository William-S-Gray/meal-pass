const json2csv = require('json2csv').Parser;
const fs = require('fs');
const path = require('path');

/**
 * Exports data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} fields - Field names to include in CSV
 * @param {string} filename - Name of the CSV file (without extension)
 * @returns {Promise<string>} Path to the exported CSV file
 */
const exportToCSV = async (data, fields, filename) => {
  try {
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', 'public', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Create CSV parser with specified fields
    const json2csvParser = new json2csv({ fields });
    const csvData = json2csvParser.parse(data);
    
    // Write to file
    const filePath = path.join(exportsDir, `${filename}.csv`);
    fs.writeFileSync(filePath, csvData);
    
    return `/exports/${filename}.csv`;
  } catch (error) {
    throw new Error(`Failed to export CSV: ${error.message}`);
  }
};

/**
 * Exports data to JSON format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the JSON file (without extension)
 * @returns {Promise<string>} Path to the exported JSON file
 */
const exportToJSON = async (data, filename) => {
  try {
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', 'public', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Convert to JSON and write to file
    const jsonData = JSON.stringify(data, null, 2);
    const filePath = path.join(exportsDir, `${filename}.json`);
    fs.writeFileSync(filePath, jsonData);
    
    return `/exports/${filename}.json`;
  } catch (error) {
    throw new Error(`Failed to export JSON: ${error.message}`);
  }
};

module.exports = { exportToCSV, exportToJSON };