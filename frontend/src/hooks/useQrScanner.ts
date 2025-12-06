import { useState, useCallback, useRef } from 'react';

// Types
export type ScanMode = 'qr' | 'barcode';
export type ScanStatus = 'success' | 'already_fed' | 'not_found' | 'error' | 'expired';

export interface ScanResult {
  status: ScanStatus;
  message: string;
  employee?: any; // Using any to match existing code, but should be typed properly
}

export interface BulkResult {
  id: string;
  status: ScanStatus;
  message: string;
  employee?: any;
}

// Hook for QR Scanner functionality
export const useQrScanner = (
  videoElement: HTMLVideoElement | null,
  onScan: (data: string) => void,
  onError: (error: Error) => void
) => {
  const qrScannerRef = useRef<any>(null); // Using any for QrScanner type
  const isInitializedRef = useRef(false);

  const initialize = useCallback(async () => {
    if (!videoElement || isInitializedRef.current) return;

    try {
      // Dynamically import QrScanner to avoid issues on server-side rendering
      const QrScannerModule = await import('qr-scanner');
      const QrScanner = QrScannerModule.default;

      // Stop any existing scanner
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }

      // Create new scanner instance
      qrScannerRef.current = new QrScanner(
        videoElement,
        (result) => {
          onScan(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 2,
        }
      );

      await qrScannerRef.current.start();
      isInitializedRef.current = true;
    } catch (error) {
      console.error('Failed to initialize QR scanner:', error);
      onError(error instanceof Error ? error : new Error('Failed to initialize QR scanner'));
    }
  }, [videoElement, onScan, onError]);

  const destroy = useCallback(() => {
    try {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      isInitializedRef.current = false;
    } catch (error) {
      console.warn('Error destroying QR scanner:', error);
    }
  }, []);

  return {
    initialize,
    destroy,
    isInitialized: isInitializedRef.current,
  };
};