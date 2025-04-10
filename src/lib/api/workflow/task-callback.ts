import {
  MediaTaskNotifiedParams,
  SegmentationTaskState,
  TranscriptionTaskState,
} from "@/lib/mediatoad/types";
import { downloadJsonFromS3 } from "@/lib/storage/s3";
import { supabase } from "@/supabase/client";

export async function taskCallback(args: {
  payload: MediaTaskNotifiedParams;
  transcriptId: string;
}) {
  try {
    if (!args.payload || !args.transcriptId) {
      throw new Error("Payload or transcriptId not found");
    }

    const { payload, transcriptId } = args;

    const { tasks } = payload;

    const segmentationTask = tasks.find(
      (task) => task.operation === "segmentation"
    );

    const transcriptionTask = tasks.find(
      (task) => task.operation === "transcription"
    );

    if (!segmentationTask || !transcriptionTask) {
      throw new Error(
        "Segmentation or transcription task not found in payload"
      );
    }

    const result = await handleSegmentationTask({
      segmentationTask,
      transcriptionTask,
      transcriptId,
    });

    console.log(`Task callback result: `, result);
    return result;
  } catch (error) {
    console.error(`Error occurred in taskCallback: ${JSON.stringify(error)}`);
    throw new Error(`Error occurred in taskCallback: ${JSON.stringify(error)}`);
  }
}

async function handleSegmentationTask({
  segmentationTask,
  transcriptionTask,
  transcriptId,
}: {
  segmentationTask: SegmentationTaskState;
  transcriptionTask: TranscriptionTaskState;
  transcriptId: string;
}) {
  try {
    const transcriptResult = await downloadJsonFromS3({
      Key: transcriptionTask.Key!,
    });

    if (!transcriptResult) {
      throw new Error("Failed to download transcription");
    }

    const transcriptResponse = transcriptResult.transcript;

    if (!transcriptResponse) {
      throw new Error("Failed to get transcriptResponse from transcriptResult");
    }

    const segmentsResponse = await downloadJsonFromS3({
      Key: segmentationTask.Key!,
    });

    if (!segmentsResponse) {
      throw new Error("Failed to download segments");
    }

    const { data: transcriptUpdateData, error: transcriptUpdateError } =
      await supabase
        .from("transcripts")
        .update({
          response: transcriptResponse,
          segments: segmentsResponse,
          status: "DONE",
        })
        .eq("id", transcriptId);

    if (transcriptUpdateError || !transcriptUpdateData) {
      throw new Error(
        `Failed to update transcript ${JSON.stringify(transcriptUpdateError)}`
      );
    }

    return {
      success: true,
      message: "Transcript and segments updated successfully",
    };
  } catch (error) {
    console.error(
      `Error occurred in handleSegmentationTask: ${JSON.stringify(error)}`
    );
    throw new Error(
      `Error occurred in handleSegmentationTask: ${JSON.stringify(error)}`
    );
  }
}
