// useScanner.js - Custom React hook for continuous scanning
import { useState, useEffect, useRef } from 'react';

interface ScanResult {
  data: string;
  type: string;
  bounds: Record<string, unknown> | null;
}

const useScanner = (onScanSuccess: (data: string) => void, scanInterval: number = 500) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startScanning = () => {
    setIsScanning(true);
    setError(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  };

  const captureAndProcess = async (videoRef: React.RefObject<HTMLVideoElement>, canvasRef: React.RefObject<HTMLCanvasElement>) => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        const formData = new FormData();
        formData.append('image', blob, 'frame.jpg');

        const response = await fetch('/api/scan', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        
        if (result.success) {
          setScanResult(result);
          onScanSuccess(result.data);
        }
      } catch (err) {
        console.error('Scanning error:', err);
        setError('Failed to process frame');
      }
    }, 'image/jpeg', 0.8);
  };

  // Effect for continuous scanning
  useEffect(() => {
    if (isScanning) {
      const scanFrame = () => {
        // This would be passed refs from the component
        // captureAndProcess(videoRef, canvasRef);
        if (scanTimerRef.current) {
          scanTimerRef.current = setTimeout(scanFrame, scanInterval);
        }
      };
      
      scanTimerRef.current = setTimeout(scanFrame, scanInterval);
    }

    return () => {
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
      }
    };
  }, [isScanning, scanInterval]);

  return {
    isScanning,
    scanResult,
    error,
    startScanning,
    stopScanning
  };
};

export { useScanner };