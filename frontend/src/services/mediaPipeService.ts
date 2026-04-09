import {
  HandLandmarker,
  PoseLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';

// MediaPipe landmark counts
const POSE_LANDMARK_COUNT = 33;      // Full body pose landmarks
const FACE_LANDMARK_COUNT = 468;     // MediaPipe Face Mesh
const HAND_LANDMARK_COUNT = 21;     // Hand landmarks per hand
const MIN_SCALE_THRESHOLD = 0.001;  // Minimum scale for normalization

// WasmFileset interface - not exported by @mediapipe/tasks-vision
interface WasmFileset {
  wasmLoaderPath: string;
  wasmBinaryPath: string;
  assetLoaderPath?: string;
  assetBinaryPath?: string;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface CombinedPoseResult {
  poseLandmarks: Landmark[];
  leftHandLandmarks: Landmark[] | null;
  rightHandLandmarks: Landmark[] | null;
  worldPoseLandmarks: Landmark[];
  worldLeftHandLandmarks: Landmark[] | null;
  worldRightHandLandmarks: Landmark[] | null;
}

export interface MediaPipeServiceOptions {
  poseModelType?: 'lite' | 'full' | 'heavy';
  handsModelComplexity?: 0 | 1;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

/**
 * MediaPipeService - Combines MediaPipe Pose and Hands for full skeleton detection
 * This provides accurate hand detection (21 landmarks per hand) + full body pose (33 landmarks)
 * Updated to use @mediapipe/tasks-vision which has proper ES module exports
 */
export class MediaPipeService {
  private poseLandmarker: PoseLandmarker | null = null;
  private handLandmarker: HandLandmarker | null = null;
  private isInitialized = false;
  private wasmFileset: WasmFileset | null = null;

  private options: Required<MediaPipeServiceOptions> = {
    poseModelType: 'full',
    handsModelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };

  constructor(options: MediaPipeServiceOptions = {}) {
    this.options = { ...this.options, ...options };
  }

  /**
   * Initialize MediaPipe Pose and Hands models
   * Tries GPU first, falls back to CPU if GPU initialization fails
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Wasm fileset
      this.wasmFileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );

      // Try to initialize with GPU first
      try {
        await this.initializeWithDelegate('GPU');
        console.log('MediaPipe initialized with GPU delegate');
      } catch (gpuError) {
        console.warn('GPU initialization failed, falling back to CPU:', gpuError);
        await this.initializeWithDelegate('CPU');
        console.log('MediaPipe initialized with CPU delegate');
      }

      this.isInitialized = true;
      console.log('MediaPipe Pose + Hands initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
      throw error;
    }
  }

  /**
   * Initialize MediaPipe with a specific delegate (GPU or CPU)
   */
  private async initializeWithDelegate(delegate: 'GPU' | 'CPU'): Promise<void> {
    const poseModelPath = this.getPoseModelPath();
    const handModelPath = this.getHandModelPath();

    // Initialize PoseLandmarker
    this.poseLandmarker = await PoseLandmarker.createFromOptions(
      this.wasmFileset!,
      {
        baseOptions: {
          modelAssetPath: poseModelPath,
          delegate,
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence,
        minPosePresenceConfidence: this.options.minTrackingConfidence,
      }
    );

    // Initialize HandLandmarker
    this.handLandmarker = await HandLandmarker.createFromOptions(
      this.wasmFileset!,
      {
        baseOptions: {
          modelAssetPath: handModelPath,
          delegate,
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence,
        minHandPresenceConfidence: this.options.minTrackingConfidence,
      }
    );
  }

  /**
   * Get the appropriate pose model path based on model type
   */
  private getPoseModelPath(): string {
    switch (this.options.poseModelType) {
      case 'lite':
        return 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
      case 'heavy':
        return 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task';
      case 'full':
      default:
        // Full model doesn't exist, use heavy as default
        return 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task';
    }
  }

  /**
   * Get the appropriate hand model path based on complexity
   */
  private getHandModelPath(): string {
    switch (this.options.handsModelComplexity) {
      case 0:
        return 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker_lite/float16/1/hand_landmarker_lite.task';
      case 1:
      default:
        return 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
    }
  }

  /**
   * Detect pose and hands from image element
   */
  async detect(
    imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): Promise<CombinedPoseResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Validate that models are initialized
    if (!this.poseLandmarker || !this.handLandmarker) {
      throw new Error('MediaPipe not initialized. Please call initialize() first.');
    }

    const timestamp = performance.now();

    // Run Pose detection
    const poseResults = this.poseLandmarker.detectForVideo(imageElement, timestamp);
    const poseData = this.extractPoseData(poseResults);

    // Run Hands detection
    const handsResults = this.handLandmarker.detectForVideo(imageElement, timestamp);
    const handsData = this.extractHandsData(handsResults);

    // Combine results
    return this.combineResults(poseData, handsData);
  }

  /**
   * Extract pose landmarks from PoseLandmarker results
   */
  private extractPoseData(results: PoseLandmarkerResult): {
    poseLandmarks: Landmark[];
    worldPoseLandmarks: Landmark[];
  } {
    const poseLandmarks: Landmark[] = [];
    const worldPoseLandmarks: Landmark[] = [];

    if (results.landmarks && results.landmarks.length > 0) {
      for (const landmark of results.landmarks[0]) {
        poseLandmarks.push({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z || 0,
          visibility: landmark.visibility || 0,
        });
      }
    }

    if (results.worldLandmarks && results.worldLandmarks.length > 0) {
      for (const landmark of results.worldLandmarks[0]) {
        worldPoseLandmarks.push({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z || 0,
          visibility: landmark.visibility || 0,
        });
      }
    }

    return { poseLandmarks, worldPoseLandmarks };
  }

  /**
   * Extract hand landmarks from HandLandmarker results
   * Uses handedness information from MediaPipe to correctly identify left vs right hands
   */
  private extractHandsData(results: HandLandmarkerResult): {
    leftHandLandmarks: Landmark[] | null;
    rightHandLandmarks: Landmark[] | null;
    worldLeftHandLandmarks: Landmark[] | null;
    worldRightHandLandmarks: Landmark[] | null;
  } {
    let leftHandLandmarks: Landmark[] | null = null;
    let rightHandLandmarks: Landmark[] | null = null;
    let worldLeftHandLandmarks: Landmark[] | null = null;
    let worldRightHandLandmarks: Landmark[] | null = null;

    if (results.landmarks && results.landmarks.length > 0) {
      // Use handedness information from MediaPipe to correctly identify hands
      // results.handedness contains classification for each detected hand
      if (results.handedness && results.handedness.length > 0) {
        for (let i = 0; i < results.handedness.length; i++) {
          // Get the most confident handedness classification
          // Category has index (0=Left, 1=Right) and score
          const handedness = results.handedness[i][0];
          // index 0 = Left, index 1 = Right (based on MediaPipe convention)
          const isRightHand = handedness.index === 1;

          const landmarks = results.landmarks[i].map(l => ({
            x: l.x,
            y: l.y,
            z: l.z || 0,
            visibility: l.visibility || 1,
          }));

          if (isRightHand) {
            rightHandLandmarks = landmarks;
            if (results.worldLandmarks && results.worldLandmarks.length > i) {
              worldRightHandLandmarks = results.worldLandmarks[i].map(l => ({
                x: l.x,
                y: l.y,
                z: l.z || 0,
                visibility: l.visibility || 1,
              }));
            }
          } else {
            leftHandLandmarks = landmarks;
            if (results.worldLandmarks && results.worldLandmarks.length > i) {
              worldLeftHandLandmarks = results.worldLandmarks[i].map(l => ({
                x: l.x,
                y: l.y,
                z: l.z || 0,
                visibility: l.visibility || 1,
              }));
            }
          }
        }
      } else {
        // Fallback: if no handedness info, use position-based detection
        // This is less accurate but better than arbitrary assignment
        if (results.landmarks.length >= 1) {
          const firstHand = results.landmarks[0];
          // Use x-coordinate to determine handedness (assuming mirrored webcam)
          // In mirrored view, right side of screen = left hand
          const avgX = firstHand.reduce((sum, l) => sum + l.x, 0) / firstHand.length;
          const isRightHand = avgX < 0.5; // Left side of screen = right hand in mirrored view

          if (isRightHand) {
            rightHandLandmarks = firstHand.map(l => ({
              x: l.x,
              y: l.y,
              z: l.z || 0,
              visibility: l.visibility || 1,
            }));
            if (results.worldLandmarks && results.worldLandmarks.length >= 1) {
              worldRightHandLandmarks = results.worldLandmarks[0].map(l => ({
                x: l.x,
                y: l.y,
                z: l.z || 0,
                visibility: l.visibility || 1,
              }));
            }
          } else {
            leftHandLandmarks = firstHand.map(l => ({
              x: l.x,
              y: l.y,
              z: l.z || 0,
              visibility: l.visibility || 1,
            }));
            if (results.worldLandmarks && results.worldLandmarks.length >= 1) {
              worldLeftHandLandmarks = results.worldLandmarks[0].map(l => ({
                x: l.x,
                y: l.y,
                z: l.z || 0,
                visibility: l.visibility || 1,
              }));
            }
          }

          if (results.landmarks.length >= 2) {
            const secondHand = results.landmarks[1];
            const avgX2 = secondHand.reduce((sum, l) => sum + l.x, 0) / secondHand.length;
            const isRightHand2 = avgX2 < 0.5;

            if (isRightHand2 && !rightHandLandmarks) {
              rightHandLandmarks = secondHand.map(l => ({
                x: l.x,
                y: l.y,
                z: l.z || 0,
                visibility: l.visibility || 1,
              }));
              if (results.worldLandmarks && results.worldLandmarks.length >= 2) {
                worldRightHandLandmarks = results.worldLandmarks[1].map(l => ({
                  x: l.x,
                  y: l.y,
                  z: l.z || 0,
                  visibility: l.visibility || 1,
                }));
              }
            } else if (!isRightHand2 && !leftHandLandmarks) {
              leftHandLandmarks = secondHand.map(l => ({
                x: l.x,
                y: l.y,
                z: l.z || 0,
                visibility: l.visibility || 1,
              }));
              if (results.worldLandmarks && results.worldLandmarks.length >= 2) {
                worldLeftHandLandmarks = results.worldLandmarks[1].map(l => ({
                  x: l.x,
                  y: l.y,
                  z: l.z || 0,
                  visibility: l.visibility || 1,
                }));
              }
            }
          }
        }
      }
    }

    return {
      leftHandLandmarks,
      rightHandLandmarks,
      worldLeftHandLandmarks,
      worldRightHandLandmarks,
    };
  }

  /**
   * Combine pose and hands results
   */
  private combineResults(
    poseData: { poseLandmarks: Landmark[]; worldPoseLandmarks: Landmark[] },
    handsData: {
      leftHandLandmarks: Landmark[] | null;
      rightHandLandmarks: Landmark[] | null;
      worldLeftHandLandmarks: Landmark[] | null;
      worldRightHandLandmarks: Landmark[] | null;
    }
  ): CombinedPoseResult {
    return {
      poseLandmarks: poseData.poseLandmarks,
      leftHandLandmarks: handsData.leftHandLandmarks,
      rightHandLandmarks: handsData.rightHandLandmarks,
      worldPoseLandmarks: poseData.worldPoseLandmarks,
      worldLeftHandLandmarks: handsData.worldLeftHandLandmarks,
      worldRightHandLandmarks: handsData.worldRightHandLandmarks,
    };
  }

  /**
   * Get hand connections for drawing
   */
  static getHandConnections(): [number, number][] {
    return [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index finger
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle finger
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Ring finger
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Palm
      [0, 5], [5, 9], [9, 13], [13, 17],
    ];
  }

  /**
   * Get pose connections for drawing
   */
  static getPoseConnections(): [number, number][] {
    return [
      // Face
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
      // Upper body
      [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
      [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
      // Torso
      [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
      // Lower body
      [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32],
    ];
  }

  /**
   * Normalize pose landmarks based on shoulder distance
   * Migrated from sign.mt pose.service.ts:178-213
   */
  normalizeHolistic(
    pose: CombinedPoseResult,
    components: ('poseLandmarks' | 'faceLandmarks' | 'leftHandLandmarks' | 'rightHandLandmarks')[] = [
      'poseLandmarks',
      'leftHandLandmarks',
      'rightHandLandmarks',
    ],
    normalized = true
  ): Landmark[] {
    const EMPTY_LANDMARK: Landmark = { x: 0, y: 0, z: 0, visibility: 0 };

    // Collect all landmarks from specified components
    const vectors = {
      poseLandmarks: pose.poseLandmarks || new Array(POSE_LANDMARK_COUNT).fill(EMPTY_LANDMARK),
      faceLandmarks: new Array(FACE_LANDMARK_COUNT).fill(EMPTY_LANDMARK), // Not currently extracted
      leftHandLandmarks: pose.leftHandLandmarks || new Array(HAND_LANDMARK_COUNT).fill(EMPTY_LANDMARK),
      rightHandLandmarks: pose.rightHandLandmarks || new Array(HAND_LANDMARK_COUNT).fill(EMPTY_LANDMARK),
    };

    let landmarks = components.reduce((acc, component) => acc.concat(vectors[component]), [] as Landmark[]);

    if (normalized && pose.poseLandmarks && pose.poseLandmarks.length >= 24) {
      // Use shoulder landmarks (11 = left shoulder, 12 = right shoulder)
      const p1 = pose.poseLandmarks[11];
      const p2 = pose.poseLandmarks[12];

      // Calculate scale (distance between shoulders)
      const scale = Math.sqrt(
        (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2 + (p2.z - p1.z) ** 2
      );

      // Validate scale to prevent division by zero
      if (scale < MIN_SCALE_THRESHOLD) {
        console.warn('Shoulder distance too small for normalization, returning unnormalized landmarks');
        return landmarks;
      }

      // Calculate midpoint
      const dx = (p1.x + p2.x) / 2;
      const dy = (p1.y + p2.y) / 2;
      const dz = (p1.z + p2.z) / 2;

      // Normalize all non-zero landmarks
      landmarks = landmarks.map(l => ({
        x: l.x === 0 ? 0 : (l.x - dx) / scale,
        y: l.y === 0 ? 0 : (l.y - dy) / scale,
        z: l.z === 0 ? 0 : (l.z - dz) / scale,
        visibility: l.visibility,
      }));
    }

    return landmarks;
  }

  /**
   * Draw a line between two landmarks
   */
  private drawConnect(
    connectors: [Landmark, Landmark][],
    ctx: CanvasRenderingContext2D,
    color = '#00FF00',
    lineWidth = 2
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    for (const connector of connectors) {
      const [from, to] = connector;
      if (from && to) {
        // Skip if visibility is too low
        if ((from.visibility && from.visibility < 0.1) || (to.visibility && to.visibility < 0.1)) {
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(from.x * ctx.canvas.width, from.y * ctx.canvas.height);
        ctx.lineTo(to.x * ctx.canvas.width, to.y * ctx.canvas.height);
        ctx.stroke();
      }
    }
  }

  /**
   * Draw hand landmarks with connections
   */
  drawHand(
    landmarks: Landmark[],
    ctx: CanvasRenderingContext2D,
    lineColor = '#00FF00',
    dotColor = '#00FF00',
    dotFillColor = '#FF0000'
  ): void {
    const connections = MediaPipeService.getHandConnections();

    // Draw connections
    this.drawConnect(
      connections.map(([from, to]) => [landmarks[from], landmarks[to]]),
      ctx,
      lineColor
    );

    // Draw landmarks
    for (const landmark of landmarks) {
      if (landmark.visibility && landmark.visibility < 0.1) continue;

      const x = landmark.x * ctx.canvas.width;
      const y = landmark.y * ctx.canvas.height;

      // Dynamic radius based on z-depth
      const radius = this.lerp(landmark.z, -0.15, 0.1, 10, 1);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = dotFillColor;
      ctx.fill();
      ctx.strokeStyle = dotColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /**
   * Draw pose landmarks with connections
   */
  drawPose(
    landmarks: Landmark[],
    ctx: CanvasRenderingContext2D,
    lineColor = '#00FF00',
    dotColor = '#00FF00',
    dotFillColor = '#FF0000'
  ): void {
    const connections = MediaPipeService.getPoseConnections();

    // Draw connections
    this.drawConnect(
      connections.map(([from, to]) => [landmarks[from], landmarks[to]]),
      ctx,
      lineColor
    );

    // Draw landmarks
    for (const landmark of landmarks) {
      if (landmark.visibility && landmark.visibility < 0.1) continue;

      const x = landmark.x * ctx.canvas.width;
      const y = landmark.y * ctx.canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = dotFillColor;
      ctx.fill();
      ctx.strokeStyle = dotColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /**
   * Draw elbow-to-hand connections
   */
  drawElbowHandsConnection(
    pose: CombinedPoseResult,
    ctx: CanvasRenderingContext2D
  ): void {
    ctx.lineWidth = 5;

    // Right elbow (14) to right hand
    if (pose.rightHandLandmarks && pose.poseLandmarks && pose.poseLandmarks[14]) {
      ctx.strokeStyle = '#00FF00';
      this.drawConnect(
        [[pose.poseLandmarks[14], pose.rightHandLandmarks[0]]],
        ctx
      );
    }

    // Left elbow (13) to left hand
    if (pose.leftHandLandmarks && pose.poseLandmarks && pose.poseLandmarks[13]) {
      ctx.strokeStyle = '#FF0000';
      this.drawConnect(
        [[pose.poseLandmarks[13], pose.leftHandLandmarks[0]]],
        ctx
      );
    }
  }

  /**
   * Draw complete pose with hands
   */
  draw(pose: CombinedPoseResult, ctx: CanvasRenderingContext2D): void {
    ctx.save();

    if (pose.poseLandmarks) {
      this.drawPose(pose.poseLandmarks, ctx);
      this.drawElbowHandsConnection(pose, ctx);
    }

    if (pose.leftHandLandmarks) {
      this.drawHand(pose.leftHandLandmarks, ctx, '#CC0000', '#FF0000', '#00FF00');
    }

    if (pose.rightHandLandmarks) {
      this.drawHand(pose.rightHandLandmarks, ctx, '#00CC00', '#00FF00', '#FF0000');
    }

    ctx.restore();
  }

  /**
   * Linear interpolation helper
   */
  private lerp(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    if (inMax === inMin) return outMin;
    return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    try {
      // The new API doesn't have a close() method
      // Just clear references
      this.poseLandmarker = null;
      this.handLandmarker = null;
      this.wasmFileset = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Error disposing MediaPipe instances:', error);
    }
  }
}

// Singleton instance with options tracking
let mediaPipeServiceInstance: MediaPipeService | null = null;
let mediaPipeServiceOptions: MediaPipeServiceOptions | null = null;

/**
 * Get or create MediaPipeService singleton instance
 */
export function getMediaPipeService(options?: MediaPipeServiceOptions): MediaPipeService {
  if (!mediaPipeServiceInstance) {
    mediaPipeServiceInstance = new MediaPipeService(options);
    mediaPipeServiceOptions = options || {};
  } else if (options && mediaPipeServiceOptions) {
    // Check if options differ significantly
    const optionsDiffer =
      options.poseModelType !== mediaPipeServiceOptions.poseModelType ||
      options.handsModelComplexity !== mediaPipeServiceOptions.handsModelComplexity ||
      options.minDetectionConfidence !== mediaPipeServiceOptions.minDetectionConfidence ||
      options.minTrackingConfidence !== mediaPipeServiceOptions.minTrackingConfidence;

    if (optionsDiffer) {
      console.warn(
        'MediaPipeService already initialized with different options. ' +
        'Ignoring new options. Current options:',
        mediaPipeServiceOptions,
        'Requested options:',
        options
      );
    }
  }
  return mediaPipeServiceInstance;
}

/**
 * Reset the singleton instance (useful for testing or when options need to change)
 */
export function resetMediaPipeService(): void {
  mediaPipeServiceInstance?.dispose();
  mediaPipeServiceInstance = null;
  mediaPipeServiceOptions = null;
}
