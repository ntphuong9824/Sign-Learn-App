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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    definePoseViewerElement().then(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return <div className={`p-4 text-center ${className}`}>Loading pose viewer...</div>;
  }

  // Render native web component
  return (
    <div ref={containerRef} className={className}>
      {/* @ts-expect-error - pose-viewer is a custom element */}
      <pose-viewer src={src} background={background} />
    </div>
  );
}

export function usePoseViewerFPS(viewerRef: React.RefObject<HTMLElement>) {
  const [fps, setFps] = useState(30);

  useEffect(() => {
    const getFps = async () => {
      if (viewerRef.current && 'getPose' in viewerRef.current) {
        const pose = await (viewerRef.current as unknown as { getPose: () => Promise<{ body: { fps: number } }> }).getPose();
        if (pose?.body?.fps) {
          setFps(pose.body.fps);
        }
      }
    };
    getFps();
  }, [viewerRef]);

  return fps;
}