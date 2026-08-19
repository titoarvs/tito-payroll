# Files — S3 uploads

## Purpose

Presigned PUT uploads to an S3-compatible bucket (AWS S3, R2, MinIO). Used for
avatars and (later) product images.

## Schema

`src/db/schema/file.ts` — table `file`:

- `id`, `key`, `contentType`, `sizeBytes`, `ownerId` → `user.id` set null,
  `createdAt`

## Helpers

- `src/lib/storage-key.ts` — MIME allowlist, key sanitization (unit-tested)
- `src/lib/storage.ts` — `getSignedUploadUrl`, `deleteObject`, `publicUrl`,
  `isStorageConfigured`

## Server actions

`src/features/files/actions.ts`:

- `createUploadUrl` — `requireSession`, Zod MIME + size, returns presigned URL + key
- `confirmUpload` — inserts `file` row after browser PUT; rejects keys that do
  not contain the session user id segment

Max size: 5 MB. Allowed: JPEG, PNG, WebP, GIF.

## UI

Avatar upload on `/settings/profile` via `ProfileForm`. When S3 env vars are
unset, the file input is replaced with a configuration hint.

## Env

```
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
# Optional for R2/MinIO:
S3_ENDPOINT=
S3_PUBLIC_BASE_URL=
```

`next.config.ts` adds `S3_PUBLIC_BASE_URL` host to `images.remotePatterns`.

## Removing this module

1. Delete `src/db/schema/file.ts`, `src/lib/storage.ts`, `src/lib/storage-key.ts`,
   `src/features/files/`, related tests
2. Remove `export * from "./file"` from `src/db/schema/index.ts`
3. Strip avatar upload UI from profile form
4. Drop S3_* from `env.ts` / `.env.example`
5. Delete this doc and `docs/qa/files.test-cases.md`
6. Generate a migration to drop `file` (or leave table if you prefer)
