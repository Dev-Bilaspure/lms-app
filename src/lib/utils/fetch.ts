import { Transcript, ViralSegment } from "./types";

type TranscriptResponse = {
  id: string;
  asset_url: string;
  response: Transcript;
  status: string;
  title: string;
  asset_id: string;
  created_at: string;
  updated_at: string;
  clips: Array<
    ViralSegment & {
      id: string;
      asset_url: string;
      start: number;
      end: number;
      transcript_id: string;
      created_at: string;
      updated_at: string;
    }
  >;
};
export async function getTranscriptById(
  transcriptId: string
): Promise<TranscriptResponse> {
  const response = await fetch(`/api/transcript/${transcriptId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch transcript");
  }
  return response.json();
}
