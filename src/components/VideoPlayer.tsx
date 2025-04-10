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

  console.log("src", src);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().catch(handleError);
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

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
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={handleError}
        onCanPlay={() => setError(null)}
        preload="metadata"
        aria-label={title}
        playsInline
      >
        Your browser does not support video playback.
      </video>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
          <p className="text-destructive text-center text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handlePlayPause}
        className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
          "bg-black/50 text-white p-3 rounded-full transition-opacity duration-200",
          "hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-primary",
          isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
        )}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          {isPlaying ? (
            <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
          )}
        </svg>
      </button>
    </div>
  );
}