# Files — QA Test Cases

## Overview

S3 presigned uploads for avatars on `/settings/profile`.

## Prerequisites

- Signed-in user
- Optional: S3_* env configured for full upload path

## Test Cases

### TC-01: Storage unset — graceful UI

- **Priority:** High
- **Preconditions:** S3_* unset
- **Steps:**
  1. Open `/settings/profile`
- **Expected result:** No file input; message to set S3_* env vars; name save still works

### TC-02: Upload avatar happy path

- **Priority:** High
- **Preconditions:** S3 configured; signed in
- **Steps:**
  1. Choose a PNG under 5 MB
  2. Wait for upload success
  3. Click Save profile
- **Expected result:** Preview updates; after save, `user.image` is the public URL

### TC-03: Reject oversized file

- **Priority:** Medium
- **Preconditions:** S3 configured
- **Steps:**
  1. Attempt upload larger than 5 MB
- **Expected result:** Error from `createUploadUrl`; no S3 PUT

### TC-04: Reject disallowed MIME

- **Priority:** Medium
- **Preconditions:** S3 configured
- **Steps:**
  1. Attempt to upload a PDF or other non-image
- **Expected result:** Error “Unsupported file type…”

### TC-05: Guest cannot call upload actions

- **Priority:** High
- **Preconditions:** Signed out
- **Steps:**
  1. Invoke `createUploadUrl` (e.g. via crafted client)
- **Expected result:** Redirect to login / no upload URL

## Edge Cases & Error States

- Failed S3 PUT shows an error and does not insert a `file` row
- Confirming a key that does not include the user id segment fails

## Out of Scope

- Product image admin UI (commerce module)
- Deleting orphaned S3 objects
