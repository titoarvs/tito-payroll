import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/require-admin";

export default async function DashboardPage() {
  const session = await requireSession();
  const isAdmin = session.user.role === "admin";

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          dashboard
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Welcome, {session.user.name.trim().split(/\s+/)[0] || "there"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your signed-in home. Use settings to update your profile or password.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Update your display name or change your password.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/settings/profile">Edit profile</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/password">Change password</Link>
            </Button>
          </div>
        </div>

        {isAdmin ? (
          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">
              Admin
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage users and review the audit trail.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/admin">Admin overview</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/users">Users</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">
              Getting started
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Shop, orders, and notifications will appear here as modules are
              enabled.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
