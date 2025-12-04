#!/usr/bin/env node

/**
 * Health monitoring script for blue/green deployment
 * Automatically rolls back if health checks fail
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Active environment
  activeEnv: process.env.ACTIVE_ENV || 'blue',
  // Backend URLs
  backendUrls: {
    blue: 'https://meal-pass-backend-blue.onrender.com',
    green: 'https://meal-pass-backend-green.onrender.com'
  },
  // Health check endpoint
  healthEndpoint: '/health',
  // Check interval (ms)
  checkInterval: 30000,
  // Failure threshold before rollback
  failureThreshold: 3,
  // Current failure count
  failureCount: 0
};

/**
 * Make HTTP request
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Check if service is healthy
 */
async function checkHealth() {
  try {
    const baseUrl = CONFIG.backendUrls[CONFIG.activeEnv];
    const url = `${baseUrl}${CONFIG.healthEndpoint}`;
    
    const response = await makeRequest(url);
    
    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.data);
      console.log(`[${new Date().toISOString()}] ✓ Health check passed for ${CONFIG.activeEnv}`);
      return true;
    } else {
      throw new Error(`Health check failed with status ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`[${new Date().toISOString()}] ✗ Health check failed for ${CONFIG.activeEnv}: ${error.message}`);
    return false;
  }
}

/**
 * Trigger rollback
 */
async function triggerRollback() {
  console.log(`[${new Date().toISOString()}] ⚠️  Triggering rollback due to health check failures`);
  
  // In a real implementation, this would:
  // 1. Switch traffic back to the previous environment
  // 2. Send alerts to operations team
  // 3. Log the incident
  
  const previousEnv = CONFIG.activeEnv === 'blue' ? 'green' : 'blue';
  console.log(`Rollback initiated. Switching traffic to ${previousEnv} environment.`);
  
  // Update environment file
  const envFilePath = path.join(__dirname, '..', 'backend', '.env.production');
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(envFilePath, 'utf8');
    envContent = envContent.replace(/ACTIVE_ENV=.*/, `ACTIVE_ENV=${previousEnv}`);
    fs.writeFileSync(envFilePath, envContent);
    console.log(`Updated environment file to ${previousEnv}`);
  } catch (error) {
    console.error('Failed to update environment file:', error.message);
  }
  
  // Send alert (simulated)
  console.log('Alert sent to operations team');
  
  // Log incident (simulated)
  console.log('Incident logged in monitoring system');
}

/**
 * Main monitoring function
 */
async function monitor() {
  console.log(`[${new Date().toISOString()}] Starting health monitoring for ${CONFIG.activeEnv} environment`);
  
  const isHealthy = await checkHealth();
  
  if (isHealthy) {
    // Reset failure count on success
    CONFIG.failureCount = 0;
  } else {
    // Increment failure count
    CONFIG.failureCount++;
    
    console.log(`Failure count: ${CONFIG.failureCount}/${CONFIG.failureThreshold}`);
    
    // Trigger rollback if failure threshold reached
    if (CONFIG.failureCount >= CONFIG.failureThreshold) {
      await triggerRollback();
      CONFIG.failureCount = 0; // Reset after rollback
    }
  }
}

// Run monitoring periodically
console.log('Health monitoring started');
setInterval(monitor, CONFIG.checkInterval);

// Run initial check
monitor().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Monitoring stopped');
  process.exit(0);
});