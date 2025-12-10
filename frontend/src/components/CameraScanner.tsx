import React, { useRef, useEffect, useState } from 'react';

interface CameraScannerProps {
  onScanSuccess: (data: string) => void;
  scanInterval?: number;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onScanSuccess, scanInterval = 500 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera access
  const initializeCamera = async () => {
    try {
      // Request camera permission using MediaDevices API
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera for better scanning
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      setPermissionGranted(true);
      setError(null);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError(`Camera access denied: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setPermissionGranted(false);
    }
  };

  // Clean up camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    setIsScanning(false);
  };

  // Capture frame for processing
  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob for processing
      canvas.toBlob((blob) => {
        if (blob) {
          processFrame(blob);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  // Process captured frame (send to backend)
  const processFrame = async (imageBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'scan-frame.jpg');

      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        onScanSuccess(result.data);
      }
    } catch (err) {
      console.error('Frame processing error:', err);
    }
  };

  // Start continuous scanning
  const startScanning = () => {
    if (!permissionGranted || !stream) {
      initializeCamera();
      return;
    }
    
    setIsScanning(true);
    // Start scanning at intervals
    scanTimerRef.current = setInterval(() => {
      captureFrame();
    }, scanInterval);
  };

  // Initialize camera on component mount
  useEffect(() => {
    // initializeCamera();

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="scanner-container">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)' // Mirror effect for user-friendly experience
          }}
        />
        
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {error && (
        <div className="error-message p-4 bg-destructive/10 text-destructive rounded-lg mt-4">
          <p className="font-medium">{error}</p>
          <button 
            onClick={initializeCamera}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry Camera Access
          </button>
        </div>
      )}
      
      {!permissionGranted && !error && (
        <div className="permission-prompt p-4 bg-muted rounded-lg mt-4 text-center">
          <p className="font-medium">Grant camera permission to start scanning</p>
        </div>
      )}
      
      <div className="flex gap-2 mt-4">
        {!isScanning ? (
          <button 
            onClick={startScanning}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 w-full"
          >
            Start Scanning
          </button>
        ) : (
          <button 
            onClick={stopCamera}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 w-full"
          >
            Stop Scanning
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraScanner;