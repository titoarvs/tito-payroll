"use client";

import Link from "next/link";

import type { ManagedUser } from "@/components/dashboard/user-types";

interface UsersTableProps {
  users: ManagedUser[];
}

export const UsersTable = ({ users }: UsersTableProps) => {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
        No users yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/50 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-border/60 last:border-0"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/users/${user.id}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {user.name}
                </Link>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </td>
              <td className="px-4 py-3">
                <span className="rounded border border-border px-2 py-0.5 font-mono text-[11px]">
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/users/${user.id}`}
                  className="font-mono text-xs text-accent underline-offset-4 hover:underline"
                >
                  Open →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
