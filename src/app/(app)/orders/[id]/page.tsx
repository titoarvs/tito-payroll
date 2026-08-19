import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { formatMoney } from "@/features/commerce/money";
import { db } from "@/db";
import { order, orderItem } from "@/db/schema/commerce";
import { requireSession } from "@/lib/require-admin";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: OrderDetailPageProps) {
  const session = await requireSession();
  const { id } = await params;
  const query = await searchParams;

  const [row] = await db
    .select()
    .from(order)
    .where(and(eq(order.id, id), eq(order.userId, session.user.id)))
    .limit(1);

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
          href="/orders"
          className="font-mono text-xs text-accent underline-offset-4 hover:underline"
        >
          ← Orders
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
          Order
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{row.id}</p>
        {query.paid === "1" && row.status !== "paid" ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Payment received — status updates when the Stripe webhook lands.
          </p>
        ) : null}
      </div>

      <dl className="grid gap-4 rounded-xl border border-border bg-white p-5 sm:grid-cols-3">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Status
          </dt>
          <dd className="mt-1 text-sm font-medium">{row.status}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Total
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {formatMoney(row.totalCents, row.currency)}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Created
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {row.createdAt.toLocaleString()}
          </dd>
        </div>
      </dl>

      <ul className="space-y-2 rounded-xl border border-border bg-white p-5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex justify-between gap-4 text-sm"
          >
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
