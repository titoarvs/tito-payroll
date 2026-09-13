import { createFileRoute } from "@tanstack/react-router";
import { EmployeeWelcomeDashboard } from "~/components/dashboard/employee-welcome-dashboard";
import { PayrollWelcomeDashboard } from "~/components/dashboard/payroll-welcome-dashboard";
import { Skeleton } from "~/components/ui/skeleton";
import { useCurrentUser } from "~/hooks/use-current-user";
import type { HrisUser } from "~/lib/hris-auth";

export const Route = createFileRoute("/dashboard/")({
  ssr: false,
  component: DashboardHomePage,
});

const isSuperAdmin = (user: HrisUser | undefined): boolean => {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return user.roles?.includes("super_admin") === true;
};

const isPayrollOps = (user: HrisUser | undefined): boolean => {
  if (!user) return false;
  const roles = new Set<string>();
  if (user.role) roles.add(user.role);
  for (const role of user.roles ?? []) roles.add(role);
  return ["super_admin", "admin", "finance"].some((r) => roles.has(r));
};

function DashboardHomePage() {
  const { data: user, isPending: isUserPending } = useCurrentUser();
  const isAdmin = isSuperAdmin(user);
  const isOps = isPayrollOps(user);

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
