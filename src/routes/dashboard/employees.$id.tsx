import { createFileRoute, Link } from "@tanstack/react-router";
import { EmployeeDetailHeader } from "~/components/employees/employee-detail-header";
import { EmployeePaySnapshot } from "~/components/employees/employee-pay-snapshot";
import { EmployeeSalaryRatesTable } from "~/components/employees/employee-salary-rates-table";
import { Skeleton } from "~/components/ui/skeleton";
import { useEmployee } from "~/hooks/use-employees";
import { HrisApiError } from "~/lib/hris-api-client";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/dashboard/employees/$id")({
  ssr: false,
  component: EmployeeDetailPage,
});

function EmployeeDetailPage() {
  const { id } = Route.useParams();
  const { data, isPending, isError, error } = useEmployee(id);

  const errorMessage =
    error instanceof HrisApiError
      ? error.message
      : "Failed to load employee.";
  const isNotFound = error instanceof HrisApiError && error.status === 404;

  const employee = data?.data.employee;
  const linkedUser = data?.data.linkedUser ?? null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 md:gap-6">
      <div>
        <Link
          to="/dashboard/employees"
          className={cn(
            "inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors",
            "hover:text-foreground active:scale-[0.97] motion-reduce:active:scale-100",
          )}
        >
          <span aria-hidden="true">←</span>
          Back to employees
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          Employees
          <span aria-hidden="true"> / </span>
          Employee details
        </p>
      </div>

      {isPending ? (
        <div
          className="grid gap-4 lg:grid-cols-12 lg:gap-5"
          role="status"
          aria-label="Loading employee"
        >
          <Skeleton className="h-80 rounded-xl lg:col-span-4" />
          <Skeleton className="h-80 rounded-xl lg:col-span-4" />
          <Skeleton className="h-80 rounded-xl lg:col-span-4" />
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
            aside={<EmployeePaySnapshot employeeId={employee.id} />}
          />
          <EmployeeSalaryRatesTable employeeId={employee.id} />
        </>
      ) : null}
    </div>
  );
}
