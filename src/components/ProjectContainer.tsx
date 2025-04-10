'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ViewMode } from '@/lib/utils/types';
import TranscriptView from "@/components/TranscriptView";

type ProjectContainerProps = {
  transcriptId: string;
};

export function ProjectContainer({ transcriptId }: ProjectContainerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('transcript');

  return (
    <>
      <Navbar viewMode={viewMode} onViewModeChange={setViewMode} />
      <main className="min-h-screen pt-4">
        <TranscriptView viewMode={viewMode} />
      </main>
    </>
  );
} 