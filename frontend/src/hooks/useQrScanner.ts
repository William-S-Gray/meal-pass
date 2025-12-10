import { useState, useCallback, useRef } from 'react';

// Types
export type ScanMode = 'qr' | 'barcode';
export type ScanStatus = 'success' | 'already_fed' | 'not_found' | 'error' | 'expired';

export interface ScanResult {
  status: ScanStatus;
  message: string;
  employee?: unknown; // Using unknown for now to match existing code
}

export interface BulkResult {
  id: string;
  status: ScanStatus;
  message: string;
  employee?: unknown;
}

// Declare the QrScanner type
declare class QrScanner {
  static HAS_CAMERA: Promise<boolean>;
  static listCameras: (backCameraPreferred?: boolean) => Promise<Array<{ id: string; label: string }>>;
  
  constructor(
    video: HTMLVideoElement,
    onDecode: (result: { data: string; cornerPoints: { x: number; y: number }[] }) => void,
    options?: {
      onDecodeError?: (error: Error | string) => void;
      calculateScanRegion?: (video: HTMLVideoElement) => { x: number; y: number; width: number; height: number };
      preferredCamera?: string;
      maxScansPerSecond?: number;
      highlightScanRegion?: boolean;
      highlightCodeOutline?: boolean;
      overlay?: HTMLElement;
      restrictToCamera?: string;
    }
  );
  
  hasFlash(): Promise<boolean>;
  turnFlashOn(): Promise<void>;
  turnFlashOff(): Promise<void>;
  toggleFlash(): Promise<void>;
  destroy(): void;
  start(): Promise<void>;
  stop(): void;
}

// Hook for QR Scanner functionality
export const useQrScanner = (
  videoElement: HTMLVideoElement | null,
  onScan: (data: string) => void,
  onError: (error: Error) => void
) => {
  const qrScannerRef = useRef<QrScanner | null>(null);
  const isInitializedRef = useRef(false);

  const initialize = useCallback(async () => {
    if (!videoElement || isInitializedRef.current) return;

    try {
      // Dynamically import QrScanner to avoid issues on server-side rendering
      const QrScannerModule = await import('qr-scanner');
      const QrScannerClass = QrScannerModule.default;

      // Stop any existing scanner
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }

      // Create new scanner instance
      qrScannerRef.current = new QrScannerClass(
        videoElement,
        (result) => {
          try {
            // Handle URL format first
            // Check if it's a URL format pointing to our QR endpoint
            const urlMatch = result.data.match(/\/qr\/([A-Za-z0-9\-_]+)/);
            if (urlMatch && urlMatch[1]) {
              onScan(urlMatch[1]);
              return;
            }
            
            // Try to parse the QR code data as JSON (old format)
            const qrData = JSON.parse(result.data);
            // If it's our enhanced QR code format, use the uniqueId
            if (qrData.uniqueId) {
              onScan(qrData.uniqueId);
            } else {
              // Otherwise, use the raw data (backward compatibility)
              onScan(result.data);
            }
          } catch (parseError) {
            // If parsing fails, use the raw data (backward compatibility)
            onScan(result.data);
          }
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