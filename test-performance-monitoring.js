// Test script to verify performance monitoring is working correctly
const fs = require('fs');
const path = require('path');

console.log('=== Performance Monitoring Verification ===\n');

// Check if performance log file exists
const logFilePath = path.join(__dirname, 'logs', 'performance.log');

if (fs.existsSync(logFilePath)) {
  console.log('✅ Performance log file exists');
  
  // Read the last few lines of the log file
  const logContent = fs.readFileSync(logFilePath, 'utf8');
  const lines = logContent.split('\n').filter(line => line.trim() !== '').slice(-5);
  
  if (lines.length > 0) {
    console.log('✅ Performance logs are being generated');
    console.log('Recent log entries:');
    lines.forEach((line, index) => {
      console.log(`  ${index + 1}. ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
    });
  } else {
    console.log('⚠️  Performance log file is empty');
  }
} else {
  console.log('❌ Performance log file does not exist');
  console.log('Please ensure the backend server is running and generating performance logs');
}

// Check if frontend performance monitoring utilities exist
const frontendPerfMonitorPath = path.join(__dirname, 'frontend', 'src', 'utils', 'performance-monitor.js');

if (fs.existsSync(frontendPerfMonitorPath)) {
  console.log('\n✅ Frontend performance monitor exists');
  console.log('File path:', frontendPerfMonitorPath);
} else {
  console.log('\n❌ Frontend performance monitor not found');
}

// Check if performance dashboard component exists
const perfDashboardPath = path.join(__dirname, 'frontend', 'src', 'components', 'PerformanceDashboard.tsx');

if (fs.existsSync(perfDashboardPath)) {
  console.log('\n✅ Performance dashboard component exists');
  console.log('File path:', perfDashboardPath);
} else {
  console.log('\n❌ Performance dashboard component not found');
}

console.log('\n=== How to Test Performance Monitoring ===');
console.log('1. Start the backend server with PERFORMANCE_DEBUG=true');
console.log('2. Start the frontend development server');
console.log('3. Navigate to the Edit Employee page');
console.log('4. Open browser console and observe detailed performance logs');
console.log('5. Click "Show Detailed Performance Report" button');
console.log('6. Check logs/performance.log for backend performance metrics');

console.log('\n=== Expected Console Output ===');
console.log('Look for these patterns in the browser console:');
console.log('- 🔍 Performance Debug: ...');
console.log('- ⏱️  Page Load Phase Started: ...');
console.log('- ✅ Page Load Phase Completed: ...');
console.log('- ⚠️  Slow/Moderate performance warnings');
console.log('- 📊 === COMPREHENSIVE PERFORMANCE DEBUG REPORT ===');

console.log('\n=== Expected Log File Entries ===');
console.log('Look for these patterns in logs/performance.log:');
console.log('- [INFO] Operation completed: ...');
console.log('- [WARN] SLOW/MODERATE OPERATION DETECTED: ...');
console.log('- [INFO] ACTIONABLE INSIGHTS FOR ...');