import { jobCallback } from "@/lib/api/workflow/job-callback";
import { taskCallback } from "@/lib/api/workflow/task-callback";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ transcriptId: string; type: "task" | "job" }> }
): Promise<NextResponse> {
  try {
    const { transcriptId, type } = await params;

    const payload = await req.json();

    if (type === "task") {
      await taskCallback({
        payload,
        transcriptId,
      });
    } else if (type === "job") {
      await jobCallback({ payload, transcriptId });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Unexpected error during upload", err);
    return NextResponse.json(
      { message: err?.message || "Server error", error: err?.toString() },
      { status: 500 }
    );
  }
}
