const puppeteer = require('puppeteer');
const fs = require('fs');

// Performance testing configuration
const TEST_CONFIG = {
  url: 'http://localhost:5173/#/employees/edit/EMP001', // Replace with actual employee ID
  iterations: 5,
  networkConditions: {
    fast3G: {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40 // ms
    },
    slow4G: {
      offline: false,
      downloadThroughput: 4 * 1024 * 1024 / 8, // 4 Mbps
      uploadThroughput: 1 * 1024 * 1024 / 8, // 1 Mbps
      latency: 20 // ms
    },
    wifi: {
      offline: false,
      downloadThroughput: 30 * 1024 * 1024 / 8, // 30 Mbps
      uploadThroughput: 15 * 1024 * 1024 / 8, // 15 Mbps
      latency: 2 // ms
    }
  }
};

async function measurePerformance(networkCondition, iteration) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Set network conditions
    const client = await page.target().createCDPSession();
    await client.send('Network.emulateNetworkConditions', networkCondition);
    
    // Enable performance monitoring
    await page.evaluateOnNewDocument(() => {
      window.performanceMetrics = {
        navigationStart: performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd,
        loadEventEnd: performance.timing.loadEventEnd,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Start measuring
    const startTime = Date.now();
    
    // Navigate to the page
    await page.goto(TEST_CONFIG.url, { waitUntil: 'networkidle0' });
    
    // Wait for key elements to be loaded
    await page.waitForSelector('[data-testid="edit-employee-form"]', { timeout: 30000 });
    
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      return {
        navigationStart: performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        loadEventEnd: performance.timing.loadEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Measure API response time
    const apiResponseTime = await page.evaluate(() => {
      // This would need to be implemented in the actual app to track API calls
      return window.apiResponseTime || 0;
    });
    
    await browser.close();
    
    return {
      iteration,
      loadTime,
      domContentLoaded: metrics.domContentLoaded,
      loadEventEnd: metrics.loadEventEnd,
      firstPaint: metrics.firstPaint,
      firstContentfulPaint: metrics.firstContentfulPaint,
      apiResponseTime
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function runPerformanceTests() {
  console.log('Starting performance tests for Edit Employee page...\n');
  
  const results = {
    fast3G: [],
    slow4G: [],
    wifi: []
  };
  
  // Test each network condition
  for (const [conditionName, condition] of Object.entries(TEST_CONFIG.networkConditions)) {
    console.log(`Testing under ${conditionName} conditions...`);
    
    for (let i = 1; i <= TEST_CONFIG.iterations; i++) {
      try {
        console.log(`  Iteration ${i}/${TEST_CONFIG.iterations}`);
        const result = await measurePerformance(condition, i);
        results[conditionName].push(result);
      } catch (error) {
        console.error(`  Error in iteration ${i}:`, error.message);
      }
    }
  }
  
  // Calculate averages
  const averages = {};
  for (const [conditionName, conditionResults] of Object.entries(results)) {
    if (conditionResults.length > 0) {
      averages[conditionName] = {
        loadTime: conditionResults.reduce((sum, r) => sum + r.loadTime, 0) / conditionResults.length,
        domContentLoaded: conditionResults.reduce((sum, r) => sum + r.domContentLoaded, 0) / conditionResults.length,
        loadEventEnd: conditionResults.reduce((sum, r) => sum + r.loadEventEnd, 0) / conditionResults.length,
        firstPaint: conditionResults.reduce((sum, r) => sum + r.firstPaint, 0) / conditionResults.length,
        firstContentfulPaint: conditionResults.reduce((sum, r) => sum + r.firstContentfulPaint, 0) / conditionResults.length,
        apiResponseTime: conditionResults.reduce((sum, r) => sum + r.apiResponseTime, 0) / conditionResults.length
      };
    }
  }
  
  // Save results to file
  const report = {
    timestamp: new Date().toISOString(),
    config: TEST_CONFIG,
    rawResults: results,
    averages
  };
  
  fs.writeFileSync('performance-report.json', JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n=== PERFORMANCE TEST RESULTS ===\n');
  
  for (const [conditionName, avg] of Object.entries(averages)) {
    console.log(`${conditionName.toUpperCase()} CONDITIONS:`);
    console.log(`  Page Load Time: ${(avg.loadTime / 1000).toFixed(2)}s`);
    console.log(`  DOM Content Loaded: ${(avg.domContentLoaded / 1000).toFixed(2)}s`);
    console.log(`  Fully Loaded: ${(avg.loadEventEnd / 1000).toFixed(2)}s`);
    console.log(`  First Paint: ${(avg.firstPaint / 1000).toFixed(2)}s`);
    console.log(`  First Contentful Paint: ${(avg.firstContentfulPaint / 1000).toFixed(2)}s`);
    console.log(`  API Response Time: ${(avg.apiResponseTime / 1000).toFixed(2)}s\n`);
  }
  
  return report;
}

// Run the tests
runPerformanceTests().catch(console.error);