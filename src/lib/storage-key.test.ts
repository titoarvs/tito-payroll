import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildObjectKey,
  extensionForMime,
  isAllowedMime,
} from "@/lib/storage-key";

describe("storage-key helpers", () => {
  it("allows known image MIME types", () => {
    assert.equal(isAllowedMime("image/png"), true);
    assert.equal(isAllowedMime("application/pdf"), false);
  });

  it("maps MIME to extension", () => {
    assert.equal(extensionForMime("image/jpeg"), "jpg");
    assert.equal(extensionForMime("image/png"), "png");
    assert.equal(extensionForMime("text/plain"), null);
  });

  it("builds a sanitized object key", () => {
    const key = buildObjectKey({
      prefix: "Avatars!!",
      userId: "user/with spaces",
      contentType: "image/webp",
    });
    assert.match(key, /^avatars\/user_with_spaces\/[0-9a-f-]+\.webp$/);
  });
});
