import { handleUpload } from "@/lib/api/workflow";
import getTemporalClient from "@/lib/temporal/client";
import { DEFAULT_MEDIA_TOAD_WORKER_QUEUE, HIGH_PRIORITY_MEDIA_TOAD_WORKER_QUEUE } from "@/lib/temporal/constants";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const payload = await req.json();


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

    return NextResponse.json({ workflowId: handle.workflowId }, { status: 200 });
  } catch (err: any) {
    console.error("Unexpected error during upload", err);
    return NextResponse.json(
      { message: err?.message || "Server error", error: err?.toString() },
      { status: 500 }
    );
  }
}
