'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  isClip?: boolean; // Optional flag for clip-specific styling/behavior
}

export function VideoPlayer({ src, title = "Video Player", className, isClip = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play().catch(handleError);
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleError = (e: any) => {
     console.error("Video player error:", e);
     // Attempt to infer error type
     let message = "An error occurred while loading the video.";
     if (e?.target?.error) {
        switch (e.target.error.code) {
          case e.target.error.MEDIA_ERR_ABORTED:
            message = 'Video playback aborted.';
            break;
          case e.target.error.MEDIA_ERR_NETWORK:
            message = 'A network error caused video download to fail.';
            break;
          case e.target.error.MEDIA_ERR_DECODE:
            message = 'Video playback aborted due to decoding error.';
            break;
          case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = 'The video source is not supported.';
            break;
          default:
            message = 'An unknown video error occurred.';
        }
      }
      setError(message);
  };

  const handleCanPlay = () => {
    setError(null); // Clear error if video becomes playable
  };

  return (
    <div className={cn(
      "relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-border",
      isClip ? 'border-opacity-50' : '', // Slightly different style for clips if needed
      className
    )}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain" // Use object-contain to prevent stretching
        // controls // Use custom controls potentially later
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={handleError}
        onCanPlay={handleCanPlay}
        preload="metadata" // Load metadata initially
        aria-label={title}
        playsInline // Important for mobile playback
      >
        Your browser does not support the video tag.
      </video>

      {/* Error Display */}
       {error && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
           <p className="text-destructive text-center text-sm">{error}</p>
         </div>
       )}

      {/* Custom Play/Pause Button (Optional Example) */}
      {/* Consider adding more sophisticated custom controls */}
       <button
         onClick={handlePlayPause}
         className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
            "bg-black/50 text-white p-3 rounded-full transition-opacity duration-200",
            "hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black",
             isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100" // Show only when paused, but allow hover reveal when playing
          )}
         aria-label={isPlaying ? "Pause" : "Play"}
       >
         {/* Add Play/Pause Icon here using lucide-react */}
         {/* {isPlaying ? <Pause size={24} /> : <Play size={24} />} */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            {isPlaying
              ? <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
              : <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />}
          </svg>
       </button>
    </div>
  );
}