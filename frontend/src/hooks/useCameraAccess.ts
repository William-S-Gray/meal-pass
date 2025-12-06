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

// Hook for Camera Access Management
export const useCameraAccess = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>({
    status: 'idle',
    error: null,
    errorMessage: null
  });

  // Check if camera is supported
  const isCameraSupported = useCallback((): boolean => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  // Request camera permission
  const requestCameraAccess = useCallback(async (): Promise<boolean> => {
    if (!isCameraSupported()) {
      setCameraState({
        status: 'unsupported',
        error: 'StreamApiNotSupportedError',
        errorMessage: 'Camera API is not supported in your browser'
      });
      return false;
    }

    try {
      setCameraState({
        status: 'requesting',
        error: null,
        errorMessage: null
      });

      // Test camera access without constraints
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        setCameraState({
          status: 'denied',
          error: 'NotFoundError',
          errorMessage: 'No camera found on this device'
        });
        return false;
      }

      // Try to get permission by requesting a temporary stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Immediately stop all tracks to release the camera
      stream.getTracks().forEach(track => track.stop());
      
      setCameraState({
        status: 'granted',
        error: null,
        errorMessage: null
      });
      
      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      
      let errorType: CameraError = 'UnknownError';
      let errorMessage = 'Failed to access camera';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorType = 'PermissionDenied';
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
        } else if (err.name === 'NotFoundError') {
          errorType = 'NotFoundError';
          errorMessage = 'No camera found on this device';
        } else if (err.name === 'NotSupportedError') {
          errorType = 'NotSupportedError';
          errorMessage = 'Camera is not supported on this device';
        } else if (err.name === 'OverconstrainedError') {
          errorType = 'OverconstrainedError';
          errorMessage = 'Camera constraints cannot be satisfied';
        } else {
          errorMessage = err.message || 'Unknown camera error';
        }
      }
      
      setCameraState({
        status: 'denied',
        error: errorType,
        errorMessage
      });
      
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
    if (!videoElement) {
      setCameraState({
        status: 'error',
        error: 'UnknownError',
        errorMessage: 'Video element is required'
      });
      return false;
    }

    if (!isCameraSupported()) {
      setCameraState({
        status: 'unsupported',
        error: 'StreamApiNotSupportedError',
        errorMessage: 'Camera API is not supported in your browser'
      });
      return false;
    }

    try {
      setCameraState(prev => ({
        ...prev,
        status: 'requesting',
        error: null,
        errorMessage: null
      }));

      // Stop any existing stream
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

      // Get new stream with fallback constraints
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (primaryError) {
        console.warn('Primary camera constraints failed, trying fallback:', primaryError);
        try {
          // Fallback to simpler constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' }
            }
          });
        } catch (fallbackError) {
          console.warn('Fallback camera constraints failed:', fallbackError);
          // Last resort - any camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }

      // Store the stream reference for cleanup
      streamRef.current = stream;

      // Attach stream to video element
      if (videoElement) {
        videoElement.srcObject = stream;
        
        // iOS Safari specific fixes
        videoElement.playsInline = true;
        videoElement.muted = true;
        
        // Ensure the video element is properly loaded
        videoElement.load();

        // Wait for video to be ready with timeout
        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => {
            videoElement.removeEventListener('canplay', onCanPlay);
            clearTimeout(timeoutId);
            resolve();
          };

          const onError = (e: Event) => {
            videoElement.removeEventListener('canplay', onCanPlay);
            videoElement.removeEventListener('error', onError);
            clearTimeout(timeoutId);
            reject(new Error('Video failed to load'));
          };

          // Timeout to prevent hanging
          const timeoutId = setTimeout(() => {
            videoElement.removeEventListener('canplay', onCanPlay);
            videoElement.removeEventListener('error', onError);
            reject(new Error('Video loading timed out'));
          }, 5000);

          videoElement.addEventListener('canplay', onCanPlay);
          videoElement.addEventListener('error', onError);

          // Try to play the video
          videoElement.play().catch(reject);
        });
      }

      setCameraState({
        status: 'granted',
        error: null,
        errorMessage: null
      });

      return true;
    } catch (err) {
      console.error('Failed to start camera:', err);
      
      let errorType: CameraError = 'UnknownError';
      let errorMessage = 'Failed to start camera';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorType = 'PermissionDenied';
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
        } else if (err.name === 'NotFoundError') {
          errorType = 'NotFoundError';
          errorMessage = 'No camera found on this device';
        } else if (err.name === 'NotSupportedError') {
          errorType = 'NotSupportedError';
          errorMessage = 'Camera is not supported on this device';
        } else if (err.name === 'OverconstrainedError') {
          errorType = 'OverconstrainedError';
          errorMessage = 'Camera constraints cannot be satisfied';
        } else {
          errorMessage = err.message || 'Unknown camera error';
        }
      }
      
      setCameraState({
        status: 'error',
        error: errorType,
        errorMessage
      });
      
      return false;
    }
  }, [isCameraSupported]);

  // Stop camera
  const stopCamera = useCallback(() => {
    try {
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