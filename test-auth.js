const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing authentication flow...');
    
    // First, try to login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    }, {
      timeout: 5000
    });
    
    console.log('Login successful!');
    console.log('Token:', loginResponse.data.data.token.substring(0, 20) + '...');
    
    // Use the token to make an authenticated request
    const token = loginResponse.data.data.token;
    const authResponse = await axios.get('http://localhost:5000/api/feeding/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 5000
    });
    
    console.log('Authenticated request successful!', authResponse.data);
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

testAuth();