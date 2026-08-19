import Link from "next/link";
import { and, count, eq, gte, sql } from "drizzle-orm";

import { SparkBars } from "@/features/analytics/spark-bars";
import { formatMoney } from "@/features/commerce/money";
import { db } from "@/db";
import { analyticsEvent } from "@/db/schema/analytics";
import { order } from "@/db/schema/commerce";
import { user } from "@/db/schema/auth";
import {
  bucketByDay,
  rangeToDays,
  type AnalyticsRange,
} from "@/lib/analytics-range";
import { requireAdmin } from "@/lib/require-admin";

const ranges: AnalyticsRange[] = ["7d", "30d", "90d"];

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const range = ranges.includes(params.range as AnalyticsRange)
    ? (params.range as AnalyticsRange)
    : "30d";
  const days = rangeToDays(range);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const [signupCount] = await db
    .select({ value: count() })
    .from(user)
    .where(gte(user.createdAt, since));

  const [activeUsers] = await db
    .select({
      value: sql<number>`count(distinct ${analyticsEvent.userId})::int`,
    })
    .from(analyticsEvent)
    .where(gte(analyticsEvent.createdAt, since));

  const [paidAgg] = await db
    .select({
      count: count(),
      revenue: sql<number>`coalesce(sum(${order.totalCents}), 0)::int`,
    })
    .from(order)
    .where(and(eq(order.status, "paid"), gte(order.createdAt, since)));

  const pageViewsByDay = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${analyticsEvent.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(analyticsEvent)
    .where(
      and(
        eq(analyticsEvent.name, "page_view"),
        gte(analyticsEvent.createdAt, since),
      ),
    )
    .groupBy(sql`date_trunc('day', ${analyticsEvent.createdAt})`)
    .orderBy(sql`date_trunc('day', ${analyticsEvent.createdAt})`);

  const topPaths = await db
    .select({
      path: analyticsEvent.path,
      count: sql<number>`count(*)::int`,
    })
    .from(analyticsEvent)
    .where(
      and(
        eq(analyticsEvent.name, "page_view"),
        gte(analyticsEvent.createdAt, since),
        sql`${analyticsEvent.path} is not null`,
      ),
    )
    .groupBy(analyticsEvent.path)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  const buckets = bucketByDay(
    pageViewsByDay.map((row) => ({ day: row.day, count: Number(row.count) })),
    days,
  );

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            analytics
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            Analytics
          </h1>
        </div>
        <div className="flex gap-2">
          {ranges.map((item) => (
            <Link
              key={item}
              href={`/admin/analytics?range=${item}`}
              className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
                item === range
                  ? "border-ink bg-ink text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {item}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Signups", value: String(signupCount?.value ?? 0) },
          {
            label: "Active users",
            value: String(activeUsers?.value ?? 0),
          },
          { label: "Paid orders", value: String(paidAgg?.count ?? 0) },
          {
            label: "Revenue",
            value: formatMoney(Number(paidAgg?.revenue ?? 0)),
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-white p-5"
          >
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Page views
        </h2>
        <SparkBars
          className="mt-4 w-full"
          values={buckets.map((bucket) => bucket.count)}
          labels={buckets.map((bucket) => bucket.day)}
        />
      </div>

      <div className="rounded-xl border border-border bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Top paths
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {topPaths.length === 0 ? (
            <li className="text-muted-foreground">No page views yet.</li>
          ) : (
            topPaths.map((row) => (
              <li key={row.path} className="flex justify-between gap-4">
                <span className="font-mono text-xs">{row.path}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {row.count}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
