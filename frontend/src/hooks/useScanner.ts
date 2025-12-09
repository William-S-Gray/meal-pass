import { useState, useCallback, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import Quagga from 'quagga';

// Types
export type ScanMode = 'qr' | 'barcode' | 'both';
export type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';
export type ScanType = 'qr' | 'barcode';

export interface ScanResult {
  data: string;
  type: ScanType;
  timestamp: number;
}

export interface ScannerState {
  status: ScanStatus;
  result: ScanResult | null;
  error: string | null;
}

// Error types for better error handling
export type ScannerErrorType = 
  | 'CAMERA_ERROR'
  | 'INITIALIZATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'NOT_SUPPORTED'
  | 'UNKNOWN_ERROR';

export interface ScannerError {
  type: ScannerErrorType;
  message: string;
}

// Type for Quagga detected handler data
interface QuaggaCodeResult {
  code?: string;
  format?: string;
}

interface QuaggaDetectedData {
  codeResult?: QuaggaCodeResult;
}

// Type for Quagga detected handler
type QuaggaDetectedHandler = (data: QuaggaDetectedData) => void;

// Optimized barcode readers - only the most commonly used ones
const OPTIMIZED_BARCODE_READERS = [
  "code_128_reader",
  "ean_reader",
  "code_39_reader",
  "upc_reader"
];

// Adaptive video constraints for better device compatibility
const getAdaptiveVideoConstraints = () => {
  // Start with ideal constraints for high-end devices
  const constraints: MediaTrackConstraints = {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 }
  };
  
  // Adjust for lower-end devices or when ideal constraints fail
  if (window.innerWidth < 768) {
    // Mobile devices - use more conservative constraints
    constraints.width = { ideal: 640 };
    constraints.height = { ideal: 480 };
  }
  
  return constraints;
};

