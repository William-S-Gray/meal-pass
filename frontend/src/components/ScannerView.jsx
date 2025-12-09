import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCameraAccess } from '@/hooks/useCameraAccess';
import { useScanner } from '@/hooks/useScanner';
import { usePWAStorage } from '@/hooks/usePWAStorage';
import { ScanOverlay } from './ScanOverlay';
import { scanQRCode, getEmployeeByUid } from '@/lib/api';

// Types

export const ScannerView = ({ onScanComplete }) => {
  console.log('=== SCANNER VIEW COMPONENT MOUNTING ===');
  
  const videoRef = useRef(null);
  const [scanMode, setScanMode] = useState('both'); // 'qr', 'barcode', or 'both'
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [manualEntryId, setManualEntryId] = useState(''); // State for manual entry
  const [isManualProcessing, setIsManualProcessing] = useState(false); // State for manual entry processing
  const operationLockRef = useRef(false); // Prevent concurrent scanning operations
  const recentlyProcessedCodesRef = useRef(new Set()); // Track recently processed codes for deduplication
  const cleanupTimeoutsRef = useRef(new Map()); // Track all cleanup timeouts to prevent memory leaks
  
  // Expose a test function to window for manual testing
  useEffect(() => {
    console.log('=== SCANNER VIEW COMPONENT MOUNTED ===');
    
    window.testCameraInit = async () => {
      console.log('=== MANUAL CAMERA INITIALIZATION TEST ===');
      await initiateScanning();
    };
    
    return () => {
      console.log('=== SCANNER VIEW COMPONENT UNMOUNTING ===');
      delete window.testCameraInit;
      // Clear the set to prevent memory leaks
      recentlyProcessedCodesRef.current.clear();
    };
  }, []);

  // Use our custom hooks
  const { 
    cameraState, 
    isCameraSupported, 
    requestCameraAccess, 
    startCamera, 
    stopCamera, 
    clearVideoSource 
  } = useCameraAccess();
  
  // Handle scan result from scanner hook
  const handleScanResult = useCallback(async (result) => {
    // Prevent processing if already processing or if operation is locked
    if (isProcessing || operationLockRef.current) {
      console.log('Already processing a scan, ignoring duplicate');
      return;
    }
    
    // Check if we've recently processed this exact code
    if (recentlyProcessedCodesRef.current.has(result.data)) {
      console.log('Recently processed this code, ignoring duplicate');
      return;
    }
    
    // Set operation lock immediately
    operationLockRef.current = true;
    
    // Add to recently processed codes set
    recentlyProcessedCodesRef.current.add(result.data);
    // Track cleanup timeout ID for proper cleanup
    const cleanupTimeoutId = setTimeout(() => {
      recentlyProcessedCodesRef.current.delete(result.data);
    }, 10000);
    
    setIsProcessing(true);
    setScanResult(result);
    
    try {
      // Try to send to backend
      const response = await scanQRCode(result.data, 'pwa-scanner', result.type);
      
      // Handle different response statuses
      if (response.status === 'success') {
        // Success - notify parent component
        if (onScanComplete) {
          onScanComplete({
            ...response,
            employee: response.employee,
            uniqueId: result.data
          });
        }
      } else if (response.status === 'already_fed') {
        // Already fed today
        if (onScanComplete) {
          onScanComplete({
            status: 'already_fed',
            message: response.message,
            uniqueId: result.data
          });
        }
      } else if (response.status === 'not_found') {
        // Employee not found
        if (onScanComplete) {
          onScanComplete({
            status: 'not_found',
            message: response.message,
            uniqueId: result.data
          });
        }
      } else {
        // Other error
        if (onScanComplete) {
          onScanComplete({
            status: 'error',
            message: response.message || 'Scan processing failed',
            uniqueId: result.data
          });
        }
      }
    } catch (error) {
      console.error('Scan processing error:', error);
      
      // If offline, cache the scan for later sync
      if (!storageState.isOnline) {
        const cachedScan = cacheScan({
          uniqueId: result.data,
          name: 'Unknown Employee',
          timestamp: Date.now(),
          synced: false
        });
        
        if (cachedScan) {
          // Notify parent that scan was cached
          if (onScanComplete) {
            onScanComplete({
              status: 'cached',
              message: 'Scan saved locally. Will sync when online.',
              uniqueId: result.data,
              cachedId: cachedScan.id
            });
          }
        }
      } else {
        // Online but still failed
        if (onScanComplete) {
          onScanComplete({
            status: 'error',
            message: error.message || 'Failed to process scan',
            uniqueId: result.data
          });
        }
      }
    } finally {
      setIsProcessing(false);
      // Release operation lock
      operationLockRef.current = false;
      
      // Auto-hide result after delay
      const resultTimeoutId = setTimeout(() => {
        setScanResult(null);
      }, 3000);
      
      // Store timeout IDs for cleanup
      if (!cleanupTimeoutsRef.current) {
        cleanupTimeoutsRef.current = new Map();
      }
      cleanupTimeoutsRef.current.set('result', resultTimeoutId);
      cleanupTimeoutsRef.current.set(`code-${result.data}`, cleanupTimeoutId);
    }
  }, [isProcessing, onScanComplete, storageState.isOnline]);
  
  // Use scanner hook with proper dependencies
  const { 
    scannerState, 
    startScanning, 
    stopScanning 
  } = useScanner(
    videoRef.current,
    handleScanResult,
    scanMode
  );

  const { 
    storageState, 
    cacheScan, 
    syncPendingScans 
  } = usePWAStorage();

  // Start scanning process
  const initiateScanning = async () => {
    console.log('=== INITIATE SCANNING PROCESS STARTED ===');
    console.log('Current state:', {
      isScanning,
      showRetry,
      cameraState,
      scannerState
    });
    
    // Prevent concurrent scanning operations
    if (operationLockRef.current) {
      console.log('Scanning operation already in progress, skipping...');
      return;
    }
    
    if (isScanning) {
      console.log('Already scanning, returning early');
      return;
    }
    
    // Set operation lock
    operationLockRef.current = true;
    setIsScanning(true);
    setShowRetry(false);
    console.log('Set isScanning to true');
    
    try {
      console.log('Step 1: Requesting camera access...');
      // Request camera access first
      const hasAccess = await requestCameraAccess();
      console.log('Step 1 Result - Camera access:', hasAccess);
      
      if (!hasAccess) {
        console.log('Camera access denied, showing retry button');
        setShowRetry(true);
        return;
      }
      
      console.log('Step 2: Starting camera with video element...');
      console.log('Video element reference:', videoRef.current);
      if (!videoRef.current) {
        console.error('CRITICAL ERROR: Video element is NULL!');
      }
      
      // Start camera
      const cameraStarted = await startCamera(videoRef.current);
      console.log('Step 2 Result - Camera started:', cameraStarted);
      
      if (!cameraStarted) {
        console.log('Camera failed to start, showing retry button');
        setShowRetry(true);
        return;
      }
      
      console.log('Step 3: Starting scanning process...');
      // Start scanning
      const scanningStarted = await startScanning();
      console.log('Step 3 Result - Scanning started:', scanningStarted);
      
      console.log('=== INITIATE SCANNING PROCESS COMPLETED SUCCESSFULLY ===');
    } catch (error) {
      console.error('=== INITIATE SCANNING PROCESS FAILED ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      setShowRetry(true);
    } finally {
      // Release operation lock
      operationLockRef.current = false;
    }
  };

  // Stop scanning process
  const stopScanningProcess = () => {
    console.log('=== STOP SCANNING PROCESS STARTED ===');
    // Release operation lock when stopping
    operationLockRef.current = false;
    // Clear recently processed codes
    recentlyProcessedCodesRef.current.clear();
    // Clear all stored timeouts
    if (cleanupTimeoutsRef.current) {
      cleanupTimeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      cleanupTimeoutsRef.current.clear();
    }
    stopScanning();
    stopCamera();
    clearVideoSource(videoRef.current);
    setIsScanning(false);
    setScanResult(null);
    console.log('=== STOP SCANNING PROCESS COMPLETED ===');
  };

  // Retry scanning
  const retryScanning = async () => {
    console.log('=== RETRY SCANNING PROCESS STARTED ===');
    stopScanningProcess();
    
    // Wait a bit for cleanup
    const retryTimeoutId = setTimeout(() => {
      console.log('Initiating retry after cleanup...');
      initiateScanning();
    }, 500);
    
    // Store timeout ID for cleanup
    if (!cleanupTimeoutsRef.current) {
      cleanupTimeoutsRef.current = new Map();
    }
    cleanupTimeoutsRef.current.set('retry', retryTimeoutId);
  };

  // Handle manual entry submission
  const handleManualEntrySubmit = async (e) => {
    e.preventDefault();
    if (!manualEntryId.trim()) return;
    
    console.log('=== MANUAL ENTRY SUBMITTING ===', manualEntryId);
    
    // Prevent concurrent manual entry operations
    if (isManualProcessing || operationLockRef.current) {
      console.log('Manual entry already in progress, ignoring');
      return;
    }
    
    // Set operation lock immediately
    operationLockRef.current = true;
    
    // Check if we've recently processed this exact code manually
    if (recentlyProcessedCodesRef.current.has(manualEntryId.trim())) {
      console.log('Recently processed this code manually, ignoring duplicate');
      operationLockRef.current = false; // Release lock
      return;
    }
    
    // Add to recently processed codes set
    recentlyProcessedCodesRef.current.add(manualEntryId.trim());
    // Track cleanup timeout ID for proper cleanup
    const cleanupTimeoutId = setTimeout(() => {
      recentlyProcessedCodesRef.current.delete(manualEntryId.trim());
    }, 10000);
    
    setIsManualProcessing(true);
    
    try {
      // First, validate the employee ID against the database
      const employee = await getEmployeeByUid(manualEntryId.trim());
      
      if (!employee) {
        // Employee not found
        console.log('Employee not found for ID:', manualEntryId);
        if (onScanComplete) {
          onScanComplete({
            status: 'not_found',
            message: 'Employee not found',
            uniqueId: manualEntryId.trim()
          });
        }
        return;
      }
      
      // Employee found, now process the scan
      console.log('Employee found:', employee);
      const response = await scanQRCode(manualEntryId.trim(), 'manual-entry', 'manual');
      
      // Handle different response statuses
      if (response.status === 'success') {
        // Success - notify parent component with employee data
        if (onScanComplete) {
          onScanComplete({
            ...response,
            employee: employee,
            uniqueId: manualEntryId.trim()
          });
        }
      } else if (response.status === 'already_fed') {
        // Already fed today
        if (onScanComplete) {
          onScanComplete({
            status: 'already_fed',
            message: response.message,
            uniqueId: manualEntryId.trim(),
            employee: employee
          });
        }
      } else if (response.status === 'not_found') {
        // Employee not found (shouldn't happen here since we already checked)
        if (onScanComplete) {
          onScanComplete({
            status: 'not_found',
            message: response.message,
            uniqueId: manualEntryId.trim()
          });
        }
      } else {
        // Other error
        if (onScanComplete) {
          onScanComplete({
            status: 'error',
            message: response.message || 'Scan processing failed',
            uniqueId: manualEntryId.trim()
          });
        }
      }
    } catch (error) {
      console.error('Manual entry processing error:', error);
      if (onScanComplete) {
        onScanComplete({
          status: 'error',
          message: error.message || 'Failed to process manual entry',
          uniqueId: manualEntryId.trim()
        });
      }
    } finally {
      setIsManualProcessing(false);
      // Release operation lock
      operationLockRef.current = false;
      // Clear the input field
      setManualEntryId('');
      
      // Store timeout ID for cleanup
      if (!cleanupTimeoutsRef.current) {
        cleanupTimeoutsRef.current = new Map();
      }
      cleanupTimeoutsRef.current.set(`manual-${manualEntryId.trim()}`, cleanupTimeoutId);
    }
  };

  // Sync pending scans when coming online
  useEffect(() => {
    if (storageState.isOnline && storageState.pendingSyncCount > 0) {
      syncPendingScans(async (uniqueId) => {
        try {
          const response = await scanQRCode(uniqueId, 'pwa-offline-sync', 'scan');
          return response.status === 'success';
        } catch (error) {
          console.error('Failed to sync scan:', error);
          return false;
        }
      });
    }
  }, [storageState.isOnline, storageState.pendingSyncCount, syncPendingScans]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all stored timeouts
      if (cleanupTimeoutsRef.current) {
        cleanupTimeoutsRef.current.forEach((timeoutId) => {
          clearTimeout(timeoutId);
        });
        cleanupTimeoutsRef.current.clear();
      }
      stopScanningProcess();
    };
  }, []);

  // Initial start - wait for video element to be mounted
  useEffect(() => {
    // Only auto-start if we haven't started scanning yet
    if (!isScanning) {
      // Wait a tick to ensure the video element is mounted
      const timer = setTimeout(() => {
        initiateScanning();
      }, 100);
      
      // Store timeout ID for cleanup
      if (!cleanupTimeoutsRef.current) {
        cleanupTimeoutsRef.current = new Map();
      }
      cleanupTimeoutsRef.current.set('initial', timer);
      
      // Return focus to document for better mobile experience
      document.focus();
      
      // Cleanup timer
      return () => clearTimeout(timer);
    }
  }, [isScanning]); // Add isScanning as dependency

  return (
    <div className="scanner-view w-full max-w-md mx-auto p-4">
      <div className="scanner-container relative bg-black rounded-lg overflow-hidden">
        {/* Video element for camera */}
        <video
          ref={videoRef}
          className="w-full h-auto max-h-[70vh] object-cover"
          playsInline
          muted
          autoPlay
        />
        
        {/* Scan overlay */}
        <ScanOverlay 
          status={scannerState.status}
          result={scanResult}
          isProcessing={isProcessing}
          cameraState={cameraState}
        />
        
        {/* Scanner controls */}
        <div className="scanner-controls absolute bottom-0 left-0 right-0 bg-black/70 p-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                console.log('=== STOP BUTTON CLICKED ===');
                stopScanningProcess();
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50"
              disabled={!isScanning}
            >
              Stop
            </button>
            
            <div className="text-white text-center">
              {isScanning ? (
                <span className="flex items-center">
                  <span className="flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative h-3 w-3 rounded-full bg-green-500"></span>
                  </span>
                  Scanning...
                </span>
              ) : (
                <span>Ready</span>
              )}
            </div>
            
            <button
              onClick={() => {
                console.log('=== RETRY BUTTON CLICKED ===');
                retryScanning();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
              disabled={isScanning}
            >
              Retry
            </button>
          </div>
          
          {/* Mode selector */}
          <div className="mt-3 flex justify-center space-x-2">
            <button
              onClick={() => {
                console.log('=== QR MODE BUTTON CLICKED ===');
                setScanMode('qr');
              }}
              className={`px-3 py-1 text-xs rounded ${
                scanMode === 'qr' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              QR Only
            </button>
            <button
              onClick={() => {
                console.log('=== BARCODE MODE BUTTON CLICKED ===');
                setScanMode('barcode');
              }}
              className={`px-3 py-1 text-xs rounded ${
                scanMode === 'barcode' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              Barcode Only
            </button>
            <button
              onClick={() => {
                console.log('=== BOTH MODE BUTTON CLICKED ===');
                setScanMode('both');
              }}
              className={`px-3 py-1 text-xs rounded ${
                scanMode === 'both' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              Both
            </button>
          </div>
        </div>
      </div>
      
      {/* Status indicators */}
      <div className="mt-4 text-center">
        {storageState.isOnline ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx={4} cy={4} r={3} />
            </svg>
            Online
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <svg className="mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx={4} cy={4} r={3} />
            </svg>
            Offline - {storageState.pendingSyncCount} pending
          </span>
        )}
      </div>
      
      {/* Error display */}
      {(cameraState.status === 'denied' || cameraState.status === 'error') && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          <div className="font-medium">Camera Access Denied</div>
          <div className="text-sm">{cameraState.errorMessage}</div>
          <button
            onClick={() => {
              console.log('=== GRANT PERMISSION BUTTON CLICKED ===');
              retryScanning();
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Grant Permission
          </button>
        </div>
      )}
      
      {/* Retry button when needed */}
      {showRetry && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              console.log('=== RETRY CAMERA ACCESS BUTTON CLICKED ===');
              retryScanning();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry Camera Access
          </button>
        </div>
      )}
      
      {/* Manual Entry Form */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Manual Entry</h3>
        <form onSubmit={handleManualEntrySubmit}>
          <div className="flex items-center">
            <input
              type="text"
              value={manualEntryId}
              onChange={(e) => setManualEntryId(e.target.value)}
              className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter employee ID"
              disabled={isManualProcessing}
            />
            <button
              type="submit"
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isManualProcessing || !manualEntryId.trim()}
            >
              {isManualProcessing ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};