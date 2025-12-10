import React, { useRef, useEffect, useState } from 'react';

interface CameraScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError?: (error: string) => void;
  onDuplicateScan?: (data: string) => void;
  scanInterval?: number;
  scanMode?: 'qr' | 'barcode' | 'both';
}

const CameraScanner: React.FC<CameraScannerProps> = ({ 
  onScanSuccess, 
  onScanError,
  onDuplicateScan,
  scanInterval = 500, 
  scanMode = 'both' 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract employee ID from QR code data
  const extractEmployeeId = (qrData: string): string | null => {
    try {
      // Handle URL format first
      // Check if it's a URL format pointing to our QR endpoint
      const urlMatch = qrData.match(/\/api\/employees\/qr\/([A-Za-z0-9\-_]+)/);
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
      }
      
      // Try to parse as JSON (old format)
      const parsedData = JSON.parse(qrData);
      
      // Check if it has the expected structure
      if (parsedData && typeof parsedData === 'object' && parsedData.uniqueId) {
        return parsedData.uniqueId;
      }
      
      // If it's just a plain string, use it directly
      if (qrData && typeof qrData === 'string' && qrData.trim().length > 0) {
        return qrData.trim();
      }
    } catch (error) {
      // If parsing fails, treat as legacy format (plain uniqueId)
      if (qrData && typeof qrData === 'string' && qrData.trim().length > 0) {
        return qrData.trim();
      }
    }
    
    return null;
  };

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
      const errorMessage = `Camera access denied: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      setPermissionGranted(false);
      if (onScanError) {
        onScanError(errorMessage);
      }
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
    setIsProcessing(false);
  };

  // Capture frame for processing
  const captureFrame = () => {
    if (isProcessing || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set processing flag to prevent multiple concurrent scans
    setIsProcessing(true);
    setIsDuplicate(false); // Reset duplicate state

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob for processing
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await processFrame(blob);
        } catch (err) {
          console.error('Frame processing error:', err);
          if (onScanError) {
            onScanError(err instanceof Error ? err.message : 'Failed to process frame');
          }
        } finally {
          setIsProcessing(false);
        }
      } else {
        setIsProcessing(false);
      }
    }, 'image/jpeg', 0.8);
  };

  // Process captured frame (send to backend)
  const processFrame = async (imageBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'scan-frame.jpg');

      // Get the base URL from environment variables
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Include scan mode in the request
      formData.append('scanMode', scanMode);
      
      const response = await fetch(`${baseUrl}/api/scan`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        // Validate that we have meaningful data
        if (result.data.trim().length > 0) {
          // Extract employee ID from QR code data
          const employeeId = extractEmployeeId(result.data.trim());
          
          if (!employeeId) {
            throw new Error('Could not extract employee ID from QR code');
          }
          
          // Check for duplicate scan before proceeding
          try {
            const checkResponse = await fetch(`${baseUrl}/api/feeding/employee/${encodeURIComponent(employeeId)}`);
            if (checkResponse.ok) {
              const checkResult = await checkResponse.json();
              // Check if employee has been fed today
              if (checkResult.data && checkResult.data.length > 0) {
                const today = new Date().toISOString().split('T')[0];
                const alreadyFed = checkResult.data.some((record: { date: string }) => record.date === today);
                if (alreadyFed) {
                  setIsDuplicate(true);
                  setTimeout(() => setIsDuplicate(false), 3000); // Reset after 3 seconds
                  if (onDuplicateScan) {
                    onDuplicateScan(employeeId);
                  }
                  return; // Exit early for duplicate
                }
              }
            }
          } catch (checkError) {
            console.warn('Error checking for duplicate scan:', checkError);
            // Continue with normal processing even if duplicate check fails
          }
          
          onScanSuccess(employeeId);
        } else {
          throw new Error('Empty scan result');
        }
      } else if (!result.success) {
        // Don't throw an error for "no code detected" - this is normal
        if (result.message && !result.message.includes('detected')) {
          throw new Error(result.message);
        }
      }
    } catch (err) {
      console.error('Frame processing error:', err);
      if (onScanError) {
        onScanError(err instanceof Error ? err.message : 'Failed to process scan');
      }
    }
  };

  // Start continuous scanning
  const startScanning = () => {
    if (!permissionGranted || !stream) {
      initializeCamera();
      return;
    }
    
    setIsScanning(true);
    setIsProcessing(false);
    
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
    <div className="scanner-container w-full max-w-2xl mx-auto">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center w-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]" // Mirror effect for user-friendly experience
        />
        
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-3/4 max-w-xs max-h-xs border-4 border-green-500 rounded-xl animate-pulse flex items-center justify-center sm:w-64 sm:h-64">
              <div className="absolute w-11/12 h-11/12 max-w-64 max-h-64 border-2 border-white rounded-lg sm:w-48 sm:h-48"></div>
              <div className="absolute text-white font-bold text-sm bg-green-500 bg-opacity-80 px-2 py-1 rounded">
                Scanning...
              </div>
            </div>
          </div>
        )}
        
        {(isProcessing || isDuplicate) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="text-white text-center max-w-xs">
              {isDuplicate ? (
                <>
                  <div className="text-yellow-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="mt-2 text-sm font-bold">Duplicate Scan Detected!</p>
                  <p className="text-xs mt-1">Employee already fed today</p>
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="mt-2 text-sm">Processing...</p>
                </>
              )}
            </div>
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
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 w-full disabled:opacity-50"
            disabled={isProcessing}
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