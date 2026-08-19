import Link from "next/link";
import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { auditActions, auditLog, type AuditAction } from "@/db/schema/audit";
import { requireAdmin } from "@/lib/require-admin";

const PAGE_SIZE = 20;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string; actor?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const actionFilter = auditActions.includes(params.action as AuditAction)
    ? (params.action as AuditAction)
    : undefined;
  const actorFilter = params.actor?.trim() || undefined;

  const filters = [];
  if (actionFilter) {
    filters.push(eq(auditLog.action, actionFilter));
  }
  if (actorFilter) {
    filters.push(
      sql`lower(coalesce(${auditLog.actorEmail}, '')) like ${`%${actorFilter.toLowerCase()}%`}`,
    );
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [totalRow] = await db
    .select({ value: count() })
    .from(auditLog)
    .where(where);

  const total = totalRow?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const rows = await db
    .select()
    .from(auditLog)
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(PAGE_SIZE)
    .offset((currentPage - 1) * PAGE_SIZE);

  const buildHref = (nextPage: number) => {
    const query = new URLSearchParams();
    if (actionFilter) query.set("action", actionFilter);
    if (actorFilter) query.set("actor", actorFilter);
    query.set("page", String(nextPage));
    return `/audit?${query.toString()}`;
  };

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          audit
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Audit trail
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Login, role changes, and password resets — newest first.
        </p>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
        <div className="space-y-1">
          <label htmlFor="action" className="text-sm font-medium">
            Action
          </label>
          <select
            id="action"
            name="action"
            defaultValue={actionFilter ?? ""}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm sm:w-48"
          >
            <option value="">All</option>
            {auditActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="actor" className="text-sm font-medium">
            Actor email
          </label>
          <input
            id="actor"
            name="actor"
            defaultValue={actorFilter ?? ""}
            placeholder="admin@"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm sm:w-64"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border/80 bg-white/70">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border/80 bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No audit events yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 last:border-0 align-top"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {row.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">{row.action}</td>
                  <td className="px-4 py-3">
                    {row.actorEmail ?? row.actorId ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.targetEmail ?? row.targetUserId ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {row.metadata
                      ? JSON.stringify(row.metadata)
                      : row.ipAddress
                        ? `ip ${row.ipAddress}`
                        : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Page {currentPage} of {totalPages} · {total} events
        </p>
        <div className="flex gap-2">
          {currentPage > 1 ? (
            <Link
              href={buildHref(currentPage - 1)}
              className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
            >
              Previous
            </Link>
          ) : null}
          {currentPage < totalPages ? (
            <Link
              href={buildHref(currentPage + 1)}
              className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
