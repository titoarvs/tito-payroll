import Link from "next/link";

import {
  CartQuantityControls,
  CheckoutButton,
} from "@/features/commerce/cart-controls";
import { formatMoney } from "@/features/commerce/money";
import { getCartWithItems } from "@/features/commerce/queries";
import { requireSession } from "@/lib/require-admin";

export default async function CartPage() {
  const session = await requireSession();
  const { items, totalCents } = await getCartWithItems(session.user.id);

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          cart
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Cart
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
          Cart is empty.{" "}
          <Link href="/shop" className="text-accent underline">
            Browse the shop
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Line</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/shop/${item.slug}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatMoney(item.priceCents, item.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <CartQuantityControls
                        cartItemId={item.id}
                        quantity={item.quantity}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatMoney(
                        item.priceCents * item.quantity,
                        item.currency,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-sm">
              Total {formatMoney(totalCents, items[0]?.currency ?? "usd")}
            </p>
            <CheckoutButton />
          </div>
        </>
      )}
    </div>
  );
}
