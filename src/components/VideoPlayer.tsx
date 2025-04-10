'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type VideoPlayerProps = {
  src: string;
  title?: string;
  className?: string;
  isClip?: boolean;
};

export function VideoPlayer({ 
  src, 
  title = "Video Player", 
  className, 
  isClip = false 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleError = (e: unknown) => {
    console.error("Video player error:", e);
    
    let message = "Failed to load video.";
    if (e instanceof Error) {
      message = e.message;
    } else if (e && typeof e === 'object' && 'target' in e) {
      const target = e.target as HTMLVideoElement;
      if (target.error) {
        switch (target.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            message = 'Video playback aborted.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            message = 'Network error occurred.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            message = 'Video decoding error.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = 'Video format not supported.';
            break;
        }
      }
    }
    
    setError(message);
  };

  return (
    <div className={cn(
      "relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-border",
      isClip && 'border-opacity-50',
      className
    )}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onError={handleError}
        onCanPlay={() => setError(null)}
        preload="metadata"
        aria-label={title}
        playsInline
        controls
      >
        Your browser does not support video playback.
      </video>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
          <p className="text-destructive text-center text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}