import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  LayoutDashboard,
  Table2,
  Users,
} from "lucide-react";

export type PayrollNavSectionId = "general" | "organization";

export interface PayrollNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  section: PayrollNavSectionId;
  exact?: boolean;
  requiresPayrollOps?: boolean;
}

export interface PayrollNavSection {
  id: PayrollNavSectionId;
  label: string;
}

export const PAYROLL_NAV_SECTIONS: PayrollNavSection[] = [
  { id: "general", label: "General" },
  { id: "organization", label: "Organization" },
];

export const PAYROLL_NAV_ITEMS: PayrollNavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    section: "general",
    exact: true,
  },
  {
    to: "/dashboard/employees",
    label: "Employees",
    icon: Users,
    section: "organization",
    requiresPayrollOps: true,
  },
  {
    to: "/dashboard/pay-runs",
    label: "Pay runs",
    icon: CalendarDays,
    section: "organization",
    requiresPayrollOps: true,
  },
  {
    to: "/dashboard/contribution-tables",
    label: "Contributions",
    icon: Table2,
    section: "organization",
    requiresPayrollOps: true,
  },
];

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/employees": "Employees",
  "/dashboard/pay-runs": "Pay runs",
  "/dashboard/contribution-tables": "Contributions",
  "/dashboard/tax-tables": "Contributions",
  "/dashboard/my-payslips": "My payslips",
};

export const resolvePageTitle = (pathname: string): string => {
  if (pathname.startsWith("/dashboard/pay-runs/")) {
    return "Pay run detail";
  }
  if (pathname.startsWith("/dashboard/employees/")) {
    return "Employee detail";
  }
  return PAGE_TITLES[pathname] ?? "Payroll";
};

export const isNavActive = (
  pathname: string,
  item: Pick<PayrollNavItem, "to" | "exact">,
): boolean =>
  item.exact
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(`${item.to}/`);
