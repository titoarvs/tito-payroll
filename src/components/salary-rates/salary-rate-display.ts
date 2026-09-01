/** Prefill hourly from monthly: monthly ÷ 22 ÷ 8 (2 dp). Empty/invalid → "". */
export const deriveHourlyFromMonthly = (monthlySalary: string): string => {
  const cleaned = monthlySalary.replace(/,/g, "").trim();
  if (!cleaned || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return "";
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return "";
  return (amount / 22 / 8).toFixed(2);
};

/** Two cutoffs per month — monthly total from per-cutoff allowance (2 dp). */
export const monthlyAllowanceFromCutoff = (perCutoff: string): string => {
  const cleaned = perCutoff.replace(/,/g, "").trim();
  if (!cleaned || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return "";
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return "";
  return (amount * 2).toFixed(2);
};

export const displayEmployeeName = (
  firstName: string,
  lastName: string,
  employeeCode?: string,
): string => {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  const code = employeeCode?.trim();
  if (!name) return code || "Employee";
  return code ? `${name} (${code})` : name;
};
