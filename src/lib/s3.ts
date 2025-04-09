import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { fromIni } from '@aws-sdk/credential-provider-ini';

// Use a specific profile for AWS credentials
const PROFILE = 'work-mfa';

// Configure the S3 client with the specified profile
const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: fromIni({ profile: PROFILE }),
  maxAttempts: 3 
});

// Get bucket name from environment variable
const bucketName = process.env.S3_STORAGE_BUCKET;

if (!bucketName) {
  console.warn(
    'S3_STORAGE_BUCKET environment variable is not set. Uploads will fail.',
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
  contentType: string,
): Promise<string> => {
  if (!bucketName) {
    throw new Error(
      'S3 bucket name is not configured. Set the S3_STORAGE_BUCKET environment variable.',
    );
  }

  console.log(`Starting S3 upload: Bucket=${bucketName}, Key=${key}, ContentType=${contentType}`);
  console.log(`Using AWS profile: ${PROFILE}`);

  // Create the multipart upload
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: stream,
      ContentType: contentType,
      // Recommended to set ACL explicitly for security
      ACL: 'private',
      // Adding cache control for better performance
      CacheControl: 'max-age=31536000', // 1 year cache
    },
    // Configure multipart upload options
    queueSize: 4, // Concurrent uploads for larger files
    partSize: 1024 * 1024 * 5, // 5MB chunk size
    leavePartsOnError: false, // Clean up partial uploads on failure
  });

  // Set up progress tracking
  let lastLogged = 0;
  upload.on('httpUploadProgress', (progress) => {
    const percent = progress.loaded && progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0;
    
    // Only log progress every 10% to avoid excessive logging
    if (percent >= lastLogged + 10 || percent === 100) {
      console.log(`S3 Upload Progress for ${key}: ${percent}% (${progress.loaded} / ${progress.total} bytes)`);
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
      if (error.message.includes('AccessDenied')) {
        errorMessage = `Access denied to S3 bucket ${bucketName}. Check IAM permissions for profile "${PROFILE}".`;
      } else if (error.message.includes('timeout')) {
        errorMessage = `Network timeout while uploading to S3. File may be too large or network is unstable.`;
      } else if (error.message.includes('NoSuchBucket')) {
        errorMessage = `S3 bucket "${bucketName}" does not exist or is not accessible with the "${PROFILE}" profile. Check your bucket name and AWS credentials.`;
      } else if (error.message.includes('NetworkingError')) {
        errorMessage = `Network error while uploading to S3. Check your internet connection.`;
      } else if (error.message.includes('limit exceeded')) {
        errorMessage = `Size limit exceeded for S3 upload.`;
      } else {
        errorMessage = `S3 upload error: ${error.message}`;
      }
    }
    
    // Consider logging the error to a monitoring service here
    
    throw new Error(errorMessage);
  }
};

export { s3Client };