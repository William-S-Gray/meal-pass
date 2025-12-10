# Scanner Functionality Testing Instructions

This document provides instructions for testing the scanner functionality in both development and production environments.

## Prerequisites

1. Make sure you have the latest code from the repository
2. Ensure all dependencies are installed:
   ```
   cd frontend
   npm install
   
   cd ../backend
   npm install
   ```

## Testing in Development Environment

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:8080`

4. Log in with your credentials

5. Navigate to the Dashboard and click on "Test Scanner" button

6. Test the following scenarios:
   - QR Code scanning: Select "QR Code" mode and scan a QR code
   - Barcode scanning: Select "Barcode" mode and scan a barcode
   - Both modes: Select "Both" mode and scan both QR codes and barcodes

## Testing in Production Environment

1. Build the frontend for production:
   ```
   cd frontend
   npm run build
   ```

2. Serve the production build locally (or deploy to your production server):
   ```
   npm run preview
   ```

3. Ensure the backend is running:
   ```
   cd backend
   npm start
   ```

4. Open your browser and navigate to the production URL

5. Log in with your credentials

6. Navigate to the Dashboard and click on "Test Scanner" button

7. Test the same scenarios as in development:
   - QR Code scanning
   - Barcode scanning
   - Both modes

## Expected Results

- Both QR codes and barcodes should be successfully scanned in both environments
- The scanner should work with the rear camera for better scanning experience
- Results should be displayed immediately after scanning
- No CORS errors should occur
- The application should work identically in both development and production

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify CORS settings in backend/server.js
3. Ensure environment variables are correctly set:
   - FRONTEND_URL in backend/.env
   - VITE_API_URL in frontend/.env.production
4. Check network tab for failed requests
5. Verify that camera permissions are granted

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-production-url.com
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Frontend (.env.production)
```
VITE_API_URL=https://your-production-api-url.com
```

## Supported Barcode Formats

The scanner supports the following barcode formats:
- Code 128
- EAN
- EAN-8
- Code 39
- Code 39 VIN
- Codabar
- UPC
- UPC-E
- Interleaved 2 of 5 (I2of5)

## Notes

- The scanner uses the device's rear camera for optimal scanning performance
- Camera permissions must be granted for the scanner to work
- The scanner works on both mobile and desktop devices with cameras
- HTTPS is required for camera access in production environments