import { useRef, useEffect, useState } from 'react';
import type { Landmark } from '../../types/translation';

interface HumanPoseViewerProps {
  landmarks: Landmark[][];
  width?: number;
  height?: number;
}

export function HumanPoseViewer({ landmarks, width = 640, height = 480 }: HumanPoseViewerProps) {
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

    // Draw semi-transparent body fill
    ctx.fillStyle = 'rgba(170, 59, 255, 0.2)';
    ctx.strokeStyle = '#aa3bff';
    ctx.lineWidth = 3;

    // Simplified body drawing based on pose landmarks
    const drawLimb = (start: Landmark, end: Landmark) => {
      if (start.visibility > 0.5 && end.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x * width, start.y * height);
        ctx.lineTo(end.x * width, end.y * height);
        ctx.stroke();
      }
    };

    // Body connections
    const bodyConnections = [
      [11, 12], [12, 14], [14, 16], // Right arm
      [11, 13], [13, 15], [15, 17], // Left arm
      [12, 24], [24, 23], [23, 11], // Torso
      [24, 26], [26, 28], // Right leg
      [23, 25], [25, 27], // Left leg
    ];

    for (const [i, j] of bodyConnections) {
      if (currentLandmarks[i] && currentLandmarks[j]) {
        drawLimb(currentLandmarks[i], currentLandmarks[j]);
      }
    }

    // Draw head
    const nose = currentLandmarks[0];
    if (nose && nose.visibility > 0.5) {
      ctx.beginPath();
      ctx.arc(nose.x * width, nose.y * height, 15, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    // Draw face points
    for (let i = 1; i <= 10; i++) {
      const point = currentLandmarks[i];
      if (point && point.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#c084fc';
        ctx.fill();
      }
    }

  }, [landmarks, frameIndex, width, height]);

  // Auto-play animation
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
        className="rounded border border-[var(--border)] bg-[var(--bg)]"
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
        {landmarks.length > 1 && (
          <input
            type="range"
            min={0}
            max={landmarks.length - 1}
            value={frameIndex}
            onChange={(e) => setFrameIndex(Number(e.target.value))}
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
}