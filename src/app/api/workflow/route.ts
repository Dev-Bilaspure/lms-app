import { type NextRequest, NextResponse } from "next/server";
import { uploadToS3, getPresignedUrl } from "@/lib/storage/s3";
import { nanoid } from "nanoid";
import * as path from "path";
import { Readable } from "stream";
import { Asset } from "@/lib/utils/types";

const MAX_FILE_SIZE_BYTES = 1024 * 1024 * 200; // 200MB

const BUCKET_NAME = process.env.MY_S3_BUCKET!;

interface UploadResult {
  uploadedKeys: Asset[];
  failedUploads: { name: string; reason: string }[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();

    if (formData.entries().next().done) {
      return NextResponse.json(
        { message: "No files uploaded" },
        { status: 400 }
      );
    }

    const { uploadedKeys, failedUploads } = await uploadFiles(formData);

    if (uploadedKeys.length === 0) {
      return NextResponse.json(
        { message: "All uploads failed", errors: failedUploads },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploads: uploadedKeys,
      ...(failedUploads.length > 0 && {
        partialSuccess: true,
        failed: failedUploads,
      }),
    });
  } catch (err: any) {
    console.error("Unexpected error during upload", err);
    return NextResponse.json(
      { message: err?.message || "Server error", error: err?.toString() },
      { status: 500 }
    );
  }
}

async function uploadFiles(formData: FormData): Promise<UploadResult> {
  const uploadedKeys: Asset[] = [];
  const failedUploads: { name: string; reason: string }[] = [];
  const uploadPromises: Promise<void>[] = [];

  for (const [, value] of formData.entries()) {
    if (!(value instanceof File)) continue;

    const file = value;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      failedUploads.push({
        name: file.name || "unknown",
        reason: "File too large (200MB limit)",
      });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || "";
    const s3Key = `lms-app/uploads/${nanoid()}${ext}`;
    const mime = file.type || "application/octet-stream";

    const upload = uploadToS3(bufferToStream(buffer), s3Key, mime)
      .then(async () => {
        try {
          const presignedUrl = await getPresignedUrl(s3Key);
          uploadedKeys.push({
            bucket: BUCKET_NAME!,
            key: s3Key,
            name: file.name || "unknown",
            url: presignedUrl,
            id: nanoid(),
          });
        } catch (presignedUrlError) {
          console.error(
            `Failed to generate presigned URL for ${s3Key}:`,
            presignedUrlError
          );
          // Still add the file but without the presigned URL
          uploadedKeys.push({
            bucket: BUCKET_NAME!,
            key: s3Key,
            name: file.name || "unknown",
            id: nanoid(),
          });
        }
      })
      .catch((err) => {
        console.error(`Upload failed for ${file.name}`, err);
        failedUploads.push({
          name: file.name || "unknown",
          reason: err.message || "Upload failed",
        });
      });

    uploadPromises.push(upload);
  }

  await Promise.all(uploadPromises);

  return { uploadedKeys, failedUploads };
}

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
