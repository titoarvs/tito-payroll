import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  FileBarChart,
  Tags,
  Users,
  Wallet,
} from "lucide-react";

export type PayrollNavSectionId = "payroll";

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
  { id: "payroll", label: "" },
];

export const PAYROLL_NAV_ITEMS: PayrollNavItem[] = [
  {
    to: "/dashboard/pay-runs",
    label: "Payroll Runs",
    icon: CalendarDays,
    section: "payroll",
    requiresPayrollOps: true,
  },
  {
    to: "/dashboard/final-pay",
    label: "Final Pay",
    icon: Wallet,
    section: "payroll",
    requiresPayrollOps: true,
  },
  {
    to: "/dashboard/other-deductions",
    label: "Other Deductions & Categories",
    icon: Tags,
    section: "payroll",
    requiresPayrollOps: true,
  },
  {
    to: "/dashboard/reports",
    label: "Reports",
    icon: FileBarChart,
    section: "payroll",
    requiresPayrollOps: true,
  },
  {
    to: "/dashboard/employees",
    label: "Employees",
    icon: Users,
    section: "payroll",
    requiresPayrollOps: true,
  },
];

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard/employees": "Employees",
  "/dashboard/pay-runs": "Payroll Runs",
  "/dashboard/final-pay": "Final Pay",
  "/dashboard/other-deductions": "Other Deductions & Categories",
  "/dashboard/reports": "Reports",
  "/dashboard/contribution-tables": "Contributions",
  "/dashboard/tax-tables": "Contributions",
  "/dashboard/my-payslips": "My payslips",
};

export const resolvePageTitle = (pathname: string): string => {
  if (pathname === "/dashboard/pay-runs/new") {
    return "Create pay run";
  }
  if (pathname.startsWith("/dashboard/pay-runs/")) {
    return "Pay run detail";
  }
  if (pathname.startsWith("/dashboard/employees/")) {
    return "Employee detail";
  }
  if (pathname.startsWith("/dashboard/final-pay")) {
    return "Final Pay";
  }
  if (pathname.startsWith("/dashboard/other-deductions")) {
    return "Other Deductions & Categories";
  }
  if (pathname.startsWith("/dashboard/reports")) {
    return "Reports";
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
