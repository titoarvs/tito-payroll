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
import {
  EMPLOYEE_TABLE_COLUMN_DEFS,
  EMPLOYEE_TABLE_COLUMNS_STORAGE_KEY,
} from "~/components/employees/employee-table-columns";
import { toggleEmployeeSort } from "~/components/employees/employee-table-sort";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent } from "~/components/ui/card";
import {
  TableColumnVisibility,
  useTableColumns,
} from "~/components/ui/table-column-visibility";
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
  const { columns, setColumns, labelById } = useTableColumns(
    EMPLOYEE_TABLE_COLUMNS_STORAGE_KEY,
    EMPLOYEE_TABLE_COLUMN_DEFS,
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize, sortBy, sortDir]);

  const handleSort = useCallback(
    (nextKey: EmployeeSortBy) => {
      const next = toggleEmployeeSort(sortBy, sortDir, nextKey);
      setSortBy(next.sortBy);
      setSortDir(next.sortDir);
    },
    [sortBy, sortDir],
  );

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
      onNextPage={() => setPage((current) => Math.min(totalPages, current + 1))}
      onPageSizeChange={setPageSize}
    />
  );

  const errorMessage =
    error instanceof HrisApiError ? error.message : "Failed to load employees.";

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 md:gap-6">
      <PageHeader
        className="shrink-0"
        title="Employees"
        description="Browse employee records linked to payroll."
        actions={
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <TableColumnVisibility
              columns={columns}
              labelById={labelById}
              onChange={setColumns}
              lockedHint="Employee and Actions stay fixed."
              className="hidden md:inline-flex"
            />
            <EmployeeListControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isLoading={isLoading}
              className="w-full min-w-[14rem] sm:w-72"
            />
          </div>
        }
      />

      {showInitialSkeleton ? (
        <>
          <EmployeeCardGridSkeleton className="md:hidden" />
          <EmployeeTableSkeleton
            className="hidden min-h-0 md:flex"
            rowCount={DEFAULT_EMPLOYEE_PAGE_SIZE}
          />
        </>
      ) : null}

      {isError ? (
        <p className="shrink-0 text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {!showInitialSkeleton && !isError && employees.length === 0 ? (
        <Card className="min-h-0 flex-1 overflow-hidden">
          <CardContent className="flex min-h-[12rem] flex-1 items-center justify-center py-8">
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
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto md:hidden">
            <EmployeeCardGrid
              employees={employees}
              className={showRefreshing ? "opacity-60" : undefined}
            />
            <Card className="shrink-0 overflow-hidden">{pagination}</Card>
          </div>
          <EmployeeTable
            employees={employees}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            columns={columns}
            footer={pagination}
            isRefreshing={showRefreshing}
            className="hidden min-h-0 md:flex"
          />
        </>
      ) : null}
    </div>
  );
}
