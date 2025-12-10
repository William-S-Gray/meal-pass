// Performance logging utility for backend services
const winston = require('winston');

// Create a logger for performance metrics
const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'performance-monitoring' },
  transports: [
    new winston.transports.File({ filename: 'logs/performance.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  performanceLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `[${timestamp}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
      })
    )
  }));
}

class PerformanceTracker {
  constructor() {
    this.timers = new Map();
    this.debugMode = process.env.PERFORMANCE_DEBUG === 'true';
  }

  // Enable or disable debug mode
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  // Log detailed debug information
  debugLog(message, data = null) {
    if (this.debugMode) {
      performanceLogger.info(`[DEBUG] ${message}`, data || {});
    }
  }

  // Start timing an operation
  start(operationId) {
    const startTime = process.hrtime();
    this.timers.set(operationId, startTime);
    
    this.debugLog(`Operation started: ${operationId}`, {
      timestamp: new Date().toISOString()
    });
  }

  // End timing an operation and log the result
  end(operationId, operationName, additionalData = {}) {
    const startTime = this.timers.get(operationId);
    if (!startTime) {
      performanceLogger.warn(`Timer not found for operation: ${operationId}`);
      return null;
    }

    const endTime = process.hrtime(startTime);
    const durationMs = (endTime[0] * 1000) + (endTime[1] / 1000000);
    
    // Remove the timer
    this.timers.delete(operationId);
    
    // Log performance warnings for slow operations
    let performanceStatus = 'FAST';
    if (durationMs > 2000) {
      performanceLogger.warn(`SLOW OPERATION DETECTED: ${operationName} took ${durationMs.toFixed(2)}ms (>2000ms threshold)`);
      performanceStatus = 'SLOW';
    } else if (durationMs > 500) {
      performanceLogger.warn(`MODERATE OPERATION DETECTED: ${operationName} took ${durationMs.toFixed(2)}ms (>500ms threshold)`);
      performanceStatus = 'MODERATE';
    } else {
      performanceLogger.info(`Operation completed: ${operationName} took ${durationMs.toFixed(2)}ms`);
    }
    
    // Log the performance metric
    performanceLogger.info('Operation performance', {
      operation: operationName,
      duration_ms: durationMs,
      status: performanceStatus,
      ...additionalData
    });
    
    this.debugLog(`Operation completed: ${operationId}`, {
      operation: operationName,
      duration_ms: durationMs,
      status: performanceStatus,
      ...additionalData
    });
    
    return durationMs;
  }

  // Log a database query performance with detailed analysis
  logDbQuery(collection, query, durationMs, resultCount = null, additionalInfo = {}) {
    // Performance analysis
    let queryStatus = 'FAST';
    if (durationMs > 500) {
      performanceLogger.warn(`SLOW DATABASE QUERY DETECTED: ${collection} query took ${durationMs.toFixed(2)}ms (>500ms threshold)`);
      queryStatus = 'SLOW';
    } else if (durationMs > 100) {
      performanceLogger.warn(`MODERATE DATABASE QUERY DETECTED: ${collection} query took ${durationMs.toFixed(2)}ms (>100ms threshold)`);
      queryStatus = 'MODERATE';
    } else {
      performanceLogger.info(`Database query completed: ${collection} query took ${durationMs.toFixed(2)}ms`);
    }
    
    performanceLogger.info('Database query performance', {
      collection,
      query: JSON.stringify(query),
      duration_ms: durationMs,
      result_count: resultCount,
      status: queryStatus,
      ...additionalInfo
    });
    
    this.debugLog(`Database query logged`, {
      collection,
      query: JSON.stringify(query),
      duration_ms: durationMs,
      result_count: resultCount,
      status: queryStatus,
      ...additionalInfo
    });
    
    // Provide actionable insights for slow queries
    if (durationMs > 500) {
      performanceLogger.info('ACTIONABLE INSIGHTS FOR SLOW DATABASE QUERY', {
        recommendation: 'Consider adding indexes for frequently queried fields',
        collection,
        query_analysis: 'Review query execution plan for optimization opportunities',
        optimization_suggestions: [
          'Add compound indexes for multi-field queries',
          'Consider query result caching for frequently accessed data',
          'Review data modeling for better query performance'
        ]
      });
    } else if (durationMs > 100) {
      performanceLogger.info('OPTIMIZATION SUGGESTIONS FOR MODERATE DATABASE QUERY', {
        recommendation: 'Review query efficiency and consider indexing',
        collection,
        suggestions: [
          'Verify indexes are being used effectively',
          'Consider limiting result sets with pagination',
          'Review query complexity for simplification'
        ]
      });
    }
  }

