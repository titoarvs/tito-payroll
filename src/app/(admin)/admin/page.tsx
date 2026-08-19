import Link from "next/link";
import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { order, product } from "@/db/schema/commerce";
import { auditLog } from "@/db/schema/audit";
import { requireAdmin } from "@/lib/require-admin";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [[usersCount], [productsCount], [ordersCount], [auditCount]] =
    await Promise.all([
      db.select({ value: count() }).from(user),
      db.select({ value: count() }).from(product),
      db
        .select({ value: count() })
        .from(order)
        .where(eq(order.status, "paid")),
      db.select({ value: count() }).from(auditLog),
    ]);

  const cards = [
    {
      href: "/users",
      title: "Users",
      body: "List users, change roles, reset passwords, ban.",
      value: usersCount?.value ?? 0,
    },
    {
      href: "/admin/products",
      title: "Products",
      body: "Manage the shop catalog.",
      value: productsCount?.value ?? 0,
    },
    {
      href: "/admin/orders",
      title: "Paid orders",
      body: "View checkout orders.",
      value: ordersCount?.value ?? 0,
    },
    {
      href: "/audit",
      title: "Audit events",
      body: "Filterable history of auth and admin actions.",
      value: auditCount?.value ?? 0,
    },
    {
      href: "/admin/analytics",
      title: "Analytics",
      body: "KPIs, page views, and top paths.",
      value: "→",
    },
  ];

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          admin
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Overview
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Headline counts across users, catalog, orders, and audit.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-border bg-white p-5 transition-colors hover:border-ink/30"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">
                {card.title}
              </h2>
              <p className="font-mono text-xl font-semibold text-accent">
                {card.value}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
