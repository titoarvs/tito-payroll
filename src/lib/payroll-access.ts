import type { HrisUser } from "~/lib/hris-auth";

/**
 * Ops who can open payroll nav (employees, pay runs, contribution/tax tables).
 * Process vs table-manage are further split below (SoD).
 */
const PAYROLL_OPS_ROLES = ["super_admin", "admin", "finance"] as const;

/** HR (`admin`) + finance: create / compute / release / edit adjustments. */
const PAY_RUN_PROCESS_ROLES = ["admin", "finance"] as const;

/** Super Admin + finance: edit SSS/HDMF/PhilHealth and tax brackets. */
const STATUTORY_TABLE_MANAGE_ROLES = ["super_admin", "finance"] as const;

export const userRoles = (user: HrisUser | undefined | null): string[] => {
  if (!user) return [];
  const roles = new Set<string>();
  if (user.role) roles.add(user.role);
  for (const role of user.roles ?? []) roles.add(role);
  return [...roles];
};

const hasAnyRole = (
  user: HrisUser | undefined | null,
  allowed: readonly string[],
): boolean =>
  userRoles(user).some((role) => allowed.includes(role));

export const hasPayrollOps = (user: HrisUser | undefined | null): boolean =>
  hasAnyRole(user, PAYROLL_OPS_ROLES);

/** Create pay run, compute, edit other adjustment, approve & release. */
export const canProcessPayRuns = (
  user: HrisUser | undefined | null,
): boolean => hasAnyRole(user, PAY_RUN_PROCESS_ROLES);

/** Edit contribution / tax table brackets. */
export const canManageStatutoryTables = (
  user: HrisUser | undefined | null,
): boolean => hasAnyRole(user, STATUTORY_TABLE_MANAGE_ROLES);

/** Who may see the Salary and rates section / call salary-rates list. */
export const canViewEmployeeSalaryRates = (
  user: HrisUser | undefined | null,
): boolean => hasPayrollOps(user);

/** Who may save a new rate / call salary-rates create. */
export const canManageEmployeeSalaryRates = (
  user: HrisUser | undefined | null,
): boolean => hasPayrollOps(user);
