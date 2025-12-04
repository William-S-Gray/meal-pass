#!/usr/bin/env node

/**
 * Script to set the active environment for blue/green deployment
 */

const fs = require('fs');
const path = require('path');

// Get environment from command line argument
const targetEnv = process.argv[2];

if (!targetEnv || (targetEnv !== 'blue' && targetEnv !== 'green')) {
  console.error('Usage: node set-active-env.js <blue|green>');
  process.exit(1);
}

// Update backend environment file
const backendEnvPath = path.join(__dirname, '..', 'backend', '.env.production');
let backendEnvContent = '';

try {
  backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
} catch (error) {
  console.log('Creating new backend .env.production file');
  backendEnvContent = '';
}

// Update or add ACTIVE_ENV variable
if (backendEnvContent.includes('ACTIVE_ENV=')) {
  backendEnvContent = backendEnvContent.replace(/ACTIVE_ENV=.*/, `ACTIVE_ENV=${targetEnv}`);
} else {
  backendEnvContent += `\nACTIVE_ENV=${targetEnv}\n`;
}

fs.writeFileSync(backendEnvPath, backendEnvContent);
console.log(`Updated backend .env.production: ACTIVE_ENV=${targetEnv}`);

// Update frontend environment file
const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env.production');
let frontendEnvContent = '';

try {
  frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');
} catch (error) {
  console.log('Creating new frontend .env.production file');
  frontendEnvContent = '';
}

// Set API URL based on target environment
const apiUrl = targetEnv === 'blue' 
  ? 'https://meal-pass-backend-blue.onrender.com'
  : 'https://meal-pass-backend-green.onrender.com';

if (frontendEnvContent.includes('VITE_API_URL=')) {
  frontendEnvContent = frontendEnvContent.replace(/VITE_API_URL=.*/, `VITE_API_URL=${apiUrl}`);
} else {
  frontendEnvContent += `\nVITE_API_URL=${apiUrl}\n`;
}

fs.writeFileSync(frontendEnvPath, frontendEnvContent);
console.log(`Updated frontend .env.production: VITE_API_URL=${apiUrl}`);

console.log(`Successfully set active environment to: ${targetEnv}`);