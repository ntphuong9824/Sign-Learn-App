import { useState, useCallback, useRef, useEffect } from 'react';
import { getMediaPipeService, type CombinedPoseResult } from '../services/mediaPipeService';

interface UsePoseDetectionOptions {
  poseModelType?: 'lite' | 'full' | 'heavy';
  handsModelComplexity?: 0 | 1;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  targetFps?: number; // Target frames per second for detection
}

interface UsePoseDetectionReturn {
  isModelLoaded: boolean;
  isProcessing: boolean;
  error: string | null;
  currentPose: CombinedPoseResult | null;
  detectPose: (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => Promise<CombinedPoseResult | null>;
  detectPoseFromVideo: (video: HTMLVideoElement, onResult?: (pose: CombinedPoseResult) => void) => void;
  stopDetection: () => void;
}

// Default target FPS for pose detection
const DEFAULT_TARGET_FPS = 30;

/**
 * Hook for pose detection using MediaPipe
 * Updated to use MediaPipeService instead of placeholder
 * Fixed: Added frame rate limiting to prevent infinite loop
 */
export function usePoseDetection({
  poseModelType = 'full',
  handsModelComplexity = 1,
  minDetectionConfidence = 0.5,
  minTrackingConfidence = 0.5,
  targetFps = DEFAULT_TARGET_FPS,
}: UsePoseDetectionOptions = {}): UsePoseDetectionReturn {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPose, setCurrentPose] = useState<CombinedPoseResult | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const isDetectingRef = useRef(false);
  const onResultRef = useRef<((pose: CombinedPoseResult) => void) | null>(null);
  const lastFrameTimeRef = useRef(0);

  const mediaPipeService = useRef(getMediaPipeService({
    poseModelType,
    handsModelComplexity,
    minDetectionConfidence,
    minTrackingConfidence,
  }));

  // Initialize model on mount
  useEffect(() => {
    const initModel = async () => {
      try {
        await mediaPipeService.current.initialize();
        setIsModelLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize MediaPipe');
      }
    };

    initModel();

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      mediaPipeService.current.dispose();
    };
  }, [poseModelType, handsModelComplexity, minDetectionConfidence, minTrackingConfidence]);

  const detectPose = useCallback(async (
    imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): Promise<CombinedPoseResult | null> => {
    if (!isModelLoaded) {
      setError('MediaPipe model not loaded');
      return null;
    }

    // Check for valid dimensions
    let hasValidDimensions = false;
    if (imageElement instanceof HTMLVideoElement) {
      hasValidDimensions = imageElement.videoWidth > 0 && imageElement.videoHeight > 0;
    } else if (imageElement instanceof HTMLImageElement) {
      hasValidDimensions = imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0;
    } else if (imageElement instanceof HTMLCanvasElement) {
      hasValidDimensions = imageElement.width > 0 && imageElement.height > 0;
    }

    if (!hasValidDimensions) {
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await mediaPipeService.current.detect(imageElement);
      setCurrentPose(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pose detection failed');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isModelLoaded]);

  const stopDetection = useCallback(() => {
    isDetectingRef.current = false;
    onResultRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const detectPoseFromVideo = useCallback((
    video: HTMLVideoElement,
    onResult?: (pose: CombinedPoseResult) => void
  ) => {
    if (!isModelLoaded) {
      setError('MediaPipe model not loaded');
      return;
    }

    // Stop any existing detection before starting a new one
    if (isDetectingRef.current) {
      stopDetection();
    }

    isDetectingRef.current = true;
    onResultRef.current = onResult || null;
    lastFrameTimeRef.current = 0;

    const frameInterval = 1000 / targetFps;

    const detectFrame = async (timestamp: number) => {
      if (!isDetectingRef.current) return;

      // Frame rate limiting
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }
      lastFrameTimeRef.current = timestamp;

      const pose = await detectPose(video);

      // Check again after async operation - we may have stopped during detection
      if (!isDetectingRef.current) return;

      if (pose && onResultRef.current) {
        onResultRef.current(pose);
      }

      // Only request next frame if still detecting
      if (isDetectingRef.current) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(detectFrame);
  }, [isModelLoaded, detectPose, targetFps, stopDetection]);

  return {
    isModelLoaded,
    isProcessing,
    error,
    currentPose,
    detectPose,
    detectPoseFromVideo,
    stopDetection,
  };
}