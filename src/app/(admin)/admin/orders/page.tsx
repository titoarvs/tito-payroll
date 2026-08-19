import Link from "next/link";
import { desc } from "drizzle-orm";

import { formatMoney } from "@/features/commerce/money";
import { db } from "@/db";
import { order } from "@/db/schema/commerce";
import { requireAdmin } from "@/lib/require-admin";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const rows = await db.select().from(order).orderBy(desc(order.createdAt));

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          sales
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Orders
        </h1>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
          No orders yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total</th>
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.userId}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.status}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {formatMoney(row.totalCents, row.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${row.id}`}
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      View
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
