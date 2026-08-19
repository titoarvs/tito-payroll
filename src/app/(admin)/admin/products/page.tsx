import Link from "next/link";
import { desc } from "drizzle-orm";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/features/commerce/money";
import { db } from "@/db";
import { product } from "@/db/schema/commerce";
import { requireAdmin } from "@/lib/require-admin";

export default async function AdminProductsPage() {
  await requireAdmin();
  const rows = await db.select().from(product).orderBy(desc(product.createdAt));

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            catalog
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            Products
          </h1>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/products/new">New product</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
          No products yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {row.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {formatMoney(row.priceCents, row.currency)}
                  </td>
                  <td className="px-4 py-3">{row.isActive ? "yes" : "no"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${row.id}`}
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
