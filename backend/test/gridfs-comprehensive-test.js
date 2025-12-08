const mongoose = require('mongoose');
const { initGridFS, getGridFsBucket } = require('../utils/gridfs');
const qrService = require('../services/qrService');
const Employee = require('../models/Employee');
const { generateUniqueId } = require('../utils/helpers');

// Test MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mealpass-test';

async function runComprehensiveTest() {
  let connection;
  
  try {
    console.log('🚀 Starting Comprehensive GridFS Test...');
    
    // 1. Connect to MongoDB
    console.log('1. Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
    
    // 2. Initialize GridFS
    console.log('2. Initializing GridFS...');
    await initGridFS();
    console.log('✅ GridFS Initialized');
    
    // 3. Test QR Code Generation and Storage
    console.log('3. Testing QR Code Generation and Storage...');
    const testUniqueId = generateUniqueId();
    const qrFileName = await qrService.generateQRCode(testUniqueId);
    console.log('✅ QR Code Generated and Stored:', qrFileName);
    
    // 4. Test Employee Creation with QR Code
    console.log('4. Testing Employee Creation with QR Code...');
    const employeeData = {
      uniqueId: testUniqueId,
      name: 'Test Employee',
      gender: 'Male',
      department: 'IT',
      position: 'Developer',
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      qrFileName: qrFileName
    };
    
    const employee = new Employee(employeeData);
    await employee.save();
    console.log('✅ Employee Created with QR Code Reference:', employee._id);
    
    // 5. Test QR Code Retrieval
    console.log('5. Testing QR Code Retrieval...');
    const qrBuffer = await qrService.getQRCodeFromGridFS(qrFileName);
    console.log('✅ QR Code Retrieved:', qrBuffer.length, 'bytes');
    
    // 6. Test Employee Lookup by Unique ID
    console.log('6. Testing Employee Lookup by Unique ID...');
    const foundEmployee = await Employee.findOne({ uniqueId: testUniqueId });
    console.log('✅ Employee Found by Unique ID:', foundEmployee.name);
    
    // 7. Test QR Code Regeneration (simulate missing QR)
    console.log('7. Testing QR Code Regeneration (simulate missing QR)...');
    // Remove QR filename to simulate missing QR
    await Employee.updateOne({ uniqueId: testUniqueId }, { qrFileName: null });
    
    // Try to get employee again
    const employeeWithoutQR = await Employee.findOne({ uniqueId: testUniqueId });
    if (!employeeWithoutQR.qrFileName) {
      console.log('✅ Simulated missing QR code detected');
      
      // Regenerate QR code
      const newQrFileName = await qrService.generateQRCode(testUniqueId);
      await Employee.updateOne({ uniqueId: testUniqueId }, { qrFileName: newQrFileName });
      console.log('✅ QR Code Regenerated:', newQrFileName);
    }
    
    // 8. Test Cleanup
    console.log('8. Cleaning up test data...');
    await Employee.deleteOne({ uniqueId: testUniqueId });
    
    // Delete QR codes from GridFS
    const bucket = getGridFsBucket();
    const files = await bucket.find({ filename: qrFileName }).toArray();
    for (const file of files) {
      await bucket.delete(file._id);
      console.log('✅ QR Code deleted from GridFS:', file.filename);
    }
    
    console.log('\n🎉 All Comprehensive Tests Passed!');
    console.log('✅ GridFS Implementation is Working Correctly');
    console.log('✅ QR Code Generation and Storage is Working');
    console.log('✅ Employee Creation with QR Code Reference is Working');
    console.log('✅ QR Code Regeneration Logic is Working');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Comprehensive Test Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.connection.close();
      console.log('🔒 Database connection closed');
    }
  }
}

runComprehensiveTest();