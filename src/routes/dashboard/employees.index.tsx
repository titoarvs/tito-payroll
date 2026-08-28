import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type {
  EmployeeSortBy,
  EmployeeSortDir,
} from "~/api-services/employees.types";
import { EmployeeCardGrid } from "~/components/employees/employee-card";
import { EmployeeListControls } from "~/components/employees/employee-list-controls";
import {
  DEFAULT_EMPLOYEE_PAGE_SIZE,
  EmployeeListPagination,
  type EmployeePageSize,
} from "~/components/employees/employee-list-pagination";
import {
  EmployeeCardGridSkeleton,
  EmployeeTableSkeleton,
} from "~/components/employees/employee-roster-skeleton";
import { EmployeeTable } from "~/components/employees/employee-table";
import { toggleEmployeeSort } from "~/components/employees/employee-table-sort";
import { Card, CardContent } from "~/components/ui/card";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useEmployees } from "~/hooks/use-employees";
import { HrisApiError } from "~/lib/hris-api-client";

export const Route = createFileRoute("/dashboard/employees/")({
  ssr: false,
  component: EmployeesPage,
});

function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<EmployeePageSize>(
    DEFAULT_EMPLOYEE_PAGE_SIZE,
  );
  const [sortBy, setSortBy] = useState<EmployeeSortBy>("name");
  const [sortDir, setSortDir] = useState<EmployeeSortDir>("asc");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize, sortBy, sortDir]);

  const handleSort = useCallback((nextKey: EmployeeSortBy) => {
    const next = toggleEmployeeSort(sortBy, sortDir, nextKey);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
  }, [sortBy, sortDir]);

  const { data, isPending, isError, error, isFetching } = useEmployees({
    search: debouncedSearch.trim() || undefined,
    page,
    limit: pageSize,
    sortBy,
    sortDir,
  });

  const employees = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, data?.meta.totalPages ?? 1);
  const hasActiveSearch = Boolean(debouncedSearch.trim());
  const isLoading = isPending || isFetching;
  const showInitialSkeleton = isPending;
  const showRefreshing = isFetching && !isPending;

  const pagination = (
    <EmployeeListPagination
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      isLoading={isLoading}
      onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
      onNextPage={() =>
        setPage((current) => Math.min(totalPages, current + 1))
      }
      onPageSizeChange={setPageSize}
    />
  );

  const errorMessage =
    error instanceof HrisApiError
      ? error.message
      : "Failed to load employees.";

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 md:gap-6">
      <EmployeeListControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoading}
        className="w-full sm:max-w-sm"
      />

      {showInitialSkeleton ? (
        <>
          <EmployeeCardGridSkeleton className="md:hidden" />
          <EmployeeTableSkeleton className="hidden md:block" rowCount={DEFAULT_EMPLOYEE_PAGE_SIZE} />
        </>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {!showInitialSkeleton && !isError && employees.length === 0 ? (
        <Card className="overflow-hidden">
          <CardContent className="flex min-h-[12rem] items-center justify-center py-8">
            <p className="text-sm text-muted-foreground" role="status">
              {hasActiveSearch
                ? "No employees match your search."
                : "No employees found."}
            </p>
          </CardContent>
          {pagination}
        </Card>
      ) : null}

      {!showInitialSkeleton && !isError && employees.length > 0 ? (
        <>
          <div className="flex flex-col gap-4 md:hidden">
            <EmployeeCardGrid
              employees={employees}
              className={showRefreshing ? "opacity-60" : undefined}
            />
            <Card className="overflow-hidden">
              {pagination}
            </Card>
          </div>
          <EmployeeTable
            employees={employees}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            footer={pagination}
            isRefreshing={showRefreshing}
            className="hidden md:block"
          />
        </>
      ) : null}
    </div>
  );
}
