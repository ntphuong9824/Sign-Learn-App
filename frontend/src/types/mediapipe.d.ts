declare module '@mediapipe/pose/pose.js' {
  export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility: number;
  }

  export interface PoseOptions {
    modelComplexity?: 0 | 1 | 2;
    smoothLandmarks?: boolean;
    enableSegmentation?: boolean;
    smoothSegmentation?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export interface PoseResults {
    poseLandmarks?: Landmark[];
    poseWorldLandmarks?: Landmark[];
  }

  export class Pose {
    constructor(options?: { locateFile: (file: string) => string });
    setOptions(options: PoseOptions): Promise<void>;
    initialize(): Promise<void>;
    onResults(callback: (results: PoseResults) => void): void;
    send(data: { image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement }): Promise<void>;
    close(): Promise<void>;
  }
}

declare module '@mediapipe/hands/hands.js' {
  export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility: number;
  }

  export interface HandsOptions {
    modelComplexity?: 0 | 1;
    maxNumHands?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export interface HandsResults {
    multiHandLandmarks?: Landmark[][];
    multiHandedness?: { label: string; score: number; index: number }[];
    multiHandWorldLandmarks?: Landmark[][];
  }

  export class Hands {
    constructor(options?: { locateFile: (file: string) => string });
    setOptions(options: HandsOptions): Promise<void>;
    initialize(): Promise<void>;
    onResults(callback: (results: HandsResults) => void): void;
    send(data: { image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement }): Promise<void>;
    close(): Promise<void>;
  }
}
