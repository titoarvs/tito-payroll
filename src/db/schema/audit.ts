import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const auditActions = [
  "login",
  "logout",
  "role_changed",
  "password_reset_requested",
  "password_reset_self",
  "password_reset_by_admin",
  "user_banned",
  "user_unbanned",
  "order_paid",
  "product_created",
  "product_updated",
] as const;

export type AuditAction = (typeof auditActions)[number];

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    action: text("action").$type<AuditAction>().notNull(),
    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    actorEmail: text("actor_email"),
    targetUserId: text("target_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    targetEmail: text("target_email"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("audit_log_created_at_idx").on(table.createdAt)],
);
