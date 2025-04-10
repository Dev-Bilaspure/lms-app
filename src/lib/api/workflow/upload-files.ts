import { getPresignedUrl, uploadToS3 } from "@/lib/storage/s3";
import { Asset } from "@/lib/utils/types";
import { nanoid } from "nanoid";
import path from "path";
import { Readable } from "stream";

const MAX_FILE_SIZE_BYTES = 1024 * 1024 * 200; // 200MB
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const PATH_BASE = "lms-app/workflows";

export async function uploadFiles(formData: FormData) {
  const uploadedKeys: Asset[] = [];
  const failedUploads: { name: string; reason: string }[] = [];
  const uploadPromises: Promise<void>[] = [];

  for (const [, value] of formData.entries()) {
    if (!(value instanceof File)) continue;
    const file = value;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      failedUploads.push({
        name: file.name,
        reason: "File too large (200MB limit)",
      });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || "";
    const s3Key = `${PATH_BASE}/${nanoid()}${ext}`;
    const mime = file.type || "application/octet-stream";

    const upload = uploadToS3(bufferToStream(buffer), s3Key, mime)
      .then(async () => {
        const asset: Asset = {
          bucket: BUCKET_NAME,
          key: s3Key,
          name: file.name || "unknown",
          id: nanoid(),
        };

        try {
          asset.url = await getPresignedUrl(s3Key);
        } catch (err) {
          console.error(`Failed to generate presigned URL for ${s3Key}`, err);
        }

        uploadedKeys.push(asset);
      })
      .catch((err) => {
        console.error(`Upload failed for ${file.name}`, err);
        failedUploads.push({
          name: file.name,
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
