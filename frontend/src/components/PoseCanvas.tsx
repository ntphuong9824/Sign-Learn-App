import { useRef, useEffect } from 'react';
import { getMediaPipeService, type CombinedPoseResult } from '../services/mediaPipeService';

interface PoseCanvasProps {
  pose: CombinedPoseResult | null;
  width?: number;
  height?: number;
  drawVideo?: boolean;
  drawPose?: boolean;
  videoElement?: HTMLVideoElement | HTMLImageElement | null;
  className?: string;
  mirror?: boolean; // Mirror effect for webcam (default: true)
}

/**
 * Canvas component for drawing pose landmarks
 * Migrated from sign.mt video.component.ts drawChanges method
 */
export function PoseCanvas({
  pose,
  width = 640,
  height = 480,
  drawVideo = true,
  drawPose = true,
  videoElement = null,
  className = '',
  mirror = true, // Mirror effect for webcam (default: true)
}: PoseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaPipeService = useRef(getMediaPipeService());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame if available
    if (drawVideo && videoElement) {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    }
    // Note: Don't draw white background when drawVideo is false
    // This allows the canvas to be transparent and overlay on top of video

    // Draw pose landmarks
    if (drawPose && pose) {
      mediaPipeService.current.draw(pose, ctx);
    }

    // Cleanup function
    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [pose, drawVideo, drawPose, videoElement]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        transform: mirror ? 'scaleX(-1)' : 'none', // Mirror effect for webcam
        transformOrigin: 'center',
      }}
    />
  );
}
