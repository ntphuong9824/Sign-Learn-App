import { useRef, useEffect, useState } from 'react';
import type { Landmark } from '../../types/translation';

interface SkeletonPoseViewerProps {
  landmarks: Landmark[][];
  width?: number;
  height?: number;
}

const POSE_CONNECTIONS = [
  [11, 12], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
  [18, 20], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [17, 19], [12, 24], [24, 23], [23, 11], [24, 26], [26, 28],
  [28, 30], [30, 32], [32, 34], [23, 25], [25, 27], [27, 29],
  [29, 31], [31, 33], [25, 27], [27, 29], [29, 31],
];

const HAND_CONNECTIONS = new Set([
  '15-17',
  '15-19',
  '15-21',
  '17-19',
  '16-18',
  '16-20',
  '16-22',
  '18-20',
]);

const HAND_LANDMARK_INDICES = new Set([15, 16, 17, 18, 19, 20, 21, 22]);

const SYNTHETIC_MIDDLE_FINGER_HANDS = [
  { wrist: 15, elbow: 13, index: 19, pinky: 17, color: '#facc15' },
  { wrist: 16, elbow: 14, index: 20, pinky: 18, color: '#22d3ee' },
] as const;

export function SkeletonPoseViewer({ landmarks, width = 640, height = 480 }: SkeletonPoseViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || landmarks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentLandmarks = landmarks[frameIndex];
    if (!currentLandmarks) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    const scaleX = width;
    const scaleY = height;

    const drawLine = (start: Landmark, end: Landmark, color: string, width: number) => {
      // Outline first to keep the stroke visible on dark backgrounds.
      ctx.strokeStyle = '#05070d';
      ctx.lineWidth = width + 3;
      ctx.beginPath();
      ctx.moveTo(start.x * scaleX, start.y * scaleY);
      ctx.lineTo(end.x * scaleX, end.y * scaleY);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(start.x * scaleX, start.y * scaleY);
      ctx.lineTo(end.x * scaleX, end.y * scaleY);
      ctx.stroke();
    };

    // Draw connections
    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      const start = currentLandmarks[startIdx];
      const end = currentLandmarks[endIdx];
      if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
        const key = `${startIdx}-${endIdx}`;
        const reverseKey = `${endIdx}-${startIdx}`;
        const isHandConnection = HAND_CONNECTIONS.has(key) || HAND_CONNECTIONS.has(reverseKey);
        drawLine(start, end, isHandConnection ? '#22d3ee' : '#c084fc', isHandConnection ? 3 : 2);
      }
    }

    // MediaPipe pose has no dedicated middle-finger tip, so draw a synthetic ray for visibility.
    for (const hand of SYNTHETIC_MIDDLE_FINGER_HANDS) {
      const wrist = currentLandmarks[hand.wrist];
      const elbow = currentLandmarks[hand.elbow];
      const indexTip = currentLandmarks[hand.index];
      const pinkyTip = currentLandmarks[hand.pinky];

      if (!wrist || wrist.visibility <= 0.5) {
        continue;
      }

      let targetX: number;
      let targetY: number;

      if (indexTip && pinkyTip && indexTip.visibility > 0.45 && pinkyTip.visibility > 0.45) {
        const midX = (indexTip.x + pinkyTip.x) / 2;
        const midY = (indexTip.y + pinkyTip.y) / 2;
        targetX = wrist.x + (midX - wrist.x) * 1.25;
        targetY = wrist.y + (midY - wrist.y) * 1.25;
      } else if (elbow && elbow.visibility > 0.45) {
        const dx = wrist.x - elbow.x;
        const dy = wrist.y - elbow.y;
        targetX = wrist.x + dx * 0.55;
        targetY = wrist.y + dy * 0.55;
      } else {
        continue;
      }

      const syntheticTip: Landmark = {
        x: targetX,
        y: targetY,
        z: wrist.z,
        visibility: 1,
      };

      drawLine(wrist, syntheticTip, hand.color, 3);
    }

    // Draw landmarks
    for (const [index, landmark] of currentLandmarks.entries()) {
      if (landmark.visibility > 0.5) {
        const isHandLandmark = HAND_LANDMARK_INDICES.has(index);
        const radius = isHandLandmark ? 6 : 5;

        ctx.fillStyle = '#05070d';
        ctx.beginPath();
        ctx.arc(landmark.x * scaleX, landmark.y * scaleY, radius + 2, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = isHandLandmark ? '#facc15' : '#aa3bff';
        ctx.beginPath();
        ctx.arc(landmark.x * scaleX, landmark.y * scaleY, radius, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, [landmarks, frameIndex, width, height]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded border border-[var(--border)]"
      />
      {landmarks.length > 1 && (
        <input
          type="range"
          min={0}
          max={landmarks.length - 1}
          value={frameIndex}
          onChange={(e) => setFrameIndex(Number(e.target.value))}
          className="w-full mt-2"
        />
      )}
    </div>
  );
}
