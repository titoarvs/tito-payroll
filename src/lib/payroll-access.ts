import type { HrisUser } from "~/lib/hris-auth";

/**
 * Maps to API `payroll.salary_rates.view` / `payroll.salary_rates.manage`
 * (seeded on super_admin, admin, and finance via PermissionGroups.PAYROLL).
 */
const PAYROLL_OPS_ROLES = ["super_admin", "admin", "finance"] as const;

export const userRoles = (user: HrisUser | undefined | null): string[] => {
  if (!user) return [];
  const roles = new Set<string>();
  if (user.role) roles.add(user.role);
  for (const role of user.roles ?? []) roles.add(role);
  return [...roles];
};

export const hasPayrollOps = (user: HrisUser | undefined | null): boolean =>
  userRoles(user).some((role) =>
    (PAYROLL_OPS_ROLES as readonly string[]).includes(role),
  );

/** Who may see the Salary and rates section / call salary-rates list. */
export const canViewEmployeeSalaryRates = (
  user: HrisUser | undefined | null,
): boolean => hasPayrollOps(user);

/** Who may save a new rate / call salary-rates create. */
export const canManageEmployeeSalaryRates = (
  user: HrisUser | undefined | null,
): boolean => hasPayrollOps(user);
