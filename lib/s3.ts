import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_URL || 'http://localhost:10000',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_USERNAME || 'minioadmin',
    secretAccessKey: process.env.AWS_PASSWORD || 'minioadmin1234',
  },
});

// Presigned URLs are consumed by the browser, so they must use the
// publicly reachable HTTPS endpoint, not an internal Docker network host.
const s3Public = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_PUBLIC_URL || process.env.AWS_URL || 'http://localhost:10000',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_USERNAME || 'minioadmin',
    secretAccessKey: process.env.AWS_PASSWORD || 'minioadmin1234',
  },
});

const BUCKET = process.env.AWS_BUCKET || 'sede-electronica';

let bucketReady: Promise<void> | null = null;

async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
  }
}

function getBucketReady(): Promise<void> {
  if (!bucketReady) bucketReady = ensureBucket();
  return bucketReady;
}

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<void> {
  await getBucketReady();
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Public, command, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
