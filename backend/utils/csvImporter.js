const csv = require('csv-parser');
const fs = require('fs');
const { generateUniqueId } = require('./idGenerator');
const { generateQRCode } = require('./generateQR');
const Employee = require('../models/Employee');

/**
 * Imports employees from a CSV file
 * Expected CSV columns: name, gender, group
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Object>} Import results
 */
const importFromCSV = async (filePath) => {
  const results = [];
  const errors = [];
  let successCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          // Process each row
          for (const row of results) {
            try {
              // Validate required fields
              if (!row.name || !row.gender || !row.group) {
                errors.push({
                  row,
                  error: 'Missing required fields: name, gender, or group'
                });
                continue;
              }
              
              // Generate unique ID
              const uniqueId = await generateUniqueId();
              
              // Generate QR code
              const qrCodeUrl = await generateQRCode(uniqueId);
              
              // Create employee
              const employee = new Employee({
                name: row.name.trim(),
                gender: row.gender.trim(),
                group: row.group.trim(),
                uniqueId,
                qrCodeUrl
              });
              
              await employee.save();
              successCount++;
            } catch (error) {
              errors.push({
                row,
                error: error.message
              });
            }
          }
          
          resolve({
            success: true,
            imported: successCount,
            errors,
            total: results.length
          });
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

module.exports = { importFromCSV };