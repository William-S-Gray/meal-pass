const axios = require('axios');

// Test the backend API
async function testAPI() {
  try {
    console.log('Testing backend API...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('Health check:', healthResponse.data);
    
    // Test employee creation
    const employeeData = {
      name: 'Test Employee',
      gender: 'Male',
      uniqueId: 'TEST-001',
      phone: '1234567890',
      department: 'IT',
      position: 'Developer'
    };
    
    console.log('Creating employee...');
    const createResponse = await axios.post('http://localhost:5000/api/employees', employeeData);
    console.log('Employee creation response:', createResponse.data);
    
    console.log('API test completed successfully!');
  } catch (error) {
    console.error('API test failed:', error.response?.data || error.message);
  }
}

testAPI();