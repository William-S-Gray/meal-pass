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
          
          const scanResult: ScanResult = {
            data: result.data.trim(),
            type: 'qr',
            timestamp: Date.now()
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
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize QR scanner';
      
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
      // Configure Quagga for barcode detection
      const config = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoElement,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          },
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ]
        },
        locate: true
      };

      // Stop any existing barcode scanner
      try {
        Quagga.stop();
      } catch (e) {
        // Ignore errors when stopping
      }

      // Initialize Quagga
      Quagga.init(config, (err) => {
        if (err) {
          console.error("Quagga initialization error:", err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize barcode scanner';
          
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

      // Set up result processing
      Quagga.onDetected((data) => {
        if (!isActiveRef.current) return;
        
        if (data && data.codeResult && data.codeResult.code) {
          const scanResult: ScanResult = {
            data: data.codeResult.code.trim(),
            type: 'barcode',
            timestamp: Date.now()
          };
          
          setScannerState({
            status: 'success',
            result: scanResult,
            error: null
          });
          
          onScan(scanResult);
        }
      });
    } catch (error) {
      console.error('Failed to initialize barcode scanner:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize barcode scanner';
      
      setScannerState({
        status: 'error',
        result: null,
        error: errorMessage
      });
    }
  }, [videoElement, onScan]);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (!videoElement) {
      setScannerState({
        status: 'error',
        result: null,
        error: 'Video element is required'
      });
      return;
    }

    try {
      setScannerState({
        status: 'scanning',
        result: null,
        error: null
      });

      isActiveRef.current = true;

      // Initialize scanners based on mode
      if (mode === 'qr' || mode === 'both') {
        await initQrScanner();
      }

      if (mode === 'barcode' || mode === 'both') {
        await initBarcodeScanner();
      }
    } catch (error) {
      console.error('Failed to start scanning:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to start scanning';
      
      setScannerState({
        status: 'error',
        result: null,
        error: errorMessage
      });
    }
  }, [videoElement, mode, initQrScanner, initBarcodeScanner]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    try {
      isActiveRef.current = false;

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