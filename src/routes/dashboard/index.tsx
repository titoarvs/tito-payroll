import { createFileRoute } from "@tanstack/react-router";
import type { EmployeeLinkedUser } from "~/api-services/employees.types";
import { PayrollWelcomeDashboard } from "~/components/dashboard/payroll-welcome-dashboard";
import { EmployeeDetailHeader } from "~/components/employees/employee-detail-header";
import { Skeleton } from "~/components/ui/skeleton";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useMyEmployee } from "~/hooks/use-employees";
import { HrisApiError } from "~/lib/hris-api-client";
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

const toLinkedUser = (user: HrisUser): EmployeeLinkedUser => ({
  id: user.id,
  name:
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.name ||
    user.email,
  email: user.email,
  image: user.image ?? null,
});

function DashboardHomePage() {
  const { data: user, isPending: isUserPending } = useCurrentUser();
  const isAdmin = isSuperAdmin(user);
  const isOps = isPayrollOps(user);
  const { data, isPending, isError, error } = useMyEmployee(
    !isUserPending && !isAdmin && !isOps,
  );

  if (isUserPending) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isAdmin || isOps) {
    return (
      <PayrollWelcomeDashboard showEmployeeMetrics={isAdmin} />
    );
  }

  const errorMessage =
    error instanceof HrisApiError
      ? error.message
      : "Failed to load employee.";
  const isNotFound = error instanceof HrisApiError && error.status === 404;
  const employee = data?.data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {isPending ? (
        <Skeleton className="h-48 w-full" role="status" aria-label="Loading employee" />
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {isNotFound
            ? "No employee record linked to your account."
            : errorMessage}
        </p>
      ) : null}

      {!isPending && !isError && employee && user ? (
        <EmployeeDetailHeader
          employee={employee}
          linkedUser={toLinkedUser(user)}
        />
      ) : null}
    </div>
  );
}
