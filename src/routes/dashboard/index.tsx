import { createFileRoute } from "@tanstack/react-router";
import { EmployeeWelcomeDashboard } from "~/components/dashboard/employee-welcome-dashboard";
import { PayrollWelcomeDashboard } from "~/components/dashboard/payroll-welcome-dashboard";
import { Skeleton } from "~/components/ui/skeleton";
import { useCurrentUser } from "~/hooks/use-current-user";
import type { HrisUser } from "~/lib/hris-auth";
import { hasPayrollOps, userRoles } from "~/lib/payroll-access";

export const Route = createFileRoute("/dashboard/")({
  ssr: false,
  component: DashboardHomePage,
});

const isSuperAdmin = (user: HrisUser | undefined): boolean =>
  userRoles(user).includes("super_admin");

function DashboardHomePage() {
  const { data: user, isPending: isUserPending } = useCurrentUser();
  const isAdmin = isSuperAdmin(user);
  const isOps = hasPayrollOps(user);

  if (isUserPending) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isAdmin || isOps) {
    return <PayrollWelcomeDashboard showEmployeeMetrics={isAdmin} />;
  }

  return <EmployeeWelcomeDashboard />;
}
