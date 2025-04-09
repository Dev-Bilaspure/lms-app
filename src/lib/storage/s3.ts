import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

const S3_ENDPOINT = process.env.S3_ENDPOINT_URL;

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
const bucketName = process.env.MY_S3_BUCKET;

if (!bucketName) {
  console.warn(
    "S3_STORAGE_BUCKET environment variable is not set. Uploads will fail."
  );
  throw new Error("S3_STORAGE_BUCKET environment variable is required.");
}

/**
 * Uploads a stream to AWS S3 using multipart upload for efficiency.
 *
 * @param stream The readable stream to upload.
 * @param key The S3 object key (path within the bucket).
 * @param contentType The MIME type of the file being uploaded.
 * @returns A promise that resolves with the S3 object key upon successful upload.
 */
export const uploadToS3 = async (
  stream: Readable,
  key: string,
  contentType: string
): Promise<string> => {
  if (!bucketName) {
    throw new Error(
      "S3 bucket name is not configured. Set the S3_STORAGE_BUCKET environment variable."
    );
  }

  console.log(
    `Starting S3 upload: Bucket=${bucketName}, Key=${key}, ContentType=${contentType}`
  );

  // Create the multipart upload
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: stream,
      ContentType: contentType,
      // Recommended to set ACL explicitly for security
      ACL: "private",
      // Adding cache control for better performance
      CacheControl: "max-age=31536000", // 1 year cache
    },
    // Configure multipart upload options
    queueSize: 4, // Concurrent uploads for larger files
    partSize: 1024 * 1024 * 5, // 5MB chunk size
    leavePartsOnError: false, // Clean up partial uploads on failure
  });

  // Set up progress tracking
  let lastLogged = 0;
  upload.on("httpUploadProgress", (progress) => {
    const percent =
      progress.loaded && progress.total
        ? Math.round((progress.loaded / progress.total) * 100)
        : 0;

    // Only log progress every 10% to avoid excessive logging
    if (percent >= lastLogged + 10 || percent === 100) {
      console.log(
        `S3 Upload Progress for ${key}: ${percent}% (${progress.loaded} / ${progress.total} bytes)`
      );
      lastLogged = percent;
    }
  });

  try {
    // Wait for the upload to complete
    const result = await upload.done();
    console.log(`S3 upload completed successfully for key: ${key}`);

    // For debugging: check if we have the expected ETag response indicating successful upload
    if (result.ETag) {
      console.log(`Upload confirmed with ETag: ${result.ETag}`);
    }

    return key; // Return the key on success
  } catch (error) {
    console.error(`S3 upload failed for key ${key}:`, error);

    // Add more specific error handling based on error types
    let errorMessage = `Failed to upload file to S3.`;

    if (error instanceof Error) {
      // Add more specific context to the error message
      if (error.message.includes("AccessDenied")) {
        errorMessage = `Access denied to S3 bucket ${bucketName}. Check IAM permissions for profile`;
      } else if (error.message.includes("timeout")) {
        errorMessage = `Network timeout while uploading to S3. File may be too large or network is unstable.`;
      } else if (error.message.includes("NoSuchBucket")) {
        errorMessage = `S3 bucket "${bucketName}" does not exist or is not accessible with profile. Check your bucket name and AWS credentials.`;
      } else if (error.message.includes("NetworkingError")) {
        errorMessage = `Network error while uploading to S3. Check your internet connection.`;
      } else if (error.message.includes("limit exceeded")) {
        errorMessage = `Size limit exceeded for S3 upload.`;
      } else {
        errorMessage = `S3 upload error: ${error.message}`;
      }
    }

    // Consider logging the error to a monitoring service here

    throw new Error(errorMessage);
  }
};

/**
 * Generates a presigned URL for accessing an S3 object.
 *
 * @param key The S3 object key (path within the bucket).
 * @param expiresIn Duration in seconds until the URL expires (default: 1 hour).
 * @returns A promise that resolves with the presigned URL.
 */
export const getPresignedUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  if (!bucketName) {
    throw new Error(
      "S3 bucket name is not configured. Set the S3_STORAGE_BUCKET environment variable."
    );
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error(`Failed to generate presigned URL for key ${key}:`, error);
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export { s3Client };
