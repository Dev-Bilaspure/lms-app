'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTranscriptById, TranscriptResponse,  } from '@/lib/utils/fetch';
import { generateSpeakerSegments } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; // Assuming you have a Badge component from shadcn
import { VideoPlayer } from '@/components/VideoPlayer';
import { Skeleton } from '@/components/ui/skeleton'; // Assuming shadcn Skeleton
import { EmptyState } from '@/components/EmptyState';

type ViewMode = 'transcript' | 'viralClips';

export default function ProjectPage() {
  const params = useParams();
  const transcriptId = params.transcriptId as string;
  const [transcriptData, setTranscriptData] = useState<TranscriptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('transcript'); // Managed by Navbar interaction

  useEffect(() => {
    if (transcriptId) {
      setLoading(true);
      setError(null);
      getTranscriptById(transcriptId)
        .then(data => {
          setTranscriptData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch transcript:", err);
          setError(err.message || "Failed to load transcript data.");
          setLoading(false);
        });
    }
  }, [transcriptId]);

  // Memoize speaker segments calculation
  const speakerSegments = useMemo(() => {
    if (transcriptData?.response?.words) {
      return generateSpeakerSegments(transcriptData.response.words);
    }
    return [];
  }, [transcriptData]);

  // TODO: Connect this to the Navbar toggle
  const handleViewChange = (newMode: ViewMode) => {
    setViewMode(newMode);
  };

  if (loading) {
    return <ProjectPageSkeleton />;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-destructive text-center">{error}</div>;
  }

  if (!transcriptData) {
    return <div className="container mx-auto px-4 py-8 text-center">Transcript not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Title - could also be in Navbar */}
      {/* <h1 className="text-2xl font-semibold mb-6">{transcriptData.title}</h1> */}

      {/* View Toggle Placeholder - Real toggle will be in Navbar */}
       <div className="mb-6 text-center hidden"> {/* Hidden for now, Navbar handles this */}
         <button onClick={() => handleViewChange('transcript')} disabled={viewMode === 'transcript'}>Transcript</button>
         <button onClick={() => handleViewChange('viralClips')} disabled={viewMode === 'viralClips'}>Viral Clips</button>
       </div>

      {/* Conditional Rendering based on viewMode */}
      {viewMode === 'transcript' && (
        <div className="relative">
           {/* Transcript Content */}
           <div className="space-y-6 max-w-4xl mx-auto pr-4 pb-32"> {/* Add padding-bottom for floating player */}
              {speakerSegments.map((segment, index) => (
                 <div key={index} className="p-4 rounded-lg bg-card border border-border shadow-sm">
                   <p className="text-sm font-semibold text-primary mb-1">
                     {segment.speaker || 'Unknown Speaker'}
                     <span className="text-xs text-muted-foreground ml-2">
                       ({segment.start.toFixed(2)}s - {segment.end.toFixed(2)}s)
                     </span>
                   </p>
                   <p className="text-base text-card-foreground leading-relaxed">{segment.text}</p>
                 </div>
              ))}
              {speakerSegments.length === 0 && (
                 <EmptyState message="Transcription data is not available or is empty." />
              )}
           </div>

           {/* Floating Video Player */}
           <div className="fixed bottom-6 left-6 z-50 w-full max-w-xs sm:max-w-sm md:max-w-md">
             <VideoPlayer src={transcriptData.asset_url} title={`Full Video: ${transcriptData.title}`} />
           </div>
        </div>
      )}

      {viewMode === 'viralClips' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Viral Clips</h2>
          {transcriptData.clips && transcriptData.clips.length > 0 ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {transcriptData.clips.map((clip) => (
                 <Card key={clip.id} className="bg-card border-border shadow-sm flex flex-col">
                   <CardHeader>
                     <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base mb-1">Clip ({clip.start.toFixed(1)}s - {clip.end.toFixed(1)}s)</CardTitle>
                         <Badge variant="secondary" className="whitespace-nowrap">
                           Score: {clip.viralityScore?.toFixed(1) ?? 'N/A'}
                         </Badge>
                     </div>
                     <CardDescription className="text-xs">{clip.briefSegmentDescription}</CardDescription>
                   </CardHeader>
                   <CardContent className="flex-grow flex flex-col gap-4">
                     {/* Embedded Video Player for the Clip */}
                     <div className="aspect-video rounded-md overflow-hidden border border-border">
                        <VideoPlayer src={clip.asset_url} title={`Clip: ${clip.briefSegmentDescription}`} isClip={true} />
                     </div>
                     {/* Transcript Text */}
                     <p className="text-sm bg-muted/50 p-3 rounded-md border border-border text-muted-foreground">
                       "{clip.transcriptText}"
                     </p>
                     {/* Explanation */}
                     <p className="text-xs text-muted-foreground italic">
                        {clip.viralScoreExplanation}
                     </p>
                   </CardContent>
                 </Card>
               ))}
             </div>
          ) : (
             <EmptyState message="No viral clips have been generated for this project yet." />
          )}
        </div>
      )}
    </div>
  );
}


// Skeleton Loader Component
function ProjectPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-3/4 mb-6" /> {/* Title Skeleton */}

      {/* Transcript Skeleton */}
      <div className="space-y-6 max-w-4xl mx-auto pr-4 pb-32">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="p-4 rounded-lg bg-card border border-border">
            <Skeleton className="h-4 w-1/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>

       {/* Floating Video Player Skeleton */}
       <div className="fixed bottom-6 left-6 z-50 w-full max-w-xs sm:max-w-sm md:max-w-md">
         <Skeleton className="aspect-video w-full rounded-lg" />
       </div>
    </div>
  );
}