# Camera Scanner Implementation

This document describes the new camera scanner implementation for the meal-pass system, which provides enhanced device camera access for scanning QR codes and barcodes.

## Overview

The implementation consists of several components:

1. **Frontend CameraScanner Component** - React component for camera access
2. **Backend Scan Endpoint** - Express.js route for processing scanned images
3. **CameraManager Utility** - Enhanced camera access with fallbacks
4. **useScanner Hook** - Custom React hook for continuous scanning

## Frontend Implementation

### CameraScanner Component

Located at `frontend/src/components/CameraScanner.tsx`, this component provides:

- Modern Web API camera access using `navigator.mediaDevices.getUserMedia()`
- Support for both QR codes and barcodes
- Rear camera preference for better scanning (`facingMode: 'environment'`)
- Enhanced error handling with user-friendly messages
- Permission management and cleanup

### CameraManager Utility

Located at `frontend/src/utils/CameraManager.ts`, this utility class provides:

- Robust camera initialization with fallback mechanisms
- Cross-browser compatibility handling
- Constraint management for different devices
- Error categorization and messaging

### useScanner Hook

Located at `frontend/src/hooks/useScanner.ts`, this custom hook provides:

- Continuous scanning functionality
- Frame capture and processing
- Interval-based scanning control
- State management for scanning status

## Backend Implementation

### Scan Endpoint

Located at `backend/routes/scanRoutes.js`, this endpoint provides:

- Image upload handling with Multer
- QR code detection using jsQR library
- Barcode detection using ZXing library (fallback)
- Proper error handling and response formatting

### Server Integration

The scan route is registered in `server.js` and available at `/api/scan`.

## Features

1. **Modern Camera Access**
   - Uses MediaDevices API for camera access
   - Supports rear camera for better scanning experience
   - Configurable resolution (1280x720 ideal)

2. **Cross-Browser Compatibility**
   - Fallback mechanisms for different browsers
   - Constraint adjustments for various devices
   - Graceful degradation when features aren't supported

3. **Enhanced Error Handling**
   - Specific error messages for different failure modes
   - Permission denial handling
   - Camera availability detection
   - Network error recovery

4. **Real-time Processing**
   - Configurable scanning intervals
   - Frame capture and processing
   - Immediate feedback on successful scans

5. **Security Considerations**
   - File type validation
   - Size limits (5MB maximum)
   - CORS configuration
   - Secure connection requirements

## Usage

### Frontend Integration

To use the camera scanner in a component:

```jsx
import CameraScanner from '@/components/CameraScanner';

const MyComponent = () => {
  const handleScanSuccess = (data) => {
    console.log('Scanned data:', data);
    // Process the scanned data
  };

  return (
    <CameraScanner onScanSuccess={handleScanSuccess} />
  );
};
```

### Backend Processing

The backend endpoint receives image data and returns scan results:

```javascript
// POST /api/scan
// Content-Type: multipart/form-data
// Body: image file

// Success response:
{
  "success": true,
  "data": "scanned-content",
  "type": "QR_CODE",
  "bounds": { /* position data */ }
}

// Error response:
{
  "success": false,
  "message": "No QR code or barcode detected in image"
}
```

## Testing

The implementation has been tested with:

1. Various mobile devices (iOS and Android)
2. Different browsers (Chrome, Firefox, Safari, Edge)
3. Multiple QR code and barcode formats
4. Different lighting conditions
5. Network connectivity variations

## Future Improvements

1. **Performance Optimization**
   - Worker threads for image processing
   - Canvas optimization for frame rendering
   - Memory management for long-running sessions

2. **Enhanced Detection**
   - Machine learning models for better recognition
   - Multi-code detection in single frame
   - Orientation handling

3. **Accessibility**
   - Voice feedback for visually impaired users
   - Haptic feedback for successful scans
   - Keyboard navigation support

4. **Advanced Features**
   - Batch scanning mode
   - Scan history and management
   - Integration with inventory systems

## Troubleshooting

Common issues and solutions:

1. **Camera Permission Denied**
   - Ensure HTTPS connection in production
   - Check browser permission settings
   - Verify camera hardware availability

2. **No Codes Detected**
   - Improve lighting conditions
   - Ensure code is fully visible in frame
   - Check code quality and print clarity

3. **Browser Compatibility**
   - Update to latest browser versions
   - Check for feature support using Modernizr
   - Implement additional fallbacks as needed

## Dependencies

Frontend:
- React
- TypeScript
- Tailwind CSS (for styling)

Backend:
- Express.js
- Multer (file upload)
- Jimp (image processing)
- jsQR (QR code detection)
- ZXing (barcode detection)

## Conclusion

This implementation provides a robust, cross-browser compatible solution for camera-based scanning in the meal-pass system. It enhances the user experience while maintaining security and performance standards.