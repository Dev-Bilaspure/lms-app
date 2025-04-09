import { handleUpload } from "@/lib/api/workflow";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();

    if (formData.entries().next().done) {
      return NextResponse.json(
        { message: "No files uploaded" },
        { status: 400 }
      );
    }

    const result = await handleUpload(formData);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Unexpected error during upload", err);
    return NextResponse.json(
      { message: err?.message || "Server error", error: err?.toString() },
      { status: 500 }
    );
  }
}
