"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { file } from "@/db/schema/file";
import { requireSession } from "@/lib/require-admin";
import {
  buildObjectKey,
  getSignedUploadUrl,
  isAllowedMime,
  isStorageConfigured,
  MAX_UPLOAD_BYTES,
  publicUrl,
  sanitizeUserIdForKey,
} from "@/lib/storage";

const createUploadUrlSchema = z.object({
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  prefix: z.enum(["avatars", "products"]).default("avatars"),
});

const confirmUploadSchema = z.object({
  key: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

export const createUploadUrl = async (
  input: z.infer<typeof createUploadUrlSchema>,
) => {
  const session = await requireSession();
  if (!isStorageConfigured()) {
    return { error: "File storage is not configured. Set S3_* env vars." };
  }

  const parsed = createUploadUrlSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (!isAllowedMime(parsed.data.contentType)) {
    return { error: "Unsupported file type. Use JPEG, PNG, WebP, or GIF." };
  }

  try {
    const key = buildObjectKey({
      prefix: parsed.data.prefix,
      userId: session.user.id,
      contentType: parsed.data.contentType,
    });
    const uploadUrl = await getSignedUploadUrl({
      key,
      contentType: parsed.data.contentType,
    });
    return { uploadUrl, key };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create upload URL",
    };
  }
};

export const confirmUpload = async (
  input: z.infer<typeof confirmUploadSchema>,
) => {
  const session = await requireSession();
  if (!isStorageConfigured()) {
    return { error: "File storage is not configured." };
  }

  const parsed = confirmUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (!isAllowedMime(parsed.data.contentType)) {
    return { error: "Unsupported file type." };
  }

  const expectedSegment = `/${sanitizeUserIdForKey(session.user.id)}/`;
  if (!parsed.data.key.includes(expectedSegment)) {
    return { error: "Invalid upload key" };
  }

  try {
    const [row] = await db
      .insert(file)
      .values({
        key: parsed.data.key,
        contentType: parsed.data.contentType,
        sizeBytes: parsed.data.sizeBytes,
        ownerId: session.user.id,
      })
      .returning();

    revalidatePath("/settings/profile");
    return {
      fileId: row.id,
      url: publicUrl(row.key),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to confirm upload",
    };
  }
};

export const getOwnedFileUrl = async (fileId: string) => {
  const session = await requireSession();
  const [row] = await db
    .select()
    .from(file)
    .where(and(eq(file.id, fileId), eq(file.ownerId, session.user.id)))
    .limit(1);
  if (!row) {
    return null;
  }
  return publicUrl(row.key);
};
