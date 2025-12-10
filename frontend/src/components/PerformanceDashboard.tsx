import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { performanceMonitor } from '@/utils/performance-monitor';

interface MetricDetail {
  name: string;
  duration: number;
  timestamp: string;
  status: 'FAST' | 'MODERATE' | 'SLOW';
  error?: string;
}

interface ApiCallMetric {
  name: string;
  duration: number;
  timestamp: string;
  status: 'FAST' | 'MODERATE' | 'SLOW';
  error?: string;
}

interface RenderMetric {
  component: string;
  duration: number;
  timestamp: string;
}

interface InteractionMetric {
  interaction: string;
  duration: number;
  timestamp: string;
}

interface NetworkMetric {
  operation: string;
  url: string;
  duration: number;
  size: number | null;
  timestamp: string;
}

interface DatabaseMetric {
  query: string;
  collection: string;
  duration: number;
  resultCount: number | null;
  timestamp: string;
}

// Define the structure of our performance metrics
interface PerformanceMetrics {
  pageLoad: number[];
  apiCalls: Array<{
    name: string;
    duration: number;
    timestamp: string;
    status: string;
    error?: string;
  }>;
  rendering: Array<{
    component: string;
    duration: number;
    timestamp: string;
  }>;
  userInteractions: Array<{
    interaction: string;
    duration: number;
    timestamp: string;
  }>;
  network: Array<{
    operation: string;
    url: string;
    duration: number;
    size: number | null;
    timestamp: string;
  }>;
  database: Array<{
    query: string;
    collection: string;
    duration: number;
    resultCount: number | null;
    timestamp: string;
  }>;
  componentLifecycle: Array<{
    component: string;
    event: string;
    duration: number;
    timestamp: string;
  }>;
}

// Define the structure for average metrics
interface AverageMetrics {
  pageLoad: number;
  apiCalls: number;
  rendering: number;
  userInteractions: number;
  network: number;
  database: number;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<{
    pageLoad: MetricDetail[];
    apiCalls: ApiCallMetric[];
    rendering: RenderMetric[];
    userInteractions: InteractionMetric[];
    network: NetworkMetric[];
    database: DatabaseMetric[];
  }>({
    pageLoad: [],
    apiCalls: [],
    rendering: [],
    userInteractions: [],
    network: [],
    database: []
  });
  
  const [averages, setAverages] = useState<AverageMetrics>({
    pageLoad: 0,
    apiCalls: 0,
    rendering: 0,
    userInteractions: 0,
    network: 0,
    database: 0
  });

