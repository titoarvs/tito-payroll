import { randomUUID } from "node:crypto";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const isAllowedMime = (contentType: string) =>
  ALLOWED_MIME.has(contentType);

/** Sanitize extension from MIME; never trust client filenames. */
export const extensionForMime = (contentType: string) => {
  return EXT_BY_MIME[contentType] ?? null;
};

export const buildObjectKey = ({
  prefix,
  userId,
  contentType,
}: {
  prefix: string;
  userId: string;
  contentType: string;
}) => {
  const ext = extensionForMime(contentType);
  if (!ext) {
    throw new Error("Unsupported content type");
  }
  const safePrefix =
    prefix.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "uploads";
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${safePrefix}/${safeUser}/${randomUUID()}.${ext}`;
};

export const sanitizeUserIdForKey = (userId: string) =>
  userId.replace(/[^a-zA-Z0-9_-]/g, "_");
