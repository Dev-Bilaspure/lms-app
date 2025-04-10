import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

const S3_ENDPOINT = process.env.S3_ENDPOINT_URL;
const S3_BUCKET = process.env.S3_BUCKET_NAME!;

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "your_access_key",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "your_secret_key",
  },
  ...(S3_ENDPOINT
    ? {
        endpoint: S3_ENDPOINT,
        forcePathStyle: true,
      }
    : {}),
});

// Get bucket name from environment variable

/**
 * Generates a presigned URL for accessing an S3 object.
 *
 * @param key The S3 object key (path within the bucket).
 * @param expiresIn Duration in seconds until the URL expires (default: 1 hour).
 * @returns A promise that resolves with the presigned URL.
 */
export const getDownloadPresignedUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  if (!S3_BUCKET) {
    throw new Error(
      "S3 bucket name is not configured. Set the S3_BUCKET_NAME environment variable."
    );
  }

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error(`Failed to generate presigned URL for key ${key}:`, error);
    throw new Error(
      `Failed to generate presigned URL: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Download JSON from S3 given an object key.
 */
export const downloadJsonFromS3 = async ({
  Key,
  Bucket = S3_BUCKET,
}: {
  Key: string;
  Bucket?: string;
}): Promise<any> => {
  try {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    });

    const { Body } = await s3Client.send(command);

    // Body is a stream; convert to string and then JSON.parse
    const rawData = await streamToString(Body);
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Error downloading JSON object from S3:", error);
    throw error;
  }
};

/**
 * Utility function to convert a ReadableStream/Node.js Readable to a string.
 */
function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
  });
}

export { s3Client };
