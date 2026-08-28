import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  Table2,
  Users,
} from "lucide-react";

export interface PayrollNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  requiresPayrollOps?: boolean;
}

export const PAYROLL_NAV_ITEMS: PayrollNavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/dashboard/employees",
    label: "Employees",
    icon: Users,
    requiresPayrollOps: true,
  },
  {
    to: "/dashboard/pay-runs",
    label: "Pay runs",
    icon: CalendarDays,
    requiresPayrollOps: true,
  },
  {
    to: "/dashboard/contribution-tables",
    label: "Contribution tables",
    icon: Table2,
    requiresPayrollOps: true,
  },
  {
    to: "/dashboard/my-payslips",
    label: "My payslips",
    icon: FileText,
  },
];

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/employees": "Employees",
  "/dashboard/pay-runs": "Pay runs",
  "/dashboard/contribution-tables": "Contribution tables",
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
