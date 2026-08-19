import Link from "next/link";
import { eq } from "drizzle-orm";

import { AddToCartButton } from "@/features/commerce/add-to-cart-button";
import { formatMoney } from "@/features/commerce/money";
import { db } from "@/db";
import { product } from "@/db/schema/commerce";
import { requireSession } from "@/lib/require-admin";

export default async function ShopPage() {
  await requireSession();

  const products = await db
    .select()
    .from(product)
    .where(eq(product.isActive, true));

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          shop
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Shop
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse products and check out with Stripe.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
          No products yet. Admins can add them under /admin/products.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {products.map((item) => (
            <li
              key={item.id}
              className="flex flex-col rounded-xl border border-border bg-white p-5"
            >
              <Link
                href={`/shop/${item.slug}`}
                className="font-display text-lg font-semibold text-ink underline-offset-4 hover:underline"
              >
                {item.name}
              </Link>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                {item.description || "No description"}
              </p>
              <p className="mt-3 font-mono text-sm">
                {formatMoney(item.priceCents, item.currency)}
              </p>
              <div className="mt-4">
                <AddToCartButton productId={item.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
