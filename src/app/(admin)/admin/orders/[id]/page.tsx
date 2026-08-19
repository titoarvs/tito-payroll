import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { formatMoney } from "@/features/commerce/money";
import { db } from "@/db";
import { order, orderItem } from "@/db/schema/commerce";
import { requireAdmin } from "@/lib/require-admin";

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const [row] = await db.select().from(order).where(eq(order.id, id)).limit(1);
  if (!row) {
    notFound();
  }

  const items = await db
    .select()
    .from(orderItem)
    .where(eq(orderItem.orderId, row.id));

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <Link
          href="/admin/orders"
          className="font-mono text-xs text-accent underline-offset-4 hover:underline"
        >
          ← Orders
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
          Order detail
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{row.id}</p>
      </div>

      <dl className="grid gap-4 rounded-xl border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="font-mono text-[11px] uppercase text-muted-foreground">
            Status
          </dt>
          <dd className="mt-1 text-sm font-medium">{row.status}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase text-muted-foreground">
            Total
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {formatMoney(row.totalCents, row.currency)}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase text-muted-foreground">
            User
          </dt>
          <dd className="mt-1 break-all font-mono text-xs">{row.userId}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase text-muted-foreground">
            Stripe session
          </dt>
          <dd className="mt-1 break-all font-mono text-xs">
            {row.stripeSessionId ?? "—"}
          </dd>
        </div>
      </dl>

      <ul className="space-y-2 rounded-xl border border-border bg-white p-5">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="font-mono text-xs">
              {formatMoney(item.unitAmountCents * item.quantity, item.currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