  // Log an API endpoint performance with detailed analysis
  logApiEndpoint(method, path, durationMs, statusCode, additionalInfo = {}) {
    // Performance analysis
    let endpointStatus = 'FAST';
    if (durationMs > 2000) {
      performanceLogger.warn(`SLOW API ENDPOINT DETECTED: ${method} ${path} took ${durationMs.toFixed(2)}ms (>2000ms threshold)`);
      endpointStatus = 'SLOW';
    } else if (durationMs > 500) {
      performanceLogger.warn(`MODERATE API ENDPOINT DETECTED: ${method} ${path} took ${durationMs.toFixed(2)}ms (>500ms threshold)`);
      endpointStatus = 'MODERATE';
    } else {
      performanceLogger.info(`API endpoint completed: ${method} ${path} took ${durationMs.toFixed(2)}ms`);
    }
    
    performanceLogger.info('API endpoint performance', {
      method,
      path,
      duration_ms: durationMs,
      status_code: statusCode,
      status: endpointStatus,
      ...additionalInfo
    });
    
    this.debugLog(`API endpoint logged`, {
      method,
      path,
      duration_ms: durationMs,
      status_code: statusCode,
      status: endpointStatus,
      ...additionalInfo
    });
    
    // Provide actionable insights for slow endpoints
    if (durationMs > 2000) {
      performanceLogger.info('ACTIONABLE INSIGHTS FOR SLOW API ENDPOINT', {
        recommendation: 'Critical performance issue requiring immediate attention',
        endpoint: `${method} ${path}`,
        optimization_suggestions: [
          'Implement database query optimization',
          'Add caching for frequently accessed data',
          'Consider database connection pooling',
          'Review and optimize business logic complexity',
          'Implement request batching for multiple operations'
        ]
      });
    } else if (durationMs > 500) {
      performanceLogger.info('OPTIMIZATION SUGGESTIONS FOR MODERATE API ENDPOINT', {
        recommendation: 'Performance could be improved',
        endpoint: `${method} ${path}`,
        suggestions: [
          'Review database query performance',
          'Consider implementing response compression',
          'Optimize data serialization/deserialization',
          'Implement more aggressive caching strategies'
        ]
      });
    }
  }

  // Log cache hit/miss with detailed analysis
  logCache(operation, key, hit, durationMs = null, additionalInfo = {}) {
    const cacheStatus = hit ? 'HIT' : 'MISS';
    
    if (!hit) {
      performanceLogger.warn(`CACHE MISS DETECTED: ${operation} for key ${key}`);
    } else {
      performanceLogger.info(`Cache hit: ${operation} for key ${key}`);
    }
    
    performanceLogger.info('Cache operation', {
      operation,
      key,
      hit,
      status: cacheStatus,
      duration_ms: durationMs,
      ...additionalInfo
    });
    
    this.debugLog(`Cache operation logged`, {
      operation,
      key,
      hit,
      status: cacheStatus,
      duration_ms: durationMs,
      ...additionalInfo
    });
    
    // Provide insights for cache misses
    if (!hit) {
      performanceLogger.info('CACHE MISS ANALYSIS', {
        recommendation: 'Consider implementing or optimizing caching strategy',
        key,
        suggestions: [
          'Implement Redis or in-memory caching for frequently accessed data',
          'Review cache expiration policies',
          'Consider pre-warming cache with frequently accessed data',
          'Analyze access patterns to optimize cache keys'
        ]
      });
    }
  }
  
