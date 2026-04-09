import { useState, useCallback } from 'react';

interface AnimationFrame {
  timestamp: number;
  joints: Record<string, { x: number; y: number; z: number; w: number }>;
}

interface AnimationState {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  frames: AnimationFrame[];
}

// TODO: Integrate with TensorFlow.js for actual animation processing
// The legacy animation.service.ts contains ML model logic that needs TF.js

export function useAnimation() {
  const [state, setState] = useState<AnimationState>({
    isPlaying: false,
    currentFrame: 0,
    totalFrames: 0,
    frames: [],
  });

  const loadAnimation = useCallback((frames: AnimationFrame[]) => {
    setState({
      isPlaying: false,
      currentFrame: 0,
      totalFrames: frames.length,
      frames,
    });
  }, []);

  const play = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const seekTo = useCallback((frame: number) => {
    setState((prev) => ({
      ...prev,
      currentFrame: Math.max(0, Math.min(frame, prev.totalFrames - 1)),
    }));
  }, []);

  const nextFrame = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentFrame: Math.min(prev.currentFrame + 1, prev.totalFrames - 1),
    }));
  }, []);

  const previousFrame = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentFrame: Math.max(prev.currentFrame - 1, 0),
    }));
  }, []);

  const getCurrentFrame = useCallback(() => {
    return state.frames[state.currentFrame] || null;
  }, [state.currentFrame, state.frames]);

  return {
    state,
    loadAnimation,
    play,
    pause,
    seekTo,
    nextFrame,
    previousFrame,
    getCurrentFrame,
  };
}

// Animation constants (simplified)
export const ANIMATION_JOINTS = [
  'mixamorigHead', 'mixamorigNeck', 'mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2', 'mixamorigHips',
  'mixamorigLeftUpLeg', 'mixamorigLeftLeg', 'mixamorigLeftToeBase', 'mixamorigLeftFoot',
  'mixamorigLeftArm', 'mixamorigLeftShoulder', 'mixamorigLeftForeArm', 'mixamorigLeftHand',
  'mixamorigRightUpLeg', 'mixamorigRightLeg', 'mixamorigRightToeBase', 'mixamorigRightFoot',
  'mixamorigRightArm', 'mixamorigRightShoulder', 'mixamorigRightForeArm', 'mixamorigRightHand',
] as const;

export type AnimationJoint = typeof ANIMATION_JOINTS[number];