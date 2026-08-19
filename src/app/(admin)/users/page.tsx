import { headers } from "next/headers";

import { UsersTable } from "@/components/dashboard/users-table";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";

export default async function UsersPage() {
  await requireAdmin();

  const result = await auth.api.listUsers({
    query: {
      limit: 100,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    headers: await headers(),
  });

  const users = (result.users ?? []).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ?? "user",
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : String(user.createdAt),
  }));

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          users
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Users
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open a user to change their role or reset their password.
        </p>
      </div>
      <UsersTable users={users} />
    </div>
  );
}