  useEffect(() => {
    // Get initial metrics
    updateMetrics();
    
    // Update metrics every 2 seconds
    const interval = setInterval(updateMetrics, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const updateMetrics = (): void => {
    // Access metrics with proper typing
    const perfMonitor = performanceMonitor as unknown as { metrics: PerformanceMetrics };
    const perfMetrics = perfMonitor.metrics;
    const avgMetrics = performanceMonitor.getAverageMetrics() as AverageMetrics;
    
    setMetrics({
      pageLoad: perfMetrics.pageLoad.map((duration, index) => ({
        name: `Page Load ${index + 1}`,
        duration,
        timestamp: new Date().toISOString(),
        status: duration > 3000 ? 'SLOW' : duration > 1000 ? 'MODERATE' : 'FAST'
      })),
      apiCalls: perfMetrics.apiCalls.map((call) => ({
        name: call.name,
        duration: call.duration,
        timestamp: call.timestamp,
        status: call.duration > 2000 ? 'SLOW' : call.duration > 500 ? 'MODERATE' : 'FAST',
        error: call.error
      })),
      rendering: perfMetrics.rendering.map((render) => ({
        component: render.component,
        duration: render.duration,
        timestamp: render.timestamp
      })),
      userInteractions: perfMetrics.userInteractions.map((interaction) => ({
        interaction: interaction.interaction,
        duration: interaction.duration,
        timestamp: interaction.timestamp
      })),
      network: perfMetrics.network.map((net) => ({
        operation: net.operation,
        url: net.url,
        duration: net.duration,
        size: net.size,
        timestamp: net.timestamp
      })),
      database: perfMetrics.database.map((db) => ({
        query: db.query,
        collection: db.collection,
        duration: db.duration,
        resultCount: db.resultCount,
        timestamp: db.timestamp
      }))
    });
    
    setAverages(avgMetrics);
  };

  const getStatusColor = (status: string): 'destructive' | 'secondary' | 'default' => {
    switch (status) {
      case 'SLOW': return 'destructive';
      case 'MODERATE': return 'default'; // Using 'default' instead of 'warning' which isn't available
      case 'FAST': return 'secondary';
      default: return 'secondary';
    }
  };

  const clearMetrics = (): void => {
    performanceMonitor.clearMetrics();
    updateMetrics();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Performance Dashboard</h1>
        <Button onClick={clearMetrics} variant="outline">Clear Metrics</Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Page Load</CardTitle>
            <CardDescription>Average time to load pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averages.pageLoad.toFixed(2)}ms</div>
            <Badge variant={getStatusColor(averages.pageLoad > 3000 ? 'SLOW' : averages.pageLoad > 1000 ? 'MODERATE' : 'FAST')}>
              {averages.pageLoad > 3000 ? 'SLOW' : averages.pageLoad > 1000 ? 'MODERATE' : 'FAST'}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>API Calls</CardTitle>
            <CardDescription>Average API response time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averages.apiCalls.toFixed(2)}ms</div>
            <Badge variant={getStatusColor(averages.apiCalls > 2000 ? 'SLOW' : averages.apiCalls > 500 ? 'MODERATE' : 'FAST')}>
              {averages.apiCalls > 2000 ? 'SLOW' : averages.apiCalls > 500 ? 'MODERATE' : 'FAST'}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Rendering</CardTitle>
            <CardDescription>Average component render time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averages.rendering.toFixed(2)}ms</div>
            <Badge variant={getStatusColor(averages.rendering > 50 ? 'SLOW' : 'FAST')}>
              {averages.rendering > 50 ? 'SLOW' : 'FAST'}
            </Badge>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Calls */}
        <Card>
          <CardHeader>
            <CardTitle>API Calls</CardTitle>
            <CardDescription>Detailed API performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {metrics.apiCalls.length > 0 ? (
                <div className="space-y-2">
                  {metrics.apiCalls.map((call, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">{call.name}</div>
                        <div className="text-sm text-muted-foreground">{new Date(call.timestamp).toLocaleTimeString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{call.duration.toFixed(2)}ms</span>
                        <Badge variant={getStatusColor(call.status)}>{call.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No API calls recorded</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Component Rendering */}
        <Card>
          <CardHeader>
            <CardTitle>Component Rendering</CardTitle>
            <CardDescription>Component render performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {metrics.rendering.length > 0 ? (
                <div className="space-y-2">
                  {metrics.rendering.map((render, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">{render.component}</div>
                        <div className="text-sm text-muted-foreground">{new Date(render.timestamp).toLocaleTimeString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{render.duration.toFixed(2)}ms</span>
                        <Badge variant={getStatusColor(render.duration > 50 ? 'SLOW' : 'FAST')}>
                          {render.duration > 50 ? 'SLOW' : 'FAST'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No rendering metrics recorded</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Actionable Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Actionable Insights</CardTitle>
          <CardDescription>Performance recommendations based on current metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {averages.pageLoad > 3000 && (
              <div className="p-4 border border-destructive rounded">
                <h3 className="font-semibold text-destructive">🚨 Critical Page Load Issue</h3>
                <p className="mt-2">Average page load time is very slow ({averages.pageLoad.toFixed(2)}ms &gt; 3000ms threshold)</p>
                <ul className="mt-2 list-disc list-inside">
                  <li>Check API response times</li>
                  <li>Optimize database queries</li>
                  <li>Implement code splitting</li>
                  <li>Enable lazy loading for non-critical resources</li>
                </ul>
              </div>
            )}
            
            {averages.apiCalls > 2000 && (
              <div className="p-4 border border-destructive rounded">
                <h3 className="font-semibold text-destructive">🚨 Critical API Performance Issue</h3>
                <p className="mt-2">Average API response time is very slow ({averages.apiCalls.toFixed(2)}ms &gt; 2000ms threshold)</p>
                <ul className="mt-2 list-disc list-inside">
                  <li>Add database indexes for frequently queried fields</li>
                  <li>Optimize query performance</li>
                  <li>Implement caching strategies</li>
                </ul>
              </div>
            )}
            
            {averages.rendering > 50 && (
              <div className="p-4 border border-yellow-500 rounded">
                <h3 className="font-semibold text-yellow-500">⚠️ Rendering Performance Warning</h3>
                <p className="mt-2">Average component rendering time is slow ({averages.rendering.toFixed(2)}ms &gt; 50ms threshold)</p>
                <ul className="mt-2 list-disc list-inside">
                  <li>Use React.memo for pure components</li>
                  <li>Optimize re-render triggers</li>
                  <li>Implement virtual scrolling for large lists</li>
                </ul>
              </div>
            )}
            
            {(averages.pageLoad <= 3000 && averages.apiCalls <= 2000 && averages.rendering <= 50) && (
              <div className="p-4 border border-green-500 rounded">
                <h3 className="font-semibold text-green-500">✅ Good Performance</h3>
                <p className="mt-2">All performance metrics are within acceptable ranges</p>
                <ul className="mt-2 list-disc list-inside">
                  <li>Continue monitoring for performance regressions</li>
                  <li>Consider implementing advanced optimizations for further improvements</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}