// Hook for Scanner functionality (QR + Barcode)
export const useScanner = (
  videoElement: HTMLVideoElement | null,
  onScan: (result: ScanResult) => void,
  mode: ScanMode = 'both'
) => {
  const [scannerState, setScannerState] = useState<ScannerState>({
    status: 'idle',
    result: null,
    error: null
  });

  const qrScannerRef = useRef<QrScanner | null>(null);
  const isQrInitializedRef = useRef(false);
  const isBarcodeInitializedRef = useRef(false);
  const isActiveRef = useRef(false);
  const initializationLockRef = useRef(false); // Prevent concurrent initializations
  const lastScanTimeRef = useRef(0); // Track last scan time for debounce
  const detectedCodesRef = useRef(new Set<string>()); // Track recently detected codes
  const quaggaOnDetectedHandlerRef = useRef<QuaggaDetectedHandler | null>(null); // Store Quagga handler for cleanup
  const cleanupTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map()); // Track cleanup timeouts to prevent memory leaks

  // Initialize QR Scanner
  const initQrScanner = useCallback(async () => {
    if (!videoElement || isQrInitializedRef.current || !isActiveRef.current) return;

    try {
      // Stop any existing QR scanner
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }

      // Create new QR scanner instance
      qrScannerRef.current = new QrScanner(
        videoElement,
        (result) => {
          if (!isActiveRef.current) return;
          
          // Debounce scans - prevent multiple scans of same code in short time
          const now = Date.now();
          if (now - lastScanTimeRef.current < 1000) { // 1 second debounce
            return;
          }
          
          // Check if we've recently processed this exact code
          if (detectedCodesRef.current.has(result.data)) {
            return;
          }
          
          // Add to detected codes set
          detectedCodesRef.current.add(result.data);
          // Set up cleanup timeout and track it
          const timeoutId = setTimeout(() => {
            detectedCodesRef.current.delete(result.data);
            cleanupTimeoutsRef.current.delete(result.data);
          }, 5000);
          cleanupTimeoutsRef.current.set(result.data, timeoutId);
          
          lastScanTimeRef.current = now;
          
          const scanResult: ScanResult = {
            data: result.data.trim(),
            type: 'qr',
            timestamp: now
          };
          
          setScannerState({
            status: 'success',
            result: scanResult,
            error: null
          });
          
          onScan(scanResult);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 2,
          preferredCamera: 'environment'
        }
      );

      await qrScannerRef.current.start();
      isQrInitializedRef.current = true;
    } catch (error) {
      console.error('Failed to initialize QR scanner:', error);
      
      let errorMessage = 'Failed to initialize QR scanner';
      let errorType: ScannerErrorType = 'INITIALIZATION_ERROR';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes('Permission') || errorMessage.includes('denied')) {
          errorType = 'PERMISSION_DENIED';
        } else if (errorMessage.includes('supported')) {
          errorType = 'NOT_SUPPORTED';
        }
      }
      
      setScannerState({
        status: 'error',
        result: null,
        error: errorMessage
      });
    }
  }, [videoElement, onScan]);

  // Initialize Barcode Scanner (Quagga)
  const initBarcodeScanner = useCallback(async () => {
    if (!videoElement || isBarcodeInitializedRef.current || !isActiveRef.current) return;

    try {
      // Configure Quagga for barcode detection with optimized readers and adaptive constraints
      const config = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoElement,
          constraints: {
            ...getAdaptiveVideoConstraints(),
            // Add some flexibility for different devices
            width: { min: 320, ideal: 1280, max: 1920 },
            height: { min: 240, ideal: 720, max: 1080 }
          },
        },
        decoder: {
          readers: OPTIMIZED_BARCODE_READERS // Use optimized reader list
        },
        locate: true
      };

      // Stop any existing barcode scanner
      try {
        // Remove previous event listener if it exists
        if (quaggaOnDetectedHandlerRef.current) {
          // Note: Quagga doesn't provide a direct way to remove specific handlers
          // We'll stop and restart to clear all handlers
          Quagga.stop();
        } else {
          Quagga.stop();
        }
      } catch (e) {
        // Ignore errors when stopping
      }

      // Initialize Quagga
      Quagga.init(config, (err) => {
        if (err) {
          console.error("Quagga initialization error:", err);
          let errorMessage = 'Failed to initialize barcode scanner';
          let errorType: ScannerErrorType = 'INITIALIZATION_ERROR';
          
          if (err instanceof Error) {
            errorMessage = err.message;
            if (errorMessage.includes('Permission') || errorMessage.includes('denied')) {
              errorType = 'PERMISSION_DENIED';
            } else if (errorMessage.includes('supported')) {
              errorType = 'NOT_SUPPORTED';
            }
          }
          
          setScannerState({
            status: 'error',
            result: null,
            error: errorMessage
          });
          return;
        }
        
        Quagga.start();
        isBarcodeInitializedRef.current = true;
      });

      // Set up result processing with debounce
      const onDetectedHandler: QuaggaDetectedHandler = (data) => {
        if (!isActiveRef.current) return;
        
        // Debounce scans - prevent multiple scans of same code in short time
        const now = Date.now();
        if (now - lastScanTimeRef.current < 1000) { // 1 second debounce
          return;
        }
        
        if (data && data.codeResult && data.codeResult.code) {
          const code = data.codeResult.code.trim();
          
          // Check if we've recently processed this exact code
          if (detectedCodesRef.current.has(code)) {
            return;
          }
          
          // Add to detected codes set
          detectedCodesRef.current.add(code);
          // Set up cleanup timeout and track it
          const timeoutId = setTimeout(() => {
            detectedCodesRef.current.delete(code);
            cleanupTimeoutsRef.current.delete(code);
          }, 5000);
          cleanupTimeoutsRef.current.set(code, timeoutId);
          
          lastScanTimeRef.current = now;
          
          const scanResult: ScanResult = {
            data: code,
            type: 'barcode',
            timestamp: now
          };
          
          setScannerState({
            status: 'success',
            result: scanResult,
            error: null
          });
          
          onScan(scanResult);
        }
      };
      
      // Store handler reference for cleanup
      quaggaOnDetectedHandlerRef.current = onDetectedHandler;
      Quagga.onDetected(onDetectedHandler);
    } catch (error) {
      console.error('Failed to initialize barcode scanner:', error);
      
      let errorMessage = 'Failed to initialize barcode scanner';
      let errorType: ScannerErrorType = 'INITIALIZATION_ERROR';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes('Permission') || errorMessage.includes('denied')) {
          errorType = 'PERMISSION_DENIED';
        } else if (errorMessage.includes('supported')) {
          errorType = 'NOT_SUPPORTED';
        }
      }
      
      setScannerState({
        status: 'error',
        result: null,
        error: errorMessage
      });
    }
  }, [videoElement, onScan]);

  // Start scanning
  const startScanning = useCallback(async () => {
    console.log('=== START SCANNING FUNCTION CALLED ===');
    console.log('Parameters:', { videoElement, mode });
    
    // Prevent concurrent initializations
    if (initializationLockRef.current) {
      console.log('Initialization already in progress, skipping...');
      return false;
    }
    
    if (!videoElement) {
      console.error('Video element is required but was null');
      setScannerState({
        status: 'error',
        result: null,
        error: 'Video element is required'
      });
      console.log('=== START SCANNING FAILED - NO VIDEO ELEMENT ===');
      return false;
    }

    try {
      console.log('Setting scanner state to scanning...');
      setScannerState({
        status: 'scanning',
        result: null,
        error: null
      });

      console.log('Setting isActiveRef to true...');
      isActiveRef.current = true;
      
      // Set initialization lock
      initializationLockRef.current = true;

      // Initialize scanners based on mode
      console.log('Initializing scanners based on mode:', mode);
      if (mode === 'qr' || mode === 'both') {
        console.log('Initializing QR scanner...');
        await initQrScanner();
        console.log('QR scanner initialized');
      }

      if (mode === 'barcode' || mode === 'both') {
        console.log('Initializing barcode scanner...');
        await initBarcodeScanner();
        console.log('Barcode scanner initialized');
      }
      
      // Release initialization lock
      initializationLockRef.current = false;
      
      console.log('=== START SCANNING COMPLETED SUCCESSFULLY ===');
      return true;
    } catch (error) {
      console.error('=== START SCANNING FAILED ===');
      console.error('Failed to start scanning:', error);
      
      // Release initialization lock on error
      initializationLockRef.current = false;
      
      let errorMessage = 'Failed to start scanning';
      let errorType: ScannerErrorType = 'UNKNOWN_ERROR';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes('Permission') || errorMessage.includes('denied')) {
          errorType = 'PERMISSION_DENIED';
        } else if (errorMessage.includes('supported')) {
          errorType = 'NOT_SUPPORTED';
        } else if (errorMessage.includes('init') || errorMessage.includes('initialize')) {
          errorType = 'INITIALIZATION_ERROR';
        }
      }
      
      setScannerState({
        status: 'error',
        result: null,
        error: errorMessage
      });
      
      console.log('=== START SCANNING FAILED WITH ERROR ===');
      return false;
    }
  }, [videoElement, mode, initQrScanner, initBarcodeScanner]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    try {
      isActiveRef.current = false;
      
      // Release initialization lock when stopping
      initializationLockRef.current = false;
      
      // Clear detected codes and timeouts
      detectedCodesRef.current.clear();
      
      // Clear all cleanup timeouts to prevent memory leaks
      cleanupTimeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      cleanupTimeoutsRef.current.clear();
      
      // Clear Quagga handler reference
      quaggaOnDetectedHandlerRef.current = null;

      // Stop QR scanner
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
        isQrInitializedRef.current = false;
      }

      // Stop barcode scanner
      try {
        Quagga.stop();
        isBarcodeInitializedRef.current = false;
      } catch (e) {
        // Ignore errors when stopping
      }

      setScannerState({
        status: 'idle',
        result: null,
        error: null
      });
    } catch (error) {
      console.warn('Error stopping scanners:', error);
      // Still set state to idle to prevent stuck states
      setScannerState({
        status: 'idle',
        result: null,
        error: null
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    scannerState,
    startScanning,
    stopScanning
  };
};