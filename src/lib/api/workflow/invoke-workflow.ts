import { MediaJobParams, Task } from "@/lib/mediatoad/types";
import { nanoid } from "nanoid";
import { getBaseUrl, TaskId } from "@/lib/api/utils";
import getTemporalClient from "@/lib/temporal/client";
import {
  DEFAULT_MEDIA_TOAD_WORKER_QUEUE,
  HIGH_PRIORITY_MEDIA_TOAD_WORKER_QUEUE,
} from "@/lib/temporal/constants";

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const PATH_BASE = "lms-app/workflows";

export async function invokeWorkflow({
  partialTranscripts,
  assetsData,
}: {
  partialTranscripts: { id: string; asset_id: string }[];
  assetsData: {
    id: string;
    bucket: string;
    key: string;
    name: string;
    url: string;
  }[];
}) {
  const payload: MediaJobParams = {
    jobId: nanoid(),
    assets: partialTranscripts.map((t) => ({
      name: `video-asset-${t.asset_id}`,
      url: assetsData.find((a) => a.id === t.asset_id)?.url!,
    })),
    tasks: partialTranscripts.flatMap((t): Task[] => [
      {
        operation: "transcription",
        asset: `video-asset-${t.asset_id}`,
        provider: "deepgram",
        apiKey: process.env.DEEPGRAM_API_KEY!,
        id: TaskId.generate("transcription", t.id),
        outputAsset: `transcription-asset-${t.id}`,
        language: "en",
        notify: { url: generateWorkflowNotification(t.id, "task") },
      },
      {
        operation: "segmentation",
        asset: `transcription-asset-${t.id}`,
        id: TaskId.generate("segmentation", t.id),
        outputAsset: `segmentation-asset-${t.id}`,
        modelApiKey: process.env.GEMINI_API_KEY!,
        model: "gemini-1.5-flash",
        notify: { url: generateWorkflowNotification(t.id, "task") },
      },
      {
        operation: "clip",
        batchClip: true,
        asset: `video-asset-${t.asset_id}`,
        id: TaskId.generate("clip", t.id),
        outputAsset: `clip-asset-${t.id}`,
        segmentsAsset: `segmentation-asset-${t.id}`,
        notify: { url: generateWorkflowNotification(t.id, "task") },
      },
    ]),
    storage: {
      bucket: BUCKET_NAME,
      base: PATH_BASE,
      storageType: "s3",
    },
  };

  const client = await getTemporalClient();

  const handle = await client.workflow.start("mediaJobWorkflow", {
    args: [payload],
    taskQueue:
      payload.queue === "highPriority"
        ? HIGH_PRIORITY_MEDIA_TOAD_WORKER_QUEUE
        : DEFAULT_MEDIA_TOAD_WORKER_QUEUE,
    workflowId: `lms-workflow-${payload.jobId}`,
    searchAttributes: {
      ...(payload.type && { MediaInfraJobType: [payload.type] }),
      ...(payload.externalId && { ExternalId: [payload.externalId] }),
    },
  });

  return { workflowId: handle.workflowId };
}

function generateWorkflowNotification(
  transcriptId: string,
  type: "task" | "job"
): string {
  return `${getBaseUrl()}/api/workflow/notification/${type}/${transcriptId}`;
}
