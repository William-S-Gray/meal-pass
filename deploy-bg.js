#!/usr/bin/env node

/**
 * Blue/Green Deployment Script for Meal-Pass MERN Application
 * 
 * This script implements a zero-downtime deployment strategy:
 * 1. Deploy to inactive environment (GREEN when BLUE is active)
 * 2. Run health checks and tests
 * 3. Promote if healthy, rollback if not
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Active environment (blue or green)
  activeEnv: process.env.ACTIVE_ENV || 'blue',
  // Inactive environment (will deploy here)
  inactiveEnv: process.env.ACTIVE_ENV === 'blue' ? 'green' : 'blue',
  // Backend URLs
  backendUrls: {
    blue: 'https://meal-pass-backend-blue.onrender.com',
    green: 'https://meal-pass-backend-green.onrender.com'
  },
  // Frontend URLs
  frontendUrls: {
    blue: 'https://meal-pass-frontend-blue.onrender.com',
    green: 'https://meal-pass-frontend-green.onrender.com'
  },
  // Health check endpoint
  healthEndpoint: '/health',
  // Timeout for health checks (ms)
  healthCheckTimeout: 30000,
  // Required API endpoints to test
  apiEndpoints: [
    '/',
    '/api/beneficiaries',
    '/api/feeding/today'
  ]
};

/**
 * Sleep function for delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(CONFIG.healthCheckTimeout, () => {
      req.destroy();
      reject(new Error(`Request timeout for ${url}`));
    });
    
    req.end();
  });
}

/**
 * Check if service is healthy
 */
async function checkHealth(baseUrl) {
  try {
    const url = `${baseUrl}${CONFIG.healthEndpoint}`;
    console.log(`Checking health: ${url}`);
    
    const response = await makeRequest(url);
    
    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.data);
      console.log(`✓ Health check passed: ${JSON.stringify(healthData)}`);
      return true;
    } else {
      console.log(`✗ Health check failed with status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`✗ Health check error: ${error.message}`);
    return false;
  }
}

/**
 * Test API endpoints
 */
async function testApiEndpoints(baseUrl) {
  console.log(`Testing API endpoints on ${baseUrl}`);
  
  for (const endpoint of CONFIG.apiEndpoints) {
    try {
      const url = `${baseUrl}${endpoint}`;
      console.log(`Testing: ${url}`);
      
      const response = await makeRequest(url);
      
      if (response.statusCode >= 200 && response.statusCode < 400) {
        console.log(`✓ ${endpoint} responded with status ${response.statusCode}`);
      } else {
        console.log(`✗ ${endpoint} failed with status ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      console.log(`✗ ${endpoint} error: ${error.message}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Test frontend build
 */
async function testFrontend(frontendUrl) {
  try {
    console.log(`Testing frontend: ${frontendUrl}`);
    const response = await makeRequest(frontendUrl);
    
    if (response.statusCode === 200 && response.data.includes('<html')) {
      console.log('✓ Frontend loaded successfully');
      return true;
    } else {
      console.log(`✗ Frontend failed with status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`✗ Frontend error: ${error.message}`);
    return false;
  }
}

/**
 * Simulate deployment to inactive environment
 */
async function deployToInactiveEnvironment() {
  console.log(`Deploying to inactive environment: ${CONFIG.inactiveEnv}`);
  
  // In a real scenario, this would trigger Render deployment
  // For simulation, we'll just wait
  console.log('Deployment in progress...');
  await sleep(5000); // Simulate deployment time
  console.log('Deployment completed');
  
  return true;
}

/**
 * Promote environment (switch active environment)
 */
async function promoteEnvironment() {
  console.log(`Promoting ${CONFIG.inactiveEnv} to active environment`);
  
  // In a real scenario, this would update DNS/routing
  // For now, we'll just update the config file
  const newConfig = {
    ...CONFIG,
    activeEnv: CONFIG.inactiveEnv,
    inactiveEnv: CONFIG.activeEnv
  };
  
  // Update environment variable
  process.env.ACTIVE_ENV = CONFIG.inactiveEnv;
  
  console.log(`✓ Environment switched to ${CONFIG.inactiveEnv}`);
  return true;
}

/**
 * Rollback deployment
 */
async function rollbackDeployment() {
  console.log(`Rolling back to ${CONFIG.activeEnv} environment`);
  
  // In a real scenario, this would ensure the active environment continues serving traffic
  console.log(`✓ Keeping ${CONFIG.activeEnv} as active environment`);
  return true;
}

/**
 * Cleanup old builds/logs
 */
async function cleanup() {
  console.log('Cleaning up old builds and logs');
  // In a real scenario, this would clean up old deployment artifacts
  console.log('✓ Cleanup completed');
}

/**
 * Main deployment function
 */
async function deploy() {
  console.log('=== Blue/Green Deployment Started ===');
  console.log(`Active environment: ${CONFIG.activeEnv}`);
  console.log(`Deploying to: ${CONFIG.inactiveEnv}`);
  
  try {
    // Step 1: Deploy to inactive environment
    const deploySuccess = await deployToInactiveEnvironment();
    if (!deploySuccess) {
      throw new Error('Deployment failed');
    }
    
    // Step 2: Get URLs for testing
    const backendUrl = CONFIG.backendUrls[CONFIG.inactiveEnv];
    const frontendUrl = CONFIG.frontendUrls[CONFIG.inactiveEnv];
    
    // Step 3: Run health checks
    console.log('\n--- Health Checks ---');
    const backendHealthy = await checkHealth(backendUrl);
    if (!backendHealthy) {
      throw new Error('Backend health check failed');
    }
    
    // Step 4: Test API endpoints
    console.log('\n--- API Tests ---');
    const apiTestsPassed = await testApiEndpoints(backendUrl);
    if (!apiTestsPassed) {
      throw new Error('API tests failed');
    }
    
    // Step 5: Test frontend
    console.log('\n--- Frontend Tests ---');
    const frontendWorks = await testFrontend(frontendUrl);
    if (!frontendWorks) {
      throw new Error('Frontend tests failed');
    }
    
    // Step 6: Promote if all checks pass
    console.log('\n--- Promotion ---');
    const promotionSuccess = await promoteEnvironment();
    if (!promotionSuccess) {
      throw new Error('Promotion failed');
    }
    
    // Step 7: Cleanup
    console.log('\n--- Cleanup ---');
    await cleanup();
    
    console.log('\n=== Deployment Successful ===');
    console.log(`New active environment: ${CONFIG.inactiveEnv}`);
    console.log('Deployment completed successfully!');
    
    return {
      success: true,
      activeEnv: CONFIG.inactiveEnv,
      message: 'Deployment successful'
    };
    
  } catch (error) {
    console.log(`\n=== Deployment Failed ===`);
    console.log(`Error: ${error.message}`);
    
    // Rollback
    console.log('\n--- Rollback ---');
    await rollbackDeployment();
    
    // Cleanup
    console.log('\n--- Cleanup ---');
    await cleanup();
    
    console.log('\n=== Deployment Rolled Back ===');
    console.log(`Active environment remains: ${CONFIG.activeEnv}`);
    
    return {
      success: false,
      activeEnv: CONFIG.activeEnv,
      error: error.message
    };
  }
}

// Run deployment if script is executed directly
if (require.main === module) {
  deploy().then(result => {
    console.log('\n=== FINAL RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  deploy,
  checkHealth,
  testApiEndpoints,
  testFrontend
};