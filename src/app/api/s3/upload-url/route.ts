import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/storage/s3";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const { filename, contentType } = await req.json();

  const key = `lms-app/${nanoid()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
    ACL: "private",
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return NextResponse.json({ url: signedUrl, key, bucket: process.env.S3_BUCKET_NAME! });
}
