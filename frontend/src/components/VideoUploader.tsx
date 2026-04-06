import { useRef, useState } from 'react';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function VideoUploader({
  onFileSelect,
  accept = 'video/*',
  maxSize = 100,
}: VideoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return false;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="w-full">
      <div
        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-[var(--accent)] bg-[var(--accent-bg)]'
            : 'border-[var(--border)] hover:border-[var(--accent)]'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">📹</span>
          <p className="text-[var(--text)]">
            Drop video here or click to select
          </p>
          <p className="text-sm text-[var(--text)] opacity-70">
            Max size: {maxSize}MB
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}