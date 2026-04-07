import { useEffect, useRef, useState } from 'react';

async function definePoseViewerElement() {
  if (!customElements.get('pose-viewer')) {
    try {
      const { defineCustomElements } = await import('pose-viewer/loader');
      defineCustomElements();
    } catch (e) {
      console.warn('pose-viewer not available:', e);
    }
  }
}

interface PoseViewerProps {
  src?: string;
  background?: string;
  className?: string;
}

export function PoseViewer({ src, background, className = '' }: PoseViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLPoseViewerElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    definePoseViewerElement().then(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!loaded || !viewer) {
      return;
    }

    viewer.autoplay = true;
    viewer.loop = true;
    viewer.aspectRatio = 1;
    if (background !== undefined) {
      viewer.background = background;
    }
    if (src !== undefined) {
      viewer.src = src;
    }

    const handleEnded = () => {
      viewer.currentTime = 0;
      void viewer.play();
    };

    viewer.addEventListener('ended$', handleEnded);

    return () => {
      viewer.removeEventListener('ended$', handleEnded);
    };
  }, [loaded, src, background]);

  if (!loaded) {
    return <div className={`p-4 text-center ${className}`}>Loading pose viewer...</div>;
  }

  // Render native web component
  return (
    <div ref={containerRef} className={className}>
      {/* @ts-expect-error - pose-viewer is a custom element */}
      <pose-viewer
        ref={viewerRef}
      />
    </div>
  );
}

