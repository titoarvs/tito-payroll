import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { EmployeeDetailHeader } from "~/components/employees/employee-detail-header";
import { EmployeeSalaryRatesTable } from "~/components/employees/employee-salary-rates-table";
import { Skeleton } from "~/components/ui/skeleton";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useEmployee } from "~/hooks/use-employees";
import { HrisApiError } from "~/lib/hris-api-client";
import { canViewEmployeeSalaryRates } from "~/lib/payroll-access";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/dashboard/employees/$id")({
  ssr: false,
  component: EmployeeDetailPage,
});

function EmployeeDetailPage() {
  const { id } = Route.useParams();
  const { data: user } = useCurrentUser();
  const { data, isPending, isError, error } = useEmployee(id);
  const showSalaryRates = canViewEmployeeSalaryRates(user);

  const errorMessage =
    error instanceof HrisApiError
      ? error.message
      : "Failed to load employee.";
  const isNotFound = error instanceof HrisApiError && error.status === 404;

  const employee = data?.data.employee;
  const linkedUser = data?.data.linkedUser ?? null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 md:gap-8">
      <nav aria-label="Breadcrumb">
        <Link
          to="/dashboard/employees"
          className={cn(
            "inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors",
            "hover:text-foreground",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Employees
        </Link>
      </nav>

      {isPending ? (
        <div role="status" aria-label="Loading employee" className="space-y-6">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {isNotFound ? "Employee not found." : errorMessage}
        </p>
      ) : null}

      {!isPending && !isError && employee ? (
        <>
          <EmployeeDetailHeader
            employee={employee}
            linkedUser={linkedUser}
          />
          {showSalaryRates ? (
            <EmployeeSalaryRatesTable employeeId={employee.id} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
