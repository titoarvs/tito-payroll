import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentHrisUser } from "~/lib/hris-auth";
import { hasPayrollOps } from "~/lib/payroll-access";

export const Route = createFileRoute("/dashboard/employees")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getCurrentHrisUser();
    if (!hasPayrollOps(user)) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: EmployeesLayout,
});

function EmployeesLayout() {
  return <Outlet />;
}
