import { useState, useCallback, useRef } from 'react';

// Types
export type CameraStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported' | 'error';
export type CameraError = 
  | 'PermissionDenied'
  | 'NotFoundError'
  | 'NotSupportedError'
  | 'NotAllowedError'
  | 'OverconstrainedError'
  | 'StreamApiNotSupportedError'
  | 'UnknownError';

export interface CameraState {
  status: CameraStatus;
  error: CameraError | null;
  errorMessage: string | null;
}

// More descriptive error messages
const ERROR_MESSAGES = {
  PermissionDenied: 'Camera permission denied. Please allow camera access in your browser settings.',
  NotFoundError: 'No camera found on this device.',
  NotSupportedError: 'Camera is not supported on this device.',
  NotAllowedError: 'Camera access was denied. Please check your browser permissions.',
  OverconstrainedError: 'Camera constraints cannot be satisfied.',
  StreamApiNotSupportedError: 'Camera API is not supported in your browser.',
  UnknownError: 'An unknown error occurred while accessing the camera.'
};

// Hook for Camera Access Management
export const useCameraAccess = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>({
    status: 'idle',
    error: null,
    errorMessage: null
  });
  
  const cameraOperationLockRef = useRef(false); // Prevent concurrent camera operations

  // Check if camera is supported
  const isCameraSupported = useCallback((): boolean => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  // Request camera permission
  const requestCameraAccess = useCallback(async (): Promise<boolean> => {
    console.log('=== REQUEST CAMERA ACCESS STARTED ===');
    
    // Prevent concurrent operations
    if (cameraOperationLockRef.current) {
      console.log('Camera operation already in progress, skipping...');
      return false;
    }
    
    if (!isCameraSupported()) {
      console.error('Camera is not supported in this browser');
      setCameraState({
        status: 'unsupported',
        error: 'StreamApiNotSupportedError',
        errorMessage: ERROR_MESSAGES.StreamApiNotSupportedError
      });
      console.log('=== REQUEST CAMERA ACCESS FAILED - UNSUPPORTED ===');
      return false;
    }

    try {
      // Set operation lock
      cameraOperationLockRef.current = true;
      
      setCameraState({
        status: 'requesting',
        error: null,
        errorMessage: null
      });
      console.log('Camera state set to requesting');

      // Test camera access without constraints
      console.log('Enumerating devices...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('Available devices:', devices);
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Video devices found:', videoDevices);
      
      if (videoDevices.length === 0) {
        console.log('No video devices found');
        setCameraState({
          status: 'denied',
          error: 'NotFoundError',
          errorMessage: ERROR_MESSAGES.NotFoundError
        });
        console.log('=== REQUEST CAMERA ACCESS FAILED - NO DEVICES ===');
        // Release operation lock
        cameraOperationLockRef.current = false;
        return false;
      }

      console.log('Requesting camera permission...');
      // Try to get permission by requesting a temporary stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Camera permission granted, stream received:', stream);
      
      // Immediately stop all tracks to release the camera
      console.log('Stopping tracks to release camera...');
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track);
        track.stop();
      });
      
      setCameraState({
        status: 'granted',
        error: null,
        errorMessage: null
      });
      console.log('Camera state set to granted');
      console.log('=== REQUEST CAMERA ACCESS COMPLETED SUCCESSFULLY ===');
      
      // Release operation lock
      cameraOperationLockRef.current = false;
      
      return true;
    } catch (err) {
      console.error('=== REQUEST CAMERA ACCESS FAILED ===');
      console.error('Camera access error:', err);
      
      // Release operation lock on error
      cameraOperationLockRef.current = false;
      
      let errorType: CameraError = 'UnknownError';
      let errorMessage = ERROR_MESSAGES.UnknownError;
      
      if (err instanceof Error) {
        console.log('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        
        // Map error names to our error types
        switch (err.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            errorType = 'PermissionDenied';
            errorMessage = ERROR_MESSAGES.PermissionDenied;
            break;
          case 'NotFoundError':
            errorType = 'NotFoundError';
            errorMessage = ERROR_MESSAGES.NotFoundError;
            break;
          case 'NotSupportedError':
            errorType = 'NotSupportedError';
            errorMessage = ERROR_MESSAGES.NotSupportedError;
            break;
          case 'OverconstrainedError':
            errorType = 'OverconstrainedError';
            errorMessage = ERROR_MESSAGES.OverconstrainedError;
            break;
          default:
            errorMessage = err.message || ERROR_MESSAGES.UnknownError;
        }
      }
      
      setCameraState({
        status: 'denied',
        error: errorType,
        errorMessage
      });
      
      console.log('=== REQUEST CAMERA ACCESS FAILED WITH ERROR ===');
      return false;
    }
  }, [isCameraSupported]);

  // Start camera with specified constraints
  const startCamera = useCallback(async (
    videoElement: HTMLVideoElement | null,
    constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    }
  ): Promise<boolean> => {
    console.log('=== START CAMERA FUNCTION CALLED ===');
    console.log('Parameters:', { videoElement, constraints });
    
    // Prevent concurrent operations
    if (cameraOperationLockRef.current) {
      console.log('Camera operation already in progress, skipping...');
      return false;
    }
    
    if (!videoElement) {
      console.error('Video element is required but was null');
      setCameraState({
        status: 'error',
        error: 'UnknownError',
        errorMessage: 'Video element is required'
      });
      console.log('=== START CAMERA FAILED - NO VIDEO ELEMENT ===');
      return false;
    }

    if (!isCameraSupported()) {
      console.error('Camera is not supported in this browser');
      setCameraState({
        status: 'unsupported',
        error: 'StreamApiNotSupportedError',
        errorMessage: ERROR_MESSAGES.StreamApiNotSupportedError
      });
      console.log('=== START CAMERA FAILED - UNSUPPORTED ===');
      return false;
    }

    try {
      console.log('Setting camera state to requesting...');
      // Set operation lock
      cameraOperationLockRef.current = true;
      
      setCameraState(prev => ({
        ...prev,
        status: 'requesting',
        error: null,
        errorMessage: null
      }));

      // Stop any existing stream
      console.log('Checking for existing stream...');
      if (streamRef.current) {
        console.log('Existing stream found, stopping tracks...');
        streamRef.current.getTracks().forEach(track => {
          try {
            console.log('Stopping track:', track);
            track.stop();
          } catch (e) {
            console.warn('Failed to stop track:', e);
          }
        });
        streamRef.current = null;
        console.log('Existing stream cleaned up');
      }

      // Get new stream with fallback constraints
      console.log('Requesting new media stream with constraints:', constraints);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Primary constraints successful, stream obtained:', stream);
      } catch (primaryError) {
        console.warn('Primary camera constraints failed, trying fallback:', primaryError);
        try {
          // Fallback to simpler constraints
          console.log('Trying fallback constraints...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' }
            }
          });
          console.log('Fallback constraints successful, stream obtained:', stream);
        } catch (fallbackError) {
          console.warn('Fallback camera constraints failed:', fallbackError);
          // Last resort - any camera
          console.log('Trying last resort constraints...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          console.log('Last resort constraints successful, stream obtained:', stream);
        }
      }

      // Store the stream reference for cleanup
      console.log('Storing stream reference...');
      streamRef.current = stream;

      // Attach stream to video element
      console.log('Attaching stream to video element...');
      if (videoElement) {
        videoElement.srcObject = stream;
        console.log('Stream attached to video element');
        
        // iOS Safari specific fixes
        videoElement.playsInline = true;
        videoElement.muted = true;
        console.log('Applied iOS Safari fixes');
        
        // Ensure the video element is properly loaded
        videoElement.load();
        console.log('Called videoElement.load()');

        // Wait for video to be ready with timeout
        console.log('Waiting for video to be ready...');
        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => {
            videoElement.removeEventListener('canplay', onCanPlay);
            clearTimeout(timeoutId);
            console.log('Video can play event received');
            resolve();
          };

          const onError = (e: Event) => {
            videoElement.removeEventListener('canplay', onCanPlay);
            videoElement.removeEventListener('error', onError);
            clearTimeout(timeoutId);
            console.error('Video error event received:', e);
            reject(new Error('Video failed to load'));
          };

          // Timeout to prevent hanging
          const timeoutId = setTimeout(() => {
            videoElement.removeEventListener('canplay', onCanPlay);
            videoElement.removeEventListener('error', onError);
            console.error('Video loading timed out');
            reject(new Error('Video loading timed out'));
          }, 5000);

          videoElement.addEventListener('canplay', onCanPlay);
          videoElement.addEventListener('error', onError);

          // Try to play the video
          console.log('Attempting to play video...');
          videoElement.play().catch(err => {
            console.warn('Video play failed:', err);
            // Don't reject here, as canplay event might still come
          });
        });
      }

      console.log('Setting camera state to granted...');
      setCameraState({
        status: 'granted',
        error: null,
        errorMessage: null
      });

      console.log('=== START CAMERA COMPLETED SUCCESSFULLY ===');
      
      // Release operation lock
      cameraOperationLockRef.current = false;
      
      return true;
    } catch (err) {
      console.error('=== START CAMERA FAILED ===');
      console.error('Failed to start camera:', err);
      
      // Release operation lock on error
      cameraOperationLockRef.current = false;
      
      let errorType: CameraError = 'UnknownError';
      let errorMessage = ERROR_MESSAGES.UnknownError;
      
      if (err instanceof Error) {
        console.log('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        
        // Map error names to our error types
        switch (err.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            errorType = 'PermissionDenied';
            errorMessage = ERROR_MESSAGES.PermissionDenied;
            break;
          case 'NotFoundError':
            errorType = 'NotFoundError';
            errorMessage = ERROR_MESSAGES.NotFoundError;
            break;
          case 'NotSupportedError':
            errorType = 'NotSupportedError';
            errorMessage = ERROR_MESSAGES.NotSupportedError;
            break;
          case 'OverconstrainedError':
            errorType = 'OverconstrainedError';
            errorMessage = ERROR_MESSAGES.OverconstrainedError;
            break;
          default:
            errorMessage = err.message || ERROR_MESSAGES.UnknownError;
        }
      }
      
      setCameraState({
        status: 'error',
        error: errorType,
        errorMessage
      });
      
      console.log('=== START CAMERA FAILED WITH ERROR ===');
      return false;
    }
  }, [isCameraSupported]);

  // Stop camera
  const stopCamera = useCallback(() => {
    try {
      // Release operation lock when stopping
      cameraOperationLockRef.current = false;
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Failed to stop track:', e);
          }
        });
        streamRef.current = null;
      }
      
      setCameraState({
        status: 'idle',
        error: null,
        errorMessage: null
      });
    } catch (err) {
      console.warn('Error stopping camera:', err);
      
      setCameraState({
        status: 'error',
        error: 'UnknownError',
        errorMessage: 'Failed to stop camera properly'
      });
    }
  }, []);

  // Clear video source
  const clearVideoSource = useCallback((videoElement: HTMLVideoElement | null) => {
    if (videoElement) {
      try {
        videoElement.srcObject = null;
      } catch (e) {
        console.warn('Failed to clear video srcObject:', e);
      }
      videoElement.style.display = 'none';
    }
  }, []);

  return {
    cameraState,
    isCameraSupported,
    requestCameraAccess,
    startCamera,
    stopCamera,
    clearVideoSource
  };
};