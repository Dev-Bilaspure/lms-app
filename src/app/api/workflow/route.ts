import { handleUpload } from "@/lib/api/workflow";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { uploads } = await req.json();

    if (!uploads?.length) {
      return NextResponse.json(
        { message: "No uploads provided" },
        { status: 400 }
      );
    }

    const result = await handleUpload(uploads);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Unexpected error during upload", err);
    return NextResponse.json(
      { message: err?.message || "Server error", error: err?.toString() },
      { status: 500 }
    );
  }
}
