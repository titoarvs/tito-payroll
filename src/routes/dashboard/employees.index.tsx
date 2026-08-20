import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EmployeeCardGrid } from "~/components/employees/employee-card";
import { EmployeeListControls } from "~/components/employees/employee-list-controls";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useEmployees } from "~/hooks/use-employees";
import { HrisApiError } from "~/lib/hris-api-client";

const PAGE_SIZE = 15;

export const Route = createFileRoute("/dashboard/employees/")({
  ssr: false,
  component: EmployeesPage,
});

function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isPending, isError, error, isFetching } = useEmployees({
    search: debouncedSearch.trim() || undefined,
    page,
    limit: PAGE_SIZE,
    sortBy: "name",
    sortDir: "asc",
  });

  const employees = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, data?.meta.totalPages ?? 1);
  const hasActiveSearch = Boolean(debouncedSearch.trim());

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handlePreviousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const handleNextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  const errorMessage =
    error instanceof HrisApiError
      ? error.message
      : "Failed to load employees.";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Employees
        </h2>
        <p className="text-sm text-muted-foreground">
          Browse the employee roster for payroll.
        </p>
      </header>

      <EmployeeListControls
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        isLoading={isPending || isFetching}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
      />

      {isPending ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading employees…
        </p>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {!isPending && !isError && employees.length === 0 ? (
        <p className="text-sm text-muted-foreground" role="status">
          {hasActiveSearch
            ? "No employees match your search."
            : "No employees found."}
        </p>
      ) : null}

      {!isPending && !isError && employees.length > 0 ? (
        <EmployeeCardGrid employees={employees} />
      ) : null}
    </div>
  );
}
