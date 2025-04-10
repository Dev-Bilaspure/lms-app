import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Word } from "./utils/types"; // Assuming Word type is defined here or imported correctly

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Groups consecutive words spoken by the same speaker into segments.
 *
 * @param words An array of Word objects, expected to be sorted by start time.
 * @returns An array of speaker segments, each containing the speaker, start/end times, and concatenated text.
 */
export function generateSpeakerSegments(words: Word[]): Array<{
  start: number;
  end: number;
  text: string;
  speaker: string;
}> {
  if (!words || words.length === 0) return [];

  // Ensure words are sorted by start time, though they usually are from transcription services
  const sortedWords = [...words].sort((a, b) => a.start - b.start);

  const segments: Array<{
    start: number;
    end: number;
    text: string;
    speaker: string;
  }> = [];
  if (sortedWords.length === 0) return segments; // Handle edge case after sort

  let currentSegment = {
    speaker: sortedWords[0].speaker || 'Unknown Speaker', // Handle potential missing speaker
    start: sortedWords[0].start,
    end: sortedWords[0].end,
    text: sortedWords[0].text,
  };

  for (let i = 1; i < sortedWords.length; i++) {
    const word = sortedWords[i];
    const speaker = word.speaker || 'Unknown Speaker'; // Handle potential missing speaker

    // Check if the speaker changed OR if there's a significant gap (e.g., > 1 second)
    // This helps break segments even if the speaker is the same but there was a pause.
    // Adjust the gap threshold as needed.
    const isSpeakerChange = speaker !== currentSegment.speaker;
    // const isSignificantGap = word.start - currentSegment.end > 1.0;

    if (isSpeakerChange /*|| isSignificantGap*/) {
      // Push the completed segment
      segments.push(currentSegment);
      // Start a new segment
      currentSegment = {
        speaker: speaker,
        start: word.start,
        end: word.end,
        text: word.text,
      };
    } else {
      // Continue the current segment
      currentSegment.end = word.end;
      // Add space only if the current text is not empty
      currentSegment.text += (currentSegment.text ? ' ' : '') + word.text;
    }
  }

  // Push the last segment
  segments.push(currentSegment);

  return segments;
}