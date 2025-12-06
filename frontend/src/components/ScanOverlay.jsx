import React from 'react';

export const ScanOverlay = ({ status, result, isProcessing, cameraState }) => {
  // Render status message based on camera state
  const renderCameraStatus = () => {
    switch (cameraState.status) {
      case 'requesting':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="text-white text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
              <p>Requesting camera access...</p>
            </div>
          </div>
        );
      case 'denied':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="text-white text-center p-4">
              <div className="text-red-500 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="font-medium">Camera Access Denied</p>
              <p className="text-sm mt-1">{cameraState.errorMessage}</p>
            </div>
          </div>
        );
      case 'unsupported':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="text-white text-center p-4">
              <div className="text-yellow-500 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="font-medium">Camera Not Supported</p>
              <p className="text-sm mt-1">{cameraState.errorMessage}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Render scan result overlay
  const renderScanResult = () => {
    if (!result && !isProcessing) return null;

    let bgColor = 'bg-blue-500';
    let textColor = 'text-white';
    let icon = null;
    let message = '';

    if (isProcessing) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="text-white text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
            <p>Processing scan...</p>
          </div>
        </div>
      );
    }

    if (result) {
      switch (result.status) {
        case 'success':
          bgColor = 'bg-green-500';
          icon = (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          );
          message = 'Scan Successful!';
          break;
        case 'already_fed':
          bgColor = 'bg-yellow-500';
          icon = (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          );
          message = 'Already Fed Today';
          break;
        case 'not_found':
          bgColor = 'bg-red-500';
          icon = (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          );
          message = 'Employee Not Found';
          break;
        case 'error':
          bgColor = 'bg-red-500';
          icon = (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          );
          message = 'Scan Error';
          break;
        case 'expired':
          bgColor = 'bg-red-500';
          icon = (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          );
          message = 'ID Expired';
          break;
        default:
          bgColor = 'bg-blue-500';
          icon = (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          );
          message = 'Scan Complete';
      }

      return (
        <div className={`absolute inset-0 flex items-center justify-center ${bgColor} bg-opacity-90 z-10 transition-opacity duration-300`}>
          <div className={`${textColor} text-center p-4`}>
            {icon}
            <p className="font-bold text-lg mt-2">{message}</p>
            {result.message && (
              <p className="text-sm mt-1">{result.message}</p>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Render scanning frame
  const renderScanningFrame = () => {
    if (cameraState.status !== 'granted' || isProcessing || result) return null;

    return (
      <>
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        
        {/* Scanning area frame */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 z-0">
          {/* Animated scanning line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 animate-pulse"></div>
          
          {/* Corner markers */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
        </div>
        
        {/* Scanning text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-32 text-white text-center z-0">
          <p className="font-medium">Point camera at QR/Barcode</p>
          <p className="text-sm opacity-75">Scanning will start automatically</p>
        </div>
      </>
    );
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      {renderScanningFrame()}
      {renderCameraStatus()}
      {renderScanResult()}
    </div>
  );
};