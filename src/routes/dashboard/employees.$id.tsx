import { createFileRoute, Link } from "@tanstack/react-router";
import { EmployeeDetailHeader } from "~/components/employees/employee-detail-header";
import { useEmployee } from "~/hooks/use-employees";
import { HrisApiError } from "~/lib/hris-api-client";

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <Link
          to="/dashboard/employees"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          Back to employees
        </Link>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading employee…
        </p>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {isNotFound ? "Employee not found." : errorMessage}
        </p>
      ) : null}

      {!isPending && !isError && employee ? (
        <EmployeeDetailHeader employee={employee} linkedUser={linkedUser} />
      ) : null}
    </div>
  );
}
