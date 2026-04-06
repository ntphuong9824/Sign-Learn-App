import { useRef, useEffect, useState } from 'react';
import type { Landmark } from '../../types/translation';

interface AvatarPoseViewerProps {
  landmarks: Landmark[][];
  width?: number;
  height?: number;
  spriteUrl?: string;
}

export function AvatarPoseViewer({ landmarks, width = 640, height = 480 }: AvatarPoseViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || landmarks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentLandmarks = landmarks[frameIndex];
    if (!currentLandmarks) return;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#f4f3ec';
    ctx.fillRect(0, 0, width, height);

    // Scale landmarks to canvas
    const scaleX = width;
    const scaleY = height;

    // Draw avatar silhouette (simplified - in production would use sprite/skin rendering)
    ctx.fillStyle = '#aa3bff';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;

    // Head
    const nose = currentLandmarks[0];
    if (nose && nose.visibility > 0.5) {
      ctx.beginPath();
      ctx.arc(nose.x * scaleX, nose.y * scaleY, 25, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    // Body (simplified avatar representation)
    currentLandmarks[11]; // shoulder reference
    const rightShoulder = currentLandmarks[12];
    const leftShoulder = currentLandmarks[11];
    const rightElbow = currentLandmarks[14];
    const leftElbow = currentLandmarks[13];
    const rightWrist = currentLandmarks[16];
    const leftWrist = currentLandmarks[15];

    // Torso
    ctx.beginPath();
    ctx.moveTo(leftShoulder?.x * scaleX || 0, leftShoulder?.y * scaleY || 0);
    ctx.lineTo(rightShoulder?.x * scaleX || 0, rightShoulder?.y * scaleY || 0);
    ctx.lineTo(rightShoulder?.x * scaleX || 0, (rightShoulder?.y || 0) * scaleY + 100);
    ctx.lineTo((rightShoulder?.x || 0) * scaleX - 30, (rightShoulder?.y || 0) * scaleY + 150);
    ctx.lineTo((leftShoulder?.x || 0) * scaleX + 30, (leftShoulder?.y || 0) * scaleY + 150);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Arms
    const drawArm = (shoulder: Landmark | undefined, elbow: Landmark | undefined, wrist: Landmark | undefined) => {
      if (!shoulder || !elbow || !wrist) return;
      if (shoulder.visibility < 0.5 || elbow.visibility < 0.5 || wrist.visibility < 0.5) return;

      ctx.beginPath();
      ctx.moveTo(shoulder.x * scaleX, shoulder.y * scaleY);
      ctx.lineTo(elbow.x * scaleX, elbow.y * scaleY);
      ctx.lineTo(wrist.x * scaleX, wrist.y * scaleY);
      ctx.stroke();
    };

    drawArm(rightShoulder, rightElbow, rightWrist);
    drawArm(leftShoulder, leftElbow, leftWrist);

  }, [landmarks, frameIndex, width, height]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % landmarks.length);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, landmarks.length]);

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded border border-[var(--border)]"
      />
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-4 py-2 bg-[var(--accent)] text-white rounded"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <span className="text-sm">
          Frame: {frameIndex + 1} / {landmarks.length}
        </span>
        <input
          type="range"
          min={0}
          max={landmarks.length - 1}
          value={frameIndex}
          onChange={(e) => setFrameIndex(Number(e.target.value))}
          className="flex-1"
        />
      </div>
    </div>
  );
}