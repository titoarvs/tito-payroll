import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const analyticsEvent = pgTable(
  "analytics_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    anonId: text("anon_id"),
    path: text("path"),
    referrer: text("referrer"),
    props: jsonb("props").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("analytics_event_created_at_idx").on(table.createdAt),
    index("analytics_event_name_created_idx").on(table.name, table.createdAt),
  ],
);
