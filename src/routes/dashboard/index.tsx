import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Users } from "lucide-react";
import type { EmployeeLinkedUser } from "~/api-services/employees.types";
import { EmployeeDetailHeader } from "~/components/employees/employee-detail-header";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Welcome</h2>
          <p className="text-sm text-muted-foreground">
            Manage payroll cutoffs, employees, and contribution tables.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="card-hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-5 w-5 text-primary" />
                Pay runs
              </CardTitle>
              <CardDescription>
                Create cutoffs, compute hours, and release payslips.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/dashboard/pay-runs">Open pay runs</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="card-hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                Employees
              </CardTitle>
              <CardDescription>
                Browse employee records linked to payroll.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/dashboard/employees">View employees</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
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
