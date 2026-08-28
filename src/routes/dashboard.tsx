import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PayrollLayout } from "~/components/layout/payroll-layout";
import { hasHrisSession } from "~/lib/hris-auth";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: () => {
    if (!hasHrisSession()) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <PayrollLayout>
      <Outlet />
    </PayrollLayout>
  );
}
