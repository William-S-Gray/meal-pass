import { useState, useCallback, useRef } from 'react';

// Hook for Camera functionality
export const useCamera = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async (
    videoElement: HTMLVideoElement | null,
    constraints: MediaStreamConstraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    }
  ): Promise<boolean> => {
    if (!videoElement) return false;

    try {
      setIsLoading(true);
      setError(null);

      // Check if we're in a secure context (required for camera access)
      if (typeof window !== 'undefined' && window.isSecureContext === false) {
        throw new Error('Camera access requires a secure connection (HTTPS)');
      }

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
              facingMode: 'environment'
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
        videoElement.style.display = 'block';

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

      return true;
    } catch (err) {
      console.error('Failed to start camera:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    } catch (err) {
      console.warn('Error stopping camera:', err);
    }
  }, []);

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
    startCamera,
    stopCamera,
    clearVideoSource,
    isLoading,
    error,
  };
};