// Performance monitoring utility for the Edit Employee page
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: [],
      apiCalls: [],
      rendering: [],
      userInteractions: [],
      network: [],
      database: [],
      componentLifecycle: []
    };
    this.debugMode = true; // Enable detailed debugging by default
    this.pageLoadPhases = {}; // Track different phases of page loading
  }

  // Enable or disable debug mode
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  // Log detailed debug information
  debugLog(message, data = null) {
    if (this.debugMode) {
      console.group(`🔍 Performance Debug: ${message}`);
      if (data) {
        console.table(data);
      }
      console.groupEnd();
    }
  }

  // Start tracking a specific page load phase
  startPageLoadPhase(phaseName) {
    this.pageLoadPhases[phaseName] = {
      startTime: performance.now(),
      timestamp: new Date().toISOString()
    };
    
    if (this.debugMode) {
      console.log(`⏱️  Page Load Phase Started: ${phaseName}`);
    }
  }

  // End tracking a specific page load phase
  endPageLoadPhase(phaseName) {
    const phase = this.pageLoadPhases[phaseName];
    if (!phase) {
      console.warn(`⚠️  Page load phase not found: ${phaseName}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - phase.startTime;
    
    // Remove the phase tracking
    delete this.pageLoadPhases[phaseName];
    
    // Log phase completion with detailed timing
    if (this.debugMode) {
      console.log(`✅ Page Load Phase Completed: ${phaseName} (${duration.toFixed(2)}ms)`);
      
      // Performance warnings for slow phases
      let status = 'FAST';
      if (duration > 1000) {
        console.warn(`⚠️  Slow page load phase detected: ${phaseName} took ${duration.toFixed(2)}ms (>1000ms threshold)`);
        status = 'SLOW';
      } else if (duration > 500) {
        console.warn(`⚠️  Moderate page load phase detected: ${phaseName} took ${duration.toFixed(2)}ms (>500ms threshold)`);
        status = 'MODERATE';
      }
      
      // Detailed phase information
      console.group(`📋 Phase Details: ${phaseName}`);
      console.log(`Duration: ${duration.toFixed(2)}ms`);
      console.log(`Status: ${status}`);
      console.log(`Started: ${phase.timestamp}`);
      console.log(`Ended: ${new Date().toISOString()}`);
      console.groupEnd();
    }
    
    return duration;
  }

  // Start measuring page load time
  startPageLoad() {
    this.pageLoadStart = performance.now();
    this.debugLog('Page load started');
    
    // Start the initial phase
    this.startPageLoadPhase('Initialization');
  }

  // End measuring page load time
  endPageLoad() {
    if (this.pageLoadStart) {
      const loadTime = performance.now() - this.pageLoadStart;
      this.metrics.pageLoad.push(loadTime);
      
      // Log performance warnings for slow operations
      if (loadTime > 3000) {
        console.warn(`⚠️  Page load is slow: ${loadTime.toFixed(2)}ms (>3000ms threshold)`);
      } else if (loadTime > 1000) {
        console.warn(`⚠️  Page load is moderate: ${loadTime.toFixed(2)}ms (>1000ms threshold)`);
      } else {
        console.log(`✅ Page loaded successfully in ${loadTime.toFixed(2)}ms`);
      }
      
      this.debugLog('Page load completed', {
        duration: `${loadTime.toFixed(2)}ms`,
        status: loadTime > 3000 ? 'SLOW' : loadTime > 1000 ? 'MODERATE' : 'FAST'
      });
      
      return loadTime;
    }
    return null;
  }

  // Measure API call duration with detailed tracking
  async measureApiCall(apiFunction, ...args) {
    const start = performance.now();
    const functionName = apiFunction.name || 'Anonymous API Call';
    
    this.debugLog(`API Call Started: ${functionName}`, {
      timestamp: new Date().toISOString(),
      arguments: args.length > 0 ? `${args.length} arguments` : 'No arguments'
    });
    
    try {
      const result = await apiFunction(...args);
      const duration = performance.now() - start;
      
      this.metrics.apiCalls.push({
        name: functionName,
        duration,
        timestamp: new Date().toISOString(),
        status: 'success'
      });
      
      // Log API performance warnings
      if (duration > 2000) {
        console.warn(`⚠️  Slow API call detected: ${functionName} took ${duration.toFixed(2)}ms (>2000ms threshold)`);
      } else if (duration > 500) {
        console.warn(`⚠️  Moderate API call detected: ${functionName} took ${duration.toFixed(2)}ms (>500ms threshold)`);
      } else {
        console.log(`✅ API call successful: ${functionName} completed in ${duration.toFixed(2)}ms`);
      }
      
      this.debugLog(`API Call Completed: ${functionName}`, {
        duration: `${duration.toFixed(2)}ms`,
        status: duration > 2000 ? 'SLOW' : duration > 500 ? 'MODERATE' : 'FAST',
        resultType: typeof result
      });
      
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - start;
      
      this.metrics.apiCalls.push({
        name: functionName,
        duration,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'error'
      });
      
      console.error(`❌ API call failed: ${functionName} failed after ${duration.toFixed(2)}ms`, error);
      
      this.debugLog(`API Call Failed: ${functionName}`, {
        duration: `${duration.toFixed(2)}ms`,
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  // Measure component rendering time with lifecycle tracking
  measureRender(componentName, renderFunction) {
    const start = performance.now();
    
    this.debugLog(`Component Render Started: ${componentName}`);
    
    const result = renderFunction();
    const duration = performance.now() - start;
    
    this.metrics.rendering.push({
      component: componentName,
      duration,
      timestamp: new Date().toISOString()
    });
    
    // Log rendering performance warnings
    if (duration > 50) {
      console.warn(`⚠️  Slow component render detected: ${componentName} took ${duration.toFixed(2)}ms (>50ms threshold)`);
    } else {
      console.log(`✅ Component rendered: ${componentName} in ${duration.toFixed(2)}ms`);
    }
    
    this.debugLog(`Component Render Completed: ${componentName}`, {
      duration: `${duration.toFixed(2)}ms`,
      status: duration > 50 ? 'SLOW' : 'FAST'
    });
    
    return result;
  }

  // Measure user interaction time
  measureInteraction(interactionName, interactionFunction) {
    const start = performance.now();
    
    this.debugLog(`User Interaction Started: ${interactionName}`);
    
    const result = interactionFunction();
    const duration = performance.now() - start;
    
    this.metrics.userInteractions.push({
      interaction: interactionName,
      duration,
      timestamp: new Date().toISOString()
    });
    
    // Log interaction performance warnings
    if (duration > 100) {
      console.warn(`⚠️  Slow user interaction detected: ${interactionName} took ${duration.toFixed(2)}ms (>100ms threshold)`);
    } else {
      console.log(`✅ User interaction completed: ${interactionName} in ${duration.toFixed(2)}ms`);
    }
    
    this.debugLog(`User Interaction Completed: ${interactionName}`, {
      duration: `${duration.toFixed(2)}ms`,
      status: duration > 100 ? 'SLOW' : 'FAST'
    });
    
    return result;
  }

  // Track network performance
  trackNetwork(operation, url, startTime, endTime, size = null) {
    const duration = endTime - startTime;
    
    this.metrics.network.push({
      operation,
      url,
      duration,
      size,
      timestamp: new Date().toISOString()
    });
    
    this.debugLog(`Network Operation: ${operation}`, {
      url,
      duration: `${duration.toFixed(2)}ms`,
      size: size ? `${size} bytes` : 'Unknown',
      throughput: size ? `${(size / duration * 1000).toFixed(2)} bytes/sec` : 'Unknown'
    });
    
    // Performance warnings for slow network operations
    if (duration > 2000) {
      console.warn(`⚠️  Slow network operation detected: ${operation} took ${duration.toFixed(2)}ms (>2000ms threshold)`);
    } else if (duration > 500) {
      console.warn(`⚠️  Moderate network operation detected: ${operation} took ${duration.toFixed(2)}ms (>500ms threshold)`);
    }
  }

  // Track database query performance
  trackDatabaseQuery(query, collection, startTime, endTime, resultCount = null) {
    const duration = endTime - startTime;
    
    this.metrics.database.push({
      query,
      collection,
      duration,
      resultCount,
      timestamp: new Date().toISOString()
    });
    
    // Log database performance warnings
    if (duration > 500) {
      console.warn(`⚠️  Slow database query detected: ${collection} query took ${duration.toFixed(2)}ms (>500ms threshold)`);
    } else if (duration > 100) {
      console.warn(`⚠️  Moderate database query detected: ${collection} query took ${duration.toFixed(2)}ms (>100ms threshold)`);
    } else {
      console.log(`✅ Database query completed: ${collection} in ${duration.toFixed(2)}ms`);
    }
    
    this.debugLog(`Database Query: ${collection}`, {
      query,
      duration: `${duration.toFixed(2)}ms`,
      results: resultCount !== null ? `${resultCount} results` : 'Unknown',
      status: duration > 500 ? 'SLOW' : duration > 100 ? 'MODERATE' : 'FAST'
    });
  }

  // Track component lifecycle events
  trackComponentLifecycle(componentName, lifecycleEvent, startTime, endTime) {
    const duration = endTime - startTime;
    
    this.metrics.componentLifecycle.push({
      component: componentName,
      event: lifecycleEvent,
      duration,
      timestamp: new Date().toISOString()
    });
    
    this.debugLog(`Component Lifecycle: ${componentName}.${lifecycleEvent}`, {
      duration: `${duration.toFixed(2)}ms`
    });
    
    // Performance warnings for slow lifecycle events
    if (duration > 100) {
      console.warn(`⚠️  Slow component lifecycle event detected: ${componentName}.${lifecycleEvent} took ${duration.toFixed(2)}ms (>100ms threshold)`);
    }
  }

  // Get average metrics
  getAverageMetrics() {
    return {
      pageLoad: this.metrics.pageLoad.length > 0 
        ? this.metrics.pageLoad.reduce((a, b) => a + b, 0) / this.metrics.pageLoad.length 
        : 0,
      apiCalls: this.metrics.apiCalls.length > 0
        ? this.metrics.apiCalls.reduce((a, b) => a + b.duration, 0) / this.metrics.apiCalls.length
        : 0,
      rendering: this.metrics.rendering.length > 0
        ? this.metrics.rendering.reduce((a, b) => a + b.duration, 0) / this.metrics.rendering.length
        : 0,
      userInteractions: this.metrics.userInteractions.length > 0
        ? this.metrics.userInteractions.reduce((a, b) => a + b.duration, 0) / this.metrics.userInteractions.length
        : 0,
      network: this.metrics.network.length > 0
        ? this.metrics.network.reduce((a, b) => a + b.duration, 0) / this.metrics.network.length
        : 0,
      database: this.metrics.database.length > 0
        ? this.metrics.database.reduce((a, b) => a + b.duration, 0) / this.metrics.database.length
        : 0
    };
  }

  // Get detailed metrics report
  getDetailedReport() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      averages: this.getAverageMetrics(),
      performanceEntries: performance.getEntriesByType('navigation'),
      paintTiming: performance.getEntriesByType('paint')
    };
  }

  // Comprehensive debugging method that logs all performance metrics with actionable insights
  logComprehensiveDebug() {
    console.group('🔍 === COMPREHENSIVE PERFORMANCE DEBUG REPORT ===');
    
    // Page Load Timing Analysis
    console.group('📄 Page Load Timing Analysis');
    if (this.metrics.pageLoad.length > 0) {
      const avgLoadTime = this.getAverageMetrics().pageLoad;
      console.log(`Average Page Load Time: ${avgLoadTime.toFixed(2)}ms`);
      console.log(`Status: ${avgLoadTime > 3000 ? '🔴 CRITICAL SLOW' : avgLoadTime > 1000 ? '🟡 MODERATE' : '🟢 GOOD'}`);
      
      // Detailed breakdown of recent loads
      console.log('\nRecent Page Loads:');
      this.metrics.pageLoad.slice(-5).forEach((loadTime, index) => {
        const status = loadTime > 3000 ? '🔴 SLOW' : loadTime > 1000 ? '🟡 MODERATE' : '🟢 FAST';
        console.log(`  Load ${this.metrics.pageLoad.length - 4 + index}: ${loadTime.toFixed(2)}ms ${status}`);
      });
    } else {
      console.log('No page load data recorded');
    }
    console.groupEnd();
    
    // API Performance Analysis
    console.group('📡 API Performance Analysis');
    if (this.metrics.apiCalls.length > 0) {
      const avgApiTime = this.getAverageMetrics().apiCalls;
      console.log(`Average API Response Time: ${avgApiTime.toFixed(2)}ms`);
      console.log(`Status: ${avgApiTime > 2000 ? '🔴 CRITICAL SLOW' : avgApiTime > 500 ? '🟡 MODERATE' : '🟢 GOOD'}`);
      
      // Slowest API calls
      const slowestApis = [...this.metrics.apiCalls]
        .filter(call => call.status === 'success')
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 3);
      
      if (slowestApis.length > 0) {
        console.log('\nSlowest API Calls:');
        slowestApis.forEach((api, index) => {
          const status = api.duration > 2000 ? '🔴 SLOW' : api.duration > 500 ? '🟡 MODERATE' : '🟢 FAST';
          console.log(`  ${index + 1}. ${api.name}: ${api.duration.toFixed(2)}ms ${status}`);
        });
      }
      
      // Failed API calls
      const failedApis = this.metrics.apiCalls.filter(call => call.status === 'error');
      if (failedApis.length > 0) {
        console.log('\nFailed API Calls:');
        failedApis.forEach((api, index) => {
          console.log(`  ${index + 1}. ${api.name}: ${api.error}`);
        });
      }
    } else {
      console.log('No API call data recorded');
    }
    console.groupEnd();
    
    // Component Rendering Analysis
    console.group('🖼️ Component Rendering Analysis');
    if (this.metrics.rendering.length > 0) {
      const avgRenderTime = this.getAverageMetrics().rendering;
      console.log(`Average Render Time: ${avgRenderTime.toFixed(2)}ms`);
      console.log(`Status: ${avgRenderTime > 50 ? '🔴 SLOW' : '🟢 GOOD'}`);
      
      // Slowest renders
      const slowestRenders = [...this.metrics.rendering]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5);
      
      if (slowestRenders.length > 0) {
        console.log('\nSlowest Component Renders:');
        slowestRenders.forEach((render, index) => {
          const status = render.duration > 50 ? '🔴 SLOW' : '🟢 FAST';
          console.log(`  ${index + 1}. ${render.component}: ${render.duration.toFixed(2)}ms ${status}`);
        });
      }
    } else {
      console.log('No rendering data recorded');
    }
    console.groupEnd();
    
    // Network Performance Analysis
    console.group('🌐 Network Performance Analysis');
    if (this.metrics.network.length > 0) {
      const avgNetworkTime = this.getAverageMetrics().network;
      console.log(`Average Network Time: ${avgNetworkTime.toFixed(2)}ms`);
      
      // Slowest network operations
      const slowestNetworkOps = [...this.metrics.network]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 3);
      
      if (slowestNetworkOps.length > 0) {
        console.log('\nSlowest Network Operations:');
        slowestNetworkOps.forEach((op, index) => {
          const status = op.duration > 2000 ? '🔴 SLOW' : op.duration > 500 ? '🟡 MODERATE' : '🟢 FAST';
          console.log(`  ${index + 1}. ${op.operation}: ${op.duration.toFixed(2)}ms ${status}`);
          console.log(`     URL: ${op.url}`);
          if (op.size) {
            console.log(`     Size: ${op.size} bytes`);
          }
        });
      }
    } else {
      console.log('No network data recorded');
    }
    console.groupEnd();
    
    // Database Performance Analysis
    console.group('🗄️ Database Performance Analysis');
    if (this.metrics.database.length > 0) {
      const avgDbTime = this.getAverageMetrics().database;
      console.log(`Average Database Query Time: ${avgDbTime.toFixed(2)}ms`);
      console.log(`Status: ${avgDbTime > 500 ? '🔴 CRITICAL SLOW' : avgDbTime > 100 ? '🟡 MODERATE' : '🟢 GOOD'}`);
      
      // Slowest queries
      const slowestQueries = [...this.metrics.database]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 3);
      
      if (slowestQueries.length > 0) {
        console.log('\nSlowest Database Queries:');
        slowestQueries.forEach((query, index) => {
          const status = query.duration > 500 ? '🔴 SLOW' : query.duration > 100 ? '🟡 MODERATE' : '🟢 FAST';
          console.log(`  ${index + 1}. ${query.collection}: ${query.duration.toFixed(2)}ms ${status}`);
          if (query.resultCount !== null) {
            console.log(`     Results: ${query.resultCount} records`);
          }
        });
      }
    } else {
      console.log('No database query data recorded');
    }
    console.groupEnd();
    
    // Actionable Insights
    console.group('💡 Actionable Performance Insights');
    const averages = this.getAverageMetrics();
    
    // Page load insights
    if (averages.pageLoad > 3000) {
      console.log('🚨 CRITICAL PAGE LOAD ISSUE:');
      console.log('   Average page load time is very slow (>3000ms)');
      console.log('   Recommended actions:');
      console.log('   - Check API response times');
      console.log('   - Optimize database queries');
      console.log('   - Implement code splitting');
      console.log('   - Enable lazy loading for non-critical resources');
    } else if (averages.pageLoad > 1000) {
      console.log('⚠️ PAGE LOAD WARNING:');
      console.log('   Average page load time is moderate (>1000ms)');
      console.log('   Recommended actions:');
      console.log('   - Review component rendering performance');
      console.log('   - Check for unnecessary re-renders');
      console.log('   - Optimize image assets');
    }
    
    // API insights
    if (averages.apiCalls > 2000) {
      console.log('🚨 CRITICAL API PERFORMANCE ISSUE:');
      console.log('   Average API response time is very slow (>2000ms)');
      console.log('   Recommended actions:');
      console.log('   - Add database indexes for frequently queried fields');
      console.log('   - Optimize query performance');
      console.log('   - Implement caching strategies');
    } else if (averages.apiCalls > 500) {
      console.log('⚠️ API PERFORMANCE WARNING:');
      console.log('   Average API response time is moderate (>500ms)');
      console.log('   Recommended actions:');
      console.log('   - Review database query efficiency');
      console.log('   - Check for network latency issues');
    }
    
    // Rendering insights
    if (averages.rendering > 50) {
      console.log('⚠️ RENDERING PERFORMANCE WARNING:');
      console.log('   Average component rendering time is slow (>50ms)');
      console.log('   Recommended actions:');
      console.log('   - Use React.memo for pure components');
      console.log('   - Optimize re-render triggers');
      console.log('   - Implement virtual scrolling for large lists');
    }
    
    // Database insights
    if (averages.database > 500) {
      console.log('🚨 CRITICAL DATABASE PERFORMANCE ISSUE:');
      console.log('   Average database query time is very slow (>500ms)');
      console.log('   Recommended actions:');
      console.log('   - Add database indexes for frequently queried fields');
      console.log('   - Optimize complex queries');
      console.log('   - Consider query result caching');
    } else if (averages.database > 100) {
      console.log('⚠️ DATABASE PERFORMANCE WARNING:');
      console.log('   Average database query time is moderate (>100ms)');
      console.log('   Recommended actions:');
      console.log('   - Review query execution plans');
      console.log('   - Check for missing indexes');
    }
    
    console.groupEnd();
    
    console.groupEnd(); // End comprehensive debug report
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = {
      pageLoad: [],
      apiCalls: [],
      rendering: [],
      userInteractions: [],
      network: [],
      database: [],
      componentLifecycle: []
    };
    this.pageLoadPhases = {};
    this.debugLog('Metrics cleared');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility function to measure function execution time
export function measureExecutionTime(fn, label) {
  return function(...args) {
    const start = performance.now();
    const result = fn.apply(this, args);
    const end = performance.now();
    const duration = end - start;
    
    console.log(`${label || fn.name} execution time: ${duration.toFixed(2)}ms`);
    return result;
  };
}

// Utility function to measure async function execution time
export async function measureAsyncExecutionTime(asyncFn, label) {
  return async function(...args) {
    const start = performance.now();
    const result = await asyncFn.apply(this, args);
    const end = performance.now();
    const duration = end - start;
    
    console.log(`${label || asyncFn.name} execution time: ${duration.toFixed(2)}ms`);
    return result;
  };
}

// Utility function for detailed performance tracing
export function tracePerformance(operationName, asyncOperation) {
  return async function(...args) {
    const startTime = performance.now();
    console.group(`🔍 Tracing: ${operationName}`);
    console.log(`Started at: ${new Date().toISOString()}`);
    
    try {
      const result = await asyncOperation.apply(this, args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Completed in: ${duration.toFixed(2)}ms`);
      console.log(`Status: ${duration > 1000 ? '🔴 SLOW' : duration > 500 ? '🟡 MODERATE' : '🟢 FAST'}`);
      console.groupEnd();
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`❌ Failed after: ${duration.toFixed(2)}ms`);
      console.error('Error:', error.message);
      console.groupEnd();
      
      throw error;
    }
  };
}