  // Log network performance
  logNetwork(operation, url, durationMs, size = null, additionalInfo = {}) {
    performanceLogger.info('Network operation', {
      operation,
      url,
      duration_ms: durationMs,
      size_bytes: size,
      throughput_bps: size ? (size / (durationMs / 1000)).toFixed(2) : null,
      ...additionalInfo
    });
    
    this.debugLog(`Network operation logged`, {
      operation,
      url,
      duration_ms: durationMs,
      size_bytes: size,
      throughput_bps: size ? (size / (durationMs / 1000)).toFixed(2) : null,
      ...additionalInfo
    });
    
    // Performance analysis for network operations
    if (durationMs > 2000) {
      performanceLogger.warn(`SLOW NETWORK OPERATION DETECTED: ${operation} took ${durationMs.toFixed(2)}ms (>2000ms threshold)`);
      performanceLogger.info('NETWORK PERFORMANCE INSIGHTS', {
        recommendation: 'Investigate network latency or external service performance',
        operation,
        url,
        suggestions: [
          'Check network connectivity and bandwidth',
          'Review external service performance',
          'Consider implementing retry mechanisms with exponential backoff',
          'Implement circuit breaker pattern for external dependencies'
        ]
      });
    } else if (durationMs > 500) {
      performanceLogger.warn(`MODERATE NETWORK OPERATION DETECTED: ${operation} took ${durationMs.toFixed(2)}ms (>500ms threshold)`);
      performanceLogger.info('NETWORK OPTIMIZATION SUGGESTIONS', {
        recommendation: 'Consider network optimization strategies',
        operation,
        url,
        suggestions: [
          'Implement connection pooling for external services',
          'Consider CDN for static assets',
          'Review payload sizes and implement compression',
          'Optimize API response formats (e.g., use Protobuf instead of JSON for large payloads)'
        ]
      });
    }
  }
  
  // Log detailed performance analysis
  logAnalysis(title, metrics) {
    performanceLogger.info(`Performance Analysis: ${title}`, metrics);
    
    // Provide actionable insights based on metrics
    const insights = [];
    
    if (metrics.avg_duration_ms > 2000) {
      insights.push('CRITICAL: Average operation time is very slow (>2000ms)');
      insights.push('Recommended actions:');
      insights.push('- Add database indexes for frequently queried fields');
      insights.push('- Optimize query performance');
      insights.push('- Implement caching strategies');
    } else if (metrics.avg_duration_ms > 500) {
      insights.push('WARNING: Average operation time is moderate (>500ms)');
      insights.push('Recommended actions:');
      insights.push('- Review database query efficiency');
      insights.push('- Check for network latency issues');
    }
    
    if (insights.length > 0) {
      performanceLogger.info(`Performance Insights: ${title}`, { insights });
    }
    
    this.debugLog(`Performance analysis completed`, { title, metrics });
  }
  
  // Comprehensive debugging method that provides detailed performance insights
  logComprehensiveDebug(operationName, metrics) {
    performanceLogger.info(`=== COMPREHENSIVE PERFORMANCE DEBUG FOR: ${operationName} ===`);
    
    // Log detailed metrics
    performanceLogger.info('DETAILED METRICS', metrics);
    
    // Performance categorization
    const performanceCategory = metrics.duration_ms > 2000 ? 'CRITICAL_SLOW' : 
                              metrics.duration_ms > 500 ? 'MODERATE' : 'GOOD';
    
    performanceLogger.info('PERFORMANCE CATEGORY', { category: performanceCategory });
    
    // Specific recommendations based on operation type
    if (operationName.includes('Database') || operationName.includes('Query')) {
      if (metrics.duration_ms > 500) {
        performanceLogger.info('DATABASE-SPECIFIC RECOMMENDATIONS', {
          recommendations: [
            'Add indexes for frequently queried fields',
            'Review query execution plans',
            'Consider query result caching',
            'Optimize data modeling for better query performance',
            'Implement database connection pooling'
          ]
        });
      }
    } else if (operationName.includes('API') || operationName.includes('Endpoint')) {
      if (metrics.duration_ms > 500) {
        performanceLogger.info('API-SPECIFIC RECOMMENDATIONS', {
          recommendations: [
            'Implement response caching',
            'Optimize database queries in endpoint',
            'Consider request batching for multiple operations',
            'Implement pagination for large datasets',
            'Review middleware performance impact'
          ]
        });
      }
    } else if (operationName.includes('Cache')) {
      if (!metrics.hit) {
        performanceLogger.info('CACHE-SPECIFIC RECOMMENDATIONS', {
          recommendations: [
            'Implement Redis or in-memory caching',
            'Review cache expiration policies',
            'Consider pre-warming cache with frequently accessed data',
            'Analyze access patterns to optimize cache keys'
          ]
        });
      }
    }
    
    this.debugLog(`Comprehensive debug logged for: ${operationName}`, metrics);
  }
}

// Export singleton instance
const performanceTracker = new PerformanceTracker();

module.exports = {
  performanceLogger,
  performanceTracker
};