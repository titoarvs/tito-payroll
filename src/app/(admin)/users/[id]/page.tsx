import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import {
  UserBanForm,
  UserPasswordForm,
  UserRoleForm,
} from "@/components/dashboard/user-detail-forms";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const session = await requireAdmin();
  const { id } = await params;

  let user: Awaited<ReturnType<typeof auth.api.getUser>>;
  try {
    user = await auth.api.getUser({
      query: { id },
      headers: await headers(),
    });
  } catch {
    notFound();
  }

  if (!user) {
    notFound();
  }

  const role = user.role ?? "user";
  const createdAt =
    user.createdAt instanceof Date
      ? user.createdAt.toISOString()
      : String(user.createdAt);

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <Link
          href="/users"
          className="font-mono text-xs text-accent underline-offset-4 hover:underline"
        >
          ← Users
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
          {user.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>

      <dl className="grid gap-4 rounded-xl border border-border bg-white p-5 sm:grid-cols-3">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Role
          </dt>
          <dd className="mt-1 text-sm font-medium">{role}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Joined
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {new Date(createdAt).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            User ID
          </dt>
          <dd className="mt-1 break-all font-mono text-xs">{user.id}</dd>
        </div>
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <UserRoleForm
          userId={user.id}
          currentRole={role}
          isSelf={user.id === session.user.id}
        />
        <UserPasswordForm userId={user.id} userName={user.name} />
        <UserBanForm
          userId={user.id}
          userName={user.name}
          isBanned={Boolean(user.banned)}
          isSelf={user.id === session.user.id}
          banReason={user.banReason}
        />
      </div>
    </div>
  );
}
