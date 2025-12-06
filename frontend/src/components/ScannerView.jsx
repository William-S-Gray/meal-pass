import React, { useRef, useEffect, useState } from 'react';
import { useCameraAccess } from '../hooks/useCameraAccess';
import { useScanner } from '../hooks/useScanner';
import { usePWAStorage } from '../hooks/usePWAStorage';
import { ScanOverlay } from './ScanOverlay';
import { scanQRCode } from '@/lib/api';

// Types
import { ScanResult } from '../hooks/useScanner';
import { CachedScanData } from '../hooks/usePWAStorage';

export const ScannerView = ({ onScanComplete }) => {
  const videoRef = useRef(null);
  const [scanMode, setScanMode] = useState('both'); // 'qr', 'barcode', or 'both'
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  
  // Use our custom hooks
  const { 
    cameraState, 
    isCameraSupported, 
    requestCameraAccess, 
    startCamera, 
    stopCamera, 
    clearVideoSource 
  } = useCameraAccess();
  
  const { 
    scannerState, 
    startScanning, 
    stopScanning 
  } = useScanner(videoRef.current, handleScanResult, scanMode);
  
  const { 
    storageState, 
    cacheScan, 
    syncPendingScans 
  } = usePWAStorage();

  // Handle scan result from scanner hook
  async function handleScanResult(result) {
    if (isProcessing) return;
    
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
      
      // Auto-hide result after delay
      setTimeout(() => {
        setScanResult(null);
      }, 3000);
    }
  }

  // Start scanning process
  const initiateScanning = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setShowRetry(false);
    
    try {
      // Request camera access first
      const hasAccess = await requestCameraAccess();
      if (!hasAccess) {
        setShowRetry(true);
        return;
      }
      
      // Start camera
      const cameraStarted = await startCamera(videoRef.current);
      if (!cameraStarted) {
        setShowRetry(true);
        return;
      }
      
      // Start scanning
      await startScanning();
    } catch (error) {
      console.error('Failed to start scanning:', error);
      setShowRetry(true);
    }
  };

  // Stop scanning process
  const stopScanningProcess = () => {
    stopScanning();
    stopCamera();
    clearVideoSource(videoRef.current);
    setIsScanning(false);
    setScanResult(null);
  };

  // Retry scanning
  const retryScanning = async () => {
    stopScanningProcess();
    setTimeout(() => {
      initiateScanning();
    }, 500);
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
      stopScanningProcess();
    };
  }, []);

  // Initial start
  useEffect(() => {
    initiateScanning();
    
    // Return focus to document for better mobile experience
    document.focus();
  }, []);

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
              onClick={stopScanningProcess}
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
              onClick={retryScanning}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
              disabled={isScanning}
            >
              Retry
            </button>
          </div>
          
          {/* Mode selector */}
          <div className="mt-3 flex justify-center space-x-2">
            <button
              onClick={() => setScanMode('qr')}
              className={`px-3 py-1 text-xs rounded ${
                scanMode === 'qr' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              QR Only
            </button>
            <button
              onClick={() => setScanMode('barcode')}
              className={`px-3 py-1 text-xs rounded ${
                scanMode === 'barcode' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              Barcode Only
            </button>
            <button
              onClick={() => setScanMode('both')}
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
            onClick={retryScanning}
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
            onClick={retryScanning}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry Camera Access
          </button>
        </div>
      )}
    </div>
  );
};