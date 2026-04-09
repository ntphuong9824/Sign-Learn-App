import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

interface CameraOptions {
  facingMode?: 'user' | 'environment';
  aspectRatio?: number;
  width?: { min?: number; ideal?: number; max?: number };
  height?: { min?: number; ideal?: number; max?: number };
  frameRate?: number;
}

interface UseCameraReturn {
  stream: MediaStream | null;
  isStreaming: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

/**
 * Hook for managing webcam input
 * Migrated from sign.mt video.state.ts
 */
export function useCamera(options: CameraOptions = {}): UseCameraReturn {
  const {
    facingMode = 'user',
    aspectRatio = 1,
    width = { min: 1280 },
    height = { min: 720 },
    frameRate = 120, // Minimize motion blur
  } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Memoize constraints to avoid unnecessary callback recreation
  const constraints = useMemo<MediaStreamConstraints>(() => ({
    video: {
      facingMode,
      aspectRatio,
      width,
      height,
      frameRate,
    },
    audio: false,
  }), [facingMode, aspectRatio, width, height, frameRate]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsStreaming(true);

      // Attach to video element if available
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      setIsStreaming(false);
      console.error('Camera error:', err);
    }
  }, [constraints]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsStreaming(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    stream,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    videoRef,
  };
}
