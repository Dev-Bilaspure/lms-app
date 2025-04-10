// API Response Types
export type FileUploadResult = Storage & {
  originalFilename: string;
  presignedUrl?: string;
};

export type TranscriptResponse = {
  words: Word[];
  speakers: Speaker[];
};

export type Word = {
  text: string;
  start: number;
  end: number;
  speaker: string;
};

export type Speaker = {
  speaker: string;
  start: number;
  end: number;
};

export type ViralSegment = {
  transcriptText: string;
  start: number;
  end: number;
  briefSegmentDescription: string;
  viralityScore: number;
  viralScoreExplanation: string;
};


export type Transcript = {
  id: string;
  response?: TranscriptResponse;
  segments?: ViralSegment[];
  assetId: string;
  title?: string;
};

export type Asset = {
  id: string;
  bucket: string;
  key: string;
  name: string;
  url?: string;
};

