import { useRef, useState, useEffect } from 'react';

interface VideoPlayerProps {
  src?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  onEnded?: () => void;
}

export function VideoPlayer({
  src,
  autoPlay = false,
  loop = false,
  muted = false,
  controls = true,
  onTimeUpdate,
  onLoadedMetadata,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      onLoadedMetadata?.(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, onLoadedMetadata, onEnded]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const seek = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
    }
  };

  const changeVolume = (newVolume: number) => {
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        className="w-full rounded border border-[var(--border)]"
      />

      {/* Custom controls if not using browser controls */}
      {!controls && (
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="p-1">
              {muted || volume === 0 ? '🔇' : '🔊'}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      )}
    </div>
  );
}