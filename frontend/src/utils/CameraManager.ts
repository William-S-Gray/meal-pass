// enhanced-camera-access.js - Robust camera initialization
class CameraManager {
  private stream: MediaStream | null = null;
  private constraints: MediaStreamConstraints = {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  };

  async initializeCamera(videoElement: HTMLVideoElement): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
    try {
      // Check for browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support camera access');
      }

      // Try with ideal constraints first
      this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
      videoElement.srcObject = this.stream;
      return { success: true, stream: this.stream };
    } catch (primaryError) {
      console.warn('Primary camera access failed:', primaryError);
      
      // Fallback to basic constraints
      try {
        const fallbackConstraints: MediaStreamConstraints = { video: true, audio: false };
        this.stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        videoElement.srcObject = this.stream;
        return { success: true, stream: this.stream };
      } catch (fallbackError) {
        console.error('Fallback camera access failed:', fallbackError);
        return { 
          success: false, 
          error: this.getErrorMessage(fallbackError as Error) 
        };
      }
    }
  }

  private getErrorMessage(error: Error): string {
    if (error.name) {
      switch (error.name) {
        case 'NotAllowedError':
          return 'Camera access denied. Please grant permission to use the camera.';
        case 'NotFoundError':
          return 'No camera found. Please connect a camera and try again.';
        case 'NotReadableError':
          return 'Camera is being used by another application.';
        case 'OverconstrainedError':
          return 'Camera constraints cannot be satisfied.';
        default:
          return `Camera error: ${error.message}`;
      }
    }
    return `Camera error: ${error.message}`;
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async getCapabilities(): Promise<MediaTrackCapabilities | null> {
    if (!this.stream) return null;
    
    const videoTrack = this.stream.getVideoTracks()[0];
    return videoTrack.getCapabilities ? videoTrack.getCapabilities() : null;
  }
}

export default CameraManager;