import { useState, useCallback, useRef } from 'react';

// Hook for Barcode Scanner functionality using Quagga
export const useBarcodeScanner = (
  videoElement: HTMLVideoElement | null,
  onScan: (data: string) => void,
  onError: (error: Error) => void
) => {
  const isInitializedRef = useRef(false);
  const isDestroyedRef = useRef(false);

  const initialize = useCallback(async () => {
    if (!videoElement || isInitializedRef.current || isDestroyedRef.current) return;

    try {
      // Dynamically import Quagga to avoid issues on server-side rendering
      const QuaggaModule = await import('quagga');
      const Quagga = QuaggaModule.default;

      // Reset destroyed flag
      isDestroyedRef.current = false;

      // Configure Quagga for barcode detection
      await new Promise<void>((resolve, reject) => {
        Quagga.init({
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
        }, (err: unknown) => {
          if (err) {
            console.error("Quagga initialization error:", err);
            reject(err);
            return;
          }
          
          Quagga.start();
          isInitializedRef.current = true;
          resolve();
        });
      });

      // Set up result processing
      Quagga.onDetected((data: unknown) => {
        if (isDestroyedRef.current) return;
        
        // Type checking for the data object
        if (data && typeof data === 'object' && 'codeResult' in data) {
          const codeData = data as { codeResult?: { code?: string } };
          if (codeData.codeResult && codeData.codeResult.code) {
            onScan(codeData.codeResult.code);
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize barcode scanner:', error);
      onError(error instanceof Error ? error : new Error('Failed to initialize barcode scanner'));
    }
  }, [videoElement, onScan, onError]);

  const destroy = useCallback(() => {
    isDestroyedRef.current = true;
    
    try {
      import('quagga').then((QuaggaModule) => {
        const Quagga = QuaggaModule.default;
        Quagga.stop();
      }).catch(() => {
        // Ignore import errors
      });
    } catch (error) {
      console.warn('Error stopping Quagga:', error);
    }
    
    isInitializedRef.current = false;
  }, []);

  return {
    initialize,
    destroy,
    isInitialized: isInitializedRef.current,
  };
};