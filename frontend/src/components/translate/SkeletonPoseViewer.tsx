import { PoseViewer } from './PoseViewer';
import type { Landmark } from '../../types/translation';

interface SkeletonPoseViewerProps {
  src?: string;
  background?: string;
  className?: string;
  landmarks?: Landmark[][];
  width?: number;
  height?: number;
}

/**
 * SkeletonPoseViewer - Uses the pose-viewer custom element
 * This component wraps the PoseViewer component which uses the pose-viewer/loader package
 *
 * @param src - URL to the pose file (.pose format)
 * @param background - Background color for the viewer
 * @param className - Additional CSS classes
 */
export function SkeletonPoseViewer({
  src,
  background,
  className = '',
  landmarks,
  width,
  height,
}: SkeletonPoseViewerProps) {
  if (!src && landmarks && landmarks.length > 0) {
    return (
      <div
        className={`skeleton-pose-viewer ${className}`}
        style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
      >
        <div className="flex items-center justify-center w-full h-full text-gray-500">
          Skeleton preview ready
        </div>
      </div>
    );
  }

  return (
    <div className={`skeleton-pose-viewer ${className}`}>
      <PoseViewer src={src} background={background} className="w-full h-full" />
    </div>
  );
}
