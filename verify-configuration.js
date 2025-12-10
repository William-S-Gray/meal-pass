// Script to verify configuration and connectivity
const axios = require('axios');

console.log('=== Configuration Verification ===\n');

// Check environment variables
console.log('Environment Variables Check:');
console.log('VITE_API_URL (should be http://localhost:5000):', process.env.VITE_API_URL || 'Not set');
console.log('Backend PORT (should be 5000):', process.env.PORT || 'Not set');
console.log('');

// Check if backend is running on port 5000
async function checkBackend() {
  try {
    console.log('Checking backend connectivity...');
    const response = await axios.get('http://localhost:5000/health', { timeout: 5000 });
    console.log('✅ Backend is running on port 5000');
    console.log('Health check response:', response.data);
  } catch (error) {
    console.log('❌ Backend is not accessible on port 5000');
    if (error.code === 'ECONNREFUSED') {
      console.log('   Reason: Connection refused - backend server may not be running');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   Reason: Host not found - check if localhost resolves correctly');
    } else {
      console.log('   Reason:', error.message);
    }
  }
}

// Check frontend configuration
function checkFrontendConfig() {
  console.log('\nFrontend Configuration Check:');
  const fs = require('fs');
  const path = require('path');
  
  const frontendEnvPath = path.join(__dirname, '.env.frontend');
  if (fs.existsSync(frontendEnvPath)) {
    const content = fs.readFileSync(frontendEnvPath, 'utf8');
    if (content.includes('VITE_API_URL=http://localhost:5000')) {
      console.log('✅ Frontend .env configured correctly');
    } else {
      console.log('❌ Frontend .env configuration issue');
      console.log('Current content:', content);
    }
  } else {
    console.log('❌ Frontend .env file not found');
  }
}

// Check backend configuration
function checkBackendConfig() {
  console.log('\nBackend Configuration Check:');
  const fs = require('fs');
  const path = require('path');
  
  const backendEnvPath = path.join(__dirname, '.env.backend');
  if (fs.existsSync(backendEnvPath)) {
    const content = fs.readFileSync(backendEnvPath, 'utf8');
    if (content.includes('PORT=5000')) {
      console.log('✅ Backend .env configured correctly');
    } else {
      console.log('❌ Backend .env configuration issue');
      console.log('Current content:', content);
    }
  } else {
    console.log('❌ Backend .env file not found');
  }
}

// Run checks
checkBackend();
checkFrontendConfig();
checkBackendConfig();

console.log('\n=== Recommendations ===');
console.log('1. Make sure to restart both frontend and backend servers after configuration changes');
console.log('2. Ensure MongoDB is running on port 27017');
console.log('3. Check that no other service is using port 5000');
console.log('4. Verify firewall settings allow connections on port 5000');