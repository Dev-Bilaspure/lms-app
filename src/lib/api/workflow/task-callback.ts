import { MediaTaskNotifiedParams } from "@/lib/mediatoad/types";
import { downloadJsonFromS3 } from "@/lib/storage/s3";
import { supabase } from "@/supabase/client";

export async function taskCallback(args: {
  payload: MediaTaskNotifiedParams;
  transcriptId: string;
}) {
  try {
    const { payload, transcriptId } = args;

    if (!payload || !transcriptId) {
      throw new Error("Payload or transcriptId is missing");
    }

    if (payload.task.operation === "transcription") {
      await handleTranscriptionTask({ payload, transcriptId });
    } else if (payload.task.operation === "segmentation") {
      await handleSegmentationTask({ payload, transcriptId });
    } else if (payload.task.operation === "clip") {
      await handleClipTask({ payload, transcriptId });
    }

    return {
      success: true,
      message: "Task callback processed successfully",
    };
  } catch (error) {
    console.error(`Error occurred in taskCallback: ${JSON.stringify(error)}`);
    throw new Error(`Error occurred in taskCallback: ${JSON.stringify(error)}`);
  }
}

async function handleTranscriptionTask({
  payload,
  transcriptId,
}: {
  payload: MediaTaskNotifiedParams;
  transcriptId: string;
}) {
  try {
    await supabase
      .from("transcripts")
      .update({ status: "GENERATING_SEGMENTS" })
      .eq("id", transcriptId);
  } catch (error) {
    console.error("Error occurred in handleTranscriptionTask:", error);
    throw new Error(
      `Error in handleTranscriptionTask: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function handleSegmentationTask({
  payload,
  transcriptId,
}: {
  payload: MediaTaskNotifiedParams;
  transcriptId: string;
}) {
  try {
    await supabase
      .from("transcripts")
      .update({ status: "GENERATING_CLIPS" })
      .eq("id", transcriptId);
  } catch (error) {
    console.error("Error occurred in handleSegmentationTask:", error);
    throw new Error(
      `Error in handleSegmentationTask: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function handleClipTask({
  payload,
  transcriptId,
}: {
  payload: MediaTaskNotifiedParams;
  transcriptId: string;
}) {
  try {
    const { tasks } = payload;

    const segmentationTask = tasks.find(
      (task) => task.operation === "segmentation"
    );
    const clipTask = tasks.find((task) => task.operation === "clip");
    const transcriptionTask = tasks.find(
      (task) => task.operation === "transcription"
    );

    if (!segmentationTask || !transcriptionTask || !clipTask) {
      throw new Error(
        "One or more required tasks (segmentation, transcription, clip) are missing"
      );
    }

    // Validate and process transcription
    const transcriptionKey = transcriptionTask.Key;
    if (!transcriptionKey) {
      throw new Error("Transcription task is missing 'Key'");
    }

    const transcriptResult = await downloadJsonFromS3({
      Key: transcriptionKey,
    });
    const transcriptResponse = transcriptResult?.transcript;

    if (!transcriptResponse) {
      throw new Error("Transcript response is missing from S3 download");
    }

    const { data: transcriptUpdateData, error: transcriptUpdateError } =
      await supabase
        .from("transcripts")
        .update({ response: transcriptResponse, status: "DONE" })
        .eq("id", transcriptId)
        .select("*");

    if (transcriptUpdateError || !transcriptUpdateData?.length) {
      throw new Error(
        `Failed to update transcript: ${JSON.stringify(transcriptUpdateError)}`
      );
    }

    // Validate and process clips
    const { batchClips } = clipTask;
    if (!batchClips?.length) {
      throw new Error("Clip task does not contain batch clips");
    }

    const uniqueKeys = new Set(batchClips.map((clip) => clip.Key));
    if (uniqueKeys.size !== batchClips.length) {
      throw new Error(
        "Duplicate Keys found in batchClips — Keys must be unique"
      );
    }

    const assetRows = batchClips.map((clip, index) => ({
      bucket: clip.Bucket,
      key: clip.Key,
      name: `clip-${index}`,
    }));

    const { data: assetInsertData, error: assetInsertError } = await supabase
      .from("assets")
      .insert(assetRows)
      .select("*");

    if (assetInsertError || !assetInsertData?.length) {
      throw new Error(
        `Failed to insert assets: ${JSON.stringify(assetInsertError)}`
      );
    }

    const batchClipsWithAssetId = batchClips.map((clip) => {
      const asset = assetInsertData.find((a) => a.key === clip.Key);
      if (!asset) {
        throw new Error(
          `No matching asset found for clip with Key: ${clip.Key}`
        );
      }
      return { ...clip, asset_id: asset.id };
    });

    const clipsRows = batchClipsWithAssetId.map((clip) => ({
      asset_id: clip.asset_id,
      start: clip.start,
      end: clip.end,
      transcript_id: transcriptId,
      meta: clip,
    }));

    const { data: clipsInsertData, error: clipsInsertError } = await supabase
      .from("clips")
      .insert(clipsRows)
      .select("*");

    if (clipsInsertError || !clipsInsertData?.length) {
      throw new Error(
        `Failed to insert clips: ${JSON.stringify(clipsInsertError)}`
      );
    }

    // Optionally validate segmentationTask if needed
    if (!segmentationTask.Key) {
      console.warn("Segmentation task has no Key — skipping further checks");
    }

    return {
      success: true,
      message: "Transcript and clips processed successfully",
    };
  } catch (error) {
    console.error("Error occurred in handleSegmentationTask:", error);
    throw new Error(
      `Error in handleSegmentationTask: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
