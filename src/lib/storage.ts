import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";

export {
  buildObjectKey,
  extensionForMime,
  isAllowedMime,
  MAX_UPLOAD_BYTES,
  sanitizeUserIdForKey,
} from "@/lib/storage-key";

export const isStorageConfigured = () =>
  Boolean(
    env.S3_REGION &&
      env.S3_BUCKET &&
      env.S3_ACCESS_KEY_ID &&
      env.S3_SECRET_ACCESS_KEY,
  );

const getClient = () => {
  if (!isStorageConfigured()) {
    throw new Error("S3 storage is not configured");
  }

  return new S3Client({
    region: env.S3_REGION!,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
    ...(env.S3_ENDPOINT
      ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true }
      : {}),
  });
};

export const getSignedUploadUrl = async ({
  key,
  contentType,
  expiresIn = 60,
}: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) => {
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn });
};

export const deleteObject = async (key: string) => {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: key,
    }),
  );
};

export const publicUrl = (key: string) => {
  if (env.S3_PUBLIC_BASE_URL) {
    return `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }
  if (env.S3_ENDPOINT) {
    return `${env.S3_ENDPOINT.replace(/\/$/, "")}/${env.S3_BUCKET}/${key}`;
  }
  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
};
