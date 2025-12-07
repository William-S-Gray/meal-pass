# PWA Setup Instructions

## Overview
This document explains how to set up and use the Progressive Web App (PWA) features for the Meal Pass Scanner application.

## Features Implemented
1. **Service Worker** - Caches essential files for offline access
2. **Web App Manifest** - Enables installation on devices
3. **Offline Support** - Caches scan data when offline and syncs when online
4. **Responsive Design** - Works on mobile devices with camera access

## Files Created

### 1. Service Worker (`/public/service-worker.js`)
- Caches essential application files
- Handles fetch events for offline access
- Implements background sync for cached scans

### 2. Web App Manifest (`/public/manifest.json`)
- Defines app name, icons, and display properties
- Enables installation on mobile devices

### 3. Custom Hooks
- `useCameraAccess.ts` - Manages camera permissions and access
- `useScanner.ts` - Handles QR and barcode scanning
- `usePWAStorage.ts` - Manages offline caching and sync

### 4. Components
- `ScannerView.jsx` - Main scanner component using the hooks
- `ScanOverlay.jsx` - Visual feedback for scanning process

## Setup Instructions

### 1. Icons
To complete the PWA setup, you need to add app icons:
1. Create a folder: `/public/icons/`
2. Add the following icon sizes:
   - `icon-192x192.png`
   - `icon-256x256.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

### 2. HTTPS Requirement
Camera access requires a secure context (HTTPS). For local development:
- Use `npm run dev` which serves on localhost (secure context)
- For production, ensure your server uses HTTPS

### 3. Testing the PWA
1. Build the application: `npm run build`
2. Preview the build: `npm run preview`
3. Open in browser and check:
   - Install prompt should appear
   - Offline functionality works
   - Camera access functions properly

## Browser Compatibility

### Supported Browsers
- Chrome 60+
- Firefox 70+
- Safari 11.1+
- Edge 79+

### Mobile Support
- iOS Safari 11.3+
- Android Chrome 60+
- Android Firefox 70+

## Offline Functionality
When the app is offline:
1. Scans are cached locally in localStorage
2. UI shows "Offline" status with pending scan count
3. When connectivity is restored, pending scans automatically sync
4. Successful sync marks scans as completed

## Troubleshooting

### Camera Access Issues
1. Ensure you're using HTTPS (or localhost for development)
2. Check browser permissions for camera access
3. Verify the device has a working camera
4. Try refreshing the page

### Installation Issues
1. Make sure all icons are properly sized and located
2. Check that the manifest.json is correctly formatted
3. Verify service worker registration in browser dev tools

### Sync Problems
1. Check browser console for errors
2. Ensure the backend API is accessible
3. Verify network connectivity