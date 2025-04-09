import { taskCallback } from "@/lib/api/workflow/task-callback";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ transcriptId: string }> }
): Promise<NextResponse> {
  try {
    const { transcriptId } = await params;

    const payload = await req.json();

    await taskCallback({
      payload,
      transcriptId,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Unexpected error during upload", err);
    return NextResponse.json(
      { message: err?.message || "Server error", error: err?.toString() },
      { status: 500 }
    );
  }
}
