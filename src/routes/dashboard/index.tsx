import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentHrisUser } from "~/lib/hris-auth";
import { hasPayrollOps } from "~/lib/payroll-access";

export const Route = createFileRoute("/dashboard/")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getCurrentHrisUser();
    throw redirect({
      to: hasPayrollOps(user) ? "/dashboard/pay-runs" : "/dashboard/my-payslips",
    });
  },
});
