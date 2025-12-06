import React, { useState } from 'react';
import { ScannerView } from '../components/ScannerView';

export const OptimizedScannerDemo = () => {
  const [scanHistory, setScanHistory] = useState([]);
  const [currentStatus, setCurrentStatus] = useState('Ready to scan');

  // Handle scan completion
  const handleScanComplete = (result) => {
    console.log('Scan result:', result);
    
    // Update current status
    let statusMessage = '';
    switch (result.status) {
      case 'success':
        statusMessage = `Success: ${result.employee?.name || 'Employee'} scanned`;
        break;
      case 'already_fed':
        statusMessage = `Already fed: ${result.message}`;
        break;
      case 'not_found':
        statusMessage = `Not found: ${result.message}`;
        break;
      case 'expired':
        statusMessage = `Expired: ID has expired`;
        break;
      case 'cached':
        statusMessage = `Offline: ${result.message}`;
        break;
      default:
        statusMessage = result.message || 'Scan processed';
    }
    
    setCurrentStatus(statusMessage);
    
    // Add to history
    setScanHistory(prev => [{
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      ...result
    }, ...prev.slice(0, 9)]); // Keep only last 10 scans
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Optimized Scanner Demo</h1>
          <p className="text-gray-600 mt-2">QR & Barcode scanner with offline support</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanner View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Scanner</h2>
                <p className="text-gray-600 text-sm mt-1">Current status: {currentStatus}</p>
              </div>
              <div className="p-4">
                <ScannerView onScanComplete={handleScanComplete} />
              </div>
            </div>
          </div>

          {/* Scan History */}
          <div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Scan History</h2>
                <p className="text-gray-600 text-sm mt-1">Last 10 scans</p>
              </div>
              <div className="p-4">
                {scanHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No scans yet</p>
                    <p className="text-sm mt-1">Scan a QR code or barcode to see results</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scanHistory.map((scan) => (
                      <div 
                        key={scan.id} 
                        className={`p-3 rounded-lg border ${
                          scan.status === 'success' ? 'border-green-200 bg-green-50' :
                          scan.status === 'already_fed' ? 'border-yellow-200 bg-yellow-50' :
                          scan.status === 'not_found' ? 'border-red-200 bg-red-50' :
                          scan.status === 'cached' ? 'border-blue-200 bg-blue-50' :
                          'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {scan.employee?.name || scan.uniqueId || scan.data}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {scan.timestamp}
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            scan.status === 'success' ? 'bg-green-100 text-green-800' :
                            scan.status === 'already_fed' ? 'bg-yellow-100 text-yellow-800' :
                            scan.status === 'not_found' ? 'bg-red-100 text-red-800' :
                            scan.status === 'cached' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {scan.status}
                          </span>
                        </div>
                        {scan.message && (
                          <div className="text-sm mt-2 text-gray-600">
                            {scan.message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Features List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Features</h2>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-700">QR & Barcode scanning</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-700">Mobile optimized</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-700">Offline caching</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-700">Auto-sync when online</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-700">PWA support</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-500">✓</div>
                    <p className="ml-2 text-gray-700">Camera permission handling</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};