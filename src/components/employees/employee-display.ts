import type { EmployeeListItem } from "~/api-services/employees.types";

export const isHttpImage = (image: string | null | undefined): image is string =>
  typeof image === "string" && /^https?:\/\//i.test(image);

export const displayName = (employee: EmployeeListItem): string =>
  [employee.firstName, employee.lastName].filter(Boolean).join(" ").trim();

export const initialsFrom = (name: string): string => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
};

export const positionLabel = (employee: EmployeeListItem): string =>
  employee.position?.trim() || "—";

export const departmentLabel = (employee: EmployeeListItem): string =>
  employee.department?.trim() || "—";

export const employeeCodeLabel = (employee: EmployeeListItem): string =>
  employee.employeeCode?.trim() || "—";

const parseEmployeeDate = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T00:00:00`
    : trimmed;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatEmployeeDate = (value: string | null | undefined): string => {
  if (!value?.trim()) return "—";
  const date = parseEmployeeDate(value);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const titleCaseStatus = (status: string | null | undefined): string => {
  if (!status?.trim()) return "—";
  return status
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
