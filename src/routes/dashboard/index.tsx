import { createFileRoute } from "@tanstack/react-router";
import type { EmployeeLinkedUser } from "~/api-services/employees.types";
import { EmployeeDetailHeader } from "~/components/employees/employee-detail-header";
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
  const { data, isPending, isError, error } = useMyEmployee(
    !isUserPending && !isAdmin,
  );

  if (isUserPending || isAdmin) {
    return null;
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
        <p className="text-sm text-muted-foreground" role="status">
          Loading employee…
        </p>
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
