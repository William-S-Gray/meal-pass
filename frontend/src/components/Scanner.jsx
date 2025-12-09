import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { scanQRCode } from '@/lib/api';

const Scanner = ({ onScanResult }) => {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(null); // 'success', 'already_fed', 'not_found', 'error'
  const [manualId, setManualId] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);

  useEffect(() => {
    if (!isManualMode) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isManualMode]);

  const startScanner = () => {
    if (videoRef.current && !qrScannerRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScannerRef.current.start()
        .then(() => {
          setIsScanning(true);
        })
        .catch((err) => {
          console.error('Failed to start QR scanner:', err);
                
          // More descriptive error messages based on error type
          let errorMessage = 'Failed to access camera';
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
          } else if (err.name === 'NotFoundError') {
            errorMessage = 'No camera found on this device.';
          } else if (err.name === 'NotSupportedError') {
            errorMessage = 'Camera is not supported on this device.';
          } else if (err.name === 'OverconstrainedError') {
            errorMessage = 'Camera constraints cannot be satisfied.';
          } else if (err.message) {
            errorMessage = err.message;
          }
                
          setScanStatus({ type: 'error', message: errorMessage });
          setTimeout(clearStatus, 3000); // Longer display for error messages
        });
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
      setIsScanning(false);
    }
  };

  const handleScanResult = async (result) => {
    try {
      // Extract uniqueId from QR code content
      const uniqueId = result.data.trim();
      
      // Send to backend API
      const response = await scanQRCode(uniqueId, 'web-scanner', 'scan');
      
      // Set status based on response
      setScanStatus({ type: response.status, message: response.message });
      
      // Notify parent component
      if (onScanResult) {
        onScanResult(response);
      }
      
      // Auto-clear status after 3 seconds for better visibility
      setTimeout(clearStatus, 3000);
    } catch (error) {
      console.error('Scan processing error:', error);
      
      // More descriptive error handling
      let errorMessage = 'Scan failed';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 404) {
        errorMessage = 'Employee not found';
      } else if (error.status === 409) {
        errorMessage = 'Meal already recorded for today';
      } else if (!navigator.onLine) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setScanStatus({ type: 'error', message: errorMessage });
      // Longer display for error messages
      setTimeout(clearStatus, 5000);
    }
  };

  const clearStatus = () => {
    setScanStatus(null);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualId.trim()) {
      setScanStatus({ type: 'error', message: 'Please enter a valid ID' });
      setTimeout(clearStatus, 3000);
      return;
    }

    try {
      // Send to backend API
      const response = await scanQRCode(manualId.trim(), 'web-manual', 'manual');
      
      // Set status based on response
      setScanStatus({ type: response.status, message: response.message });
      
      // Notify parent component
      if (onScanResult) {
        onScanResult(response);
      }
      
      // Auto-clear status after 3 seconds for better visibility
      setTimeout(clearStatus, 3000);
    } catch (error) {
      console.error('Manual entry processing error:', error);
      
      // More descriptive error handling
      let errorMessage = 'Manual entry failed';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 404) {
        errorMessage = 'Employee not found';
      } else if (error.status === 409) {
        errorMessage = 'Meal already recorded for today';
      } else if (!navigator.onLine) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setScanStatus({ type: 'error', message: errorMessage });
      // Longer display for error messages
      setTimeout(clearStatus, 5000);
    }
  };

  const toggleMode = () => {
    if (isManualMode) {
      // Switching to camera mode
      setIsManualMode(false);
      setManualId('');
    } else {
      // Switching to manual mode
      stopScanner();
      setIsManualMode(true);
    }
  };

  return (
    <div className="scanner-container">
      <div className="scanner-video-container relative">
        {!isManualMode ? (
          <>
            <video 
              ref={videoRef} 
              className="w-full h-auto max-h-96 object-contain"
              style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            {scanStatus && (
              <div 
                className={`scanner-overlay absolute inset-0 flex items-center justify-center text-white text-xl font-bold ${
                  scanStatus.type === 'success' ? 'bg-green-500/70' :
                  scanStatus.type === 'already_fed' ? 'bg-red-500/70' :
                  scanStatus.type === 'not_found' ? 'bg-yellow-500/70' :
                  'bg-red-800/70'
                }`}
              >
                {scanStatus.message}
              </div>
            )}
          </>
        ) : (
          <div className="manual-entry-form p-4 bg-gray-100 rounded">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label htmlFor="manualId" className="block text-sm font-medium text-gray-700 mb-1">
                  Manual ID Entry
                </label>
                <input
                  type="text"
                  id="manualId"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="Enter Employee ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Back to Scanner
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="scanner-controls mt-4 flex justify-center">
        {!isManualMode ? (
          <button
            onClick={toggleMode}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Manual Entry
          </button>
        ) : (
          <button
            onClick={toggleMode}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Camera Scanner
          </button>
        )}
      </div>

      <style jsx>{`
        .scanner-container {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }
        
        .scanner-video-container {
          position: relative;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          background-color: #000;
        }
        
        .scanner-overlay {
          transition: opacity 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default Scanner;