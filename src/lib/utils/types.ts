// API Response Types
export type FileUploadResult = Storage & {
  originalFilename: string;
  presignedUrl?: string; // Optional: May not be needed if URLs are generated later
};

// Represents the raw transcription data structure (e.g., from Deepgram)
export type Transcript = {
  words: Word[];
  speakers: Speaker[];
  // Potentially other metadata from the transcription service
};

export type Word = {
  text: string;
  start: number; // seconds
  end: number;   // seconds
  speaker: string; // Identifier for the speaker (e.g., "spk_0")
  confidence?: number; // Optional confidence score
};

export type Speaker = {
  speaker: string; // Matches speaker identifier in Word
  start: number; // seconds
  end: number;   // seconds
};

// Represents a segment identified as potentially viral (from segmentation step)
// This might be stored in the `meta` JSONB field of the `clips` table.
export type ViralSegment = {
  transcriptText: string;
  start: number; // seconds
  end: number;   // seconds
  briefSegmentDescription: string;
  viralityScore: number;
  viralScoreExplanation: string;
};




// Represents an asset stored in S3 (linked from transcripts and clips)
export type Asset = {
  id: string;
  bucket: string;
  key: string;
  name: string;
  url?: string; // Optional: Can be generated (e.g., presigned) or stored
};