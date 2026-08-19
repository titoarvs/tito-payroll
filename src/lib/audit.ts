import type { AuditAction } from "@/db/schema/audit";

export interface AuditPathMatch {
  action: AuditAction;
  /** When true, the request body carries the target user id. */
  hasTargetUser?: boolean;
  /** When true, the request body carries a new role. */
  hasRoleChange?: boolean;
}

/**
 * Maps Better Auth endpoint paths to audit actions.
 * Pure function — safe to unit-test without a database.
 */
export const resolveAuditAction = (path: string): AuditPathMatch | null => {
  if (
    path === "/sign-in/email" ||
    path.startsWith("/callback/") ||
    path === "/sign-in/social"
  ) {
    return { action: "login" };
  }

  if (path === "/sign-out") {
    return { action: "logout" };
  }

  if (path === "/admin/set-role") {
    return { action: "role_changed", hasTargetUser: true, hasRoleChange: true };
  }

  if (path === "/admin/set-user-password") {
    return { action: "password_reset_by_admin", hasTargetUser: true };
  }

  if (path === "/request-password-reset" || path === "/forget-password") {
    return { action: "password_reset_requested" };
  }

  if (path === "/reset-password") {
    return { action: "password_reset_self" };
  }

  if (path === "/admin/ban-user") {
    return { action: "user_banned", hasTargetUser: true };
  }

  if (path === "/admin/unban-user") {
    return { action: "user_unbanned", hasTargetUser: true };
  }

  return null;
};

export interface BuildAuditEntryInput {
  action: AuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  targetUserId?: string | null;
  targetEmail?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export const buildAuditEntry = (input: BuildAuditEntryInput) => ({
  action: input.action,
  actorId: input.actorId ?? null,
  actorEmail: input.actorEmail ?? null,
  targetUserId: input.targetUserId ?? null,
  targetEmail: input.targetEmail ?? null,
  metadata: input.metadata ?? null,
  ipAddress: input.ipAddress ?? null,
  userAgent: input.userAgent ?? null,
});
