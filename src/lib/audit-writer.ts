import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";

import { buildAuditEntry, type BuildAuditEntryInput } from "./audit";

/**
 * Persist an audit row. Failures are swallowed so logging never breaks auth.
 */
export const writeAuditLog = async (input: BuildAuditEntryInput) => {
  try {
    await db.insert(auditLog).values(buildAuditEntry(input));
  } catch (error) {
    console.error("[audit] failed to write audit log", error);
  }
};
