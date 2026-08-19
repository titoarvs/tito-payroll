import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { bucketByDay, rangeToDays } from "@/lib/analytics-range";

describe("analytics bucketing", () => {
  it("maps ranges to day counts", () => {
    assert.equal(rangeToDays("7d"), 7);
    assert.equal(rangeToDays("30d"), 30);
    assert.equal(rangeToDays("90d"), 90);
  });

  it("fills missing days with zero", () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const key = today.toISOString().slice(0, 10);
    const buckets = bucketByDay([{ day: key, count: 3 }], 3);
    assert.equal(buckets.length, 3);
    assert.equal(buckets[2]?.day, key);
    assert.equal(buckets[2]?.count, 3);
    assert.equal(buckets[0]?.count, 0);
  });
});
