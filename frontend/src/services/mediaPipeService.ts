import { Pose } from '@mediapipe/pose';
import { Hands } from '@mediapipe/hands';
import type { Results as PoseResults } from '@mediapipe/pose';
import type { Results as HandsResults } from '@mediapipe/hands';

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
 */
export class MediaPipeService {
  private pose: Pose | null = null;
  private hands: Hands | null = null;
  private isInitialized = false;

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
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Pose
      this.pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      const modelComplexity: 0 | 1 | 2 =
        this.options.poseModelType === 'lite' ? 0 : this.options.poseModelType === 'full' ? 1 : 2;

      const poseOptions = {
        modelComplexity,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence,
      };

      await this.pose.setOptions(poseOptions);
      await this.pose.initialize();

      // Initialize Hands
      this.hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      const handsOptions = {
        modelComplexity: this.options.handsModelComplexity,
        maxNumHands: 2,
        minDetectionConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence,
      };

      await this.hands.setOptions(handsOptions);
      await this.hands.initialize();

      this.isInitialized = true;
      console.log('MediaPipe Pose + Hands initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
      throw error;
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

    // Run Pose detection (send() resolves void, results come from callback)
    let poseResults: PoseResults | null = null;
    this.pose!.onResults((results) => {
      poseResults = results;
    });
    await this.pose!.send({ image: imageElement });
    if (!poseResults) {
      throw new Error('Pose detection did not return results');
    }
    const poseData = this.extractPoseData(poseResults);

    // Run Hands detection (send() resolves void, results come from callback)
    let handsResults: HandsResults | null = null;
    this.hands!.onResults((results) => {
      handsResults = results;
    });
    await this.hands!.send({ image: imageElement });
    if (!handsResults) {
      throw new Error('Hands detection did not return results');
    }
    const handsData = this.extractHandsData(handsResults);

    // Combine results
    return this.combineResults(poseData, handsData);
  }

  /**
   * Extract pose landmarks from MediaPipe Pose results
   */
  private extractPoseData(results: PoseResults): {
    poseLandmarks: Landmark[];
    worldPoseLandmarks: Landmark[];
  } {
    const poseLandmarks: Landmark[] = [];
    const worldPoseLandmarks: Landmark[] = [];

    if (results.poseLandmarks) {
      for (const landmark of results.poseLandmarks) {
        poseLandmarks.push({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z || 0,
          visibility: landmark.visibility || 0,
        });
      }
    }

    if (results.poseWorldLandmarks) {
      for (const landmark of results.poseWorldLandmarks) {
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
   * Extract hand landmarks from MediaPipe Hands results
   */
  private extractHandsData(results: HandsResults): {
    leftHandLandmarks: Landmark[] | null;
    rightHandLandmarks: Landmark[] | null;
    worldLeftHandLandmarks: Landmark[] | null;
    worldRightHandLandmarks: Landmark[] | null;
  } {
    let leftHandLandmarks: Landmark[] | null = null;
    let rightHandLandmarks: Landmark[] | null = null;
    let worldLeftHandLandmarks: Landmark[] | null = null;
    let worldRightHandLandmarks: Landmark[] | null = null;

    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandedness.length; i++) {
        const handedness = results.multiHandedness[i];
        const landmarks = results.multiHandLandmarks[i];
        const worldLandmarks = results.multiHandWorldLandmarks?.[i];

        const handLandmarks: Landmark[] = [];
        const worldHandLandmarks: Landmark[] = [];

        for (const landmark of landmarks) {
          handLandmarks.push({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z || 0,
            visibility: landmark.visibility || 1,
          });
        }

        if (worldLandmarks) {
          for (const landmark of worldLandmarks) {
            worldHandLandmarks.push({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z || 0,
              visibility: landmark.visibility || 1,
            });
          }
        }

        // Determine if left or right hand
        if (handedness.label === 'Left') {
          leftHandLandmarks = handLandmarks;
          worldLeftHandLandmarks = worldHandLandmarks;
        } else {
          rightHandLandmarks = handLandmarks;
          worldRightHandLandmarks = worldHandLandmarks;
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
   * Replace hand landmarks from Pose with more accurate Hands landmarks
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
    // MediaPipe Pose landmarks:
    // 0-10: Face
    // 11-14: Upper body (shoulders, elbows)
    // 15-16: Wrists
    // 17-18: Pinky tips
    // 19-20: Index tips
    // 21-22: Thumb tips
    // 23-32: Lower body

    // We'll keep the pose landmarks but note that hand landmarks are available separately
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
   * Cleanup resources
   */
  dispose(): void {
    this.pose = null;
    this.hands = null;
    this.isInitialized = false;
  }
}

// Singleton instance
let mediaPipeServiceInstance: MediaPipeService | null = null;

export function getMediaPipeService(options?: MediaPipeServiceOptions): MediaPipeService {
  if (!mediaPipeServiceInstance) {
    mediaPipeServiceInstance = new MediaPipeService(options);
  }
  return mediaPipeServiceInstance;
}
