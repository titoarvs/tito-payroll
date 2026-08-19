import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { formatMoney, slugify, sumCartCents } from "@/features/commerce/money";

describe("commerce money helpers", () => {
  it("sums cart line totals in cents", () => {
    assert.equal(
      sumCartCents([
        { priceCents: 1000, quantity: 2 },
        { priceCents: 250, quantity: 1 },
      ]),
      2250,
    );
  });

  it("formats money", () => {
    assert.equal(formatMoney(1999, "usd"), "$19.99");
  });

  it("slugifies product names", () => {
    assert.equal(slugify("  Hello World!  "), "hello-world");
  });
});
