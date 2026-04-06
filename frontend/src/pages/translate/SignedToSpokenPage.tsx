import { useState, useRef } from 'react';
import { SkeletonPoseViewer } from '../../components/translate/SkeletonPoseViewer';
import { HumanPoseViewer } from '../../components/translate/HumanPoseViewer';
import type { Landmark } from '../../types/translation';

type ViewerType = 'skeleton' | 'human' | 'avatar';

export function SignedToSpokenPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[][]>([]);
  const [viewerType, setViewerType] = useState<ViewerType>('skeleton');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);

    // TODO: Implement actual pose detection using MediaPipe
    // For now, create dummy data
    const dummyLandmarks: Landmark[][] = [];
    for (let frame = 0; frame < 30; frame++) {
      const frameLandmarks: Landmark[] = [];
      for (let i = 0; i < 33; i++) {
        frameLandmarks.push({
          x: 0.3 + Math.random() * 0.4,
          y: 0.1 + Math.random() * 0.6,
          z: Math.random() * 0.2,
          visibility: 0.8 + Math.random() * 0.2,
        });
      }
      dummyLandmarks.push(frameLandmarks);
    }

    setLandmarks(dummyLandmarks);
    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <h1>Signed to Spoken Translation</h1>

      <div
        className="w-full max-w-2xl p-8 border-2 border-dashed border-[var(--border)] rounded-lg text-center cursor-pointer hover:border-[var(--accent)]"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*,.pose"
          onChange={handleFileChange}
          className="hidden"
        />
        {selectedFile ? (
          <p>{selectedFile.name}</p>
        ) : (
          <p>Drop video or pose file here, or click to select</p>
        )}
      </div>

      {isProcessing && <p>Processing...</p>}

      {landmarks.length > 0 && (
        <>
          <div className="flex gap-4">
            <button
              onClick={() => setViewerType('skeleton')}
              className={`px-4 py-2 rounded ${viewerType === 'skeleton' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--code-bg)]'}`}
            >
              Skeleton
            </button>
            <button
              onClick={() => setViewerType('human')}
              className={`px-4 py-2 rounded ${viewerType === 'human' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--code-bg)]'}`}
            >
              Human
            </button>
            <button
              onClick={() => setViewerType('avatar')}
              className={`px-4 py-2 rounded ${viewerType === 'avatar' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--code-bg)]'}`}
            >
              Avatar
            </button>
          </div>

          {viewerType === 'skeleton' && <SkeletonPoseViewer landmarks={landmarks} />}
          {viewerType === 'human' && <HumanPoseViewer landmarks={landmarks} />}
          {viewerType === 'avatar' && (
            <div className="text-sm text-gray-500">Avatar view requires sprite assets</div>
          )}
        </>
      )}
    </div>
  );
}