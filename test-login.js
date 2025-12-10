const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    // Test if we can reach the backend API
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    }, {
      timeout: 5000
    });
    
    console.log('Login successful!', response.data);
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      console.log('Server responded with error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.log('No response received from server:', error.message);
    } else {
      // Something else happened
      console.log('Error:', error.message);
    }
  }
}

testLogin();