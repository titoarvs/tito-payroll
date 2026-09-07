import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Payslip } from "~/api-services/pay-runs.types";
import {
  DEFAULT_EMPLOYEE_PAGE_SIZE,
  EmployeeListPagination,
  type EmployeePageSize,
} from "~/components/employees/employee-list-pagination";
import { PageHeader } from "~/components/layout/page-header";
import {
  cutoffHalfLabel,
  formatPayRunPeriod,
  formatPayslipMoney,
} from "~/components/pay-runs/pay-run-display";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  TableColumnVisibility,
  useTableColumns,
  type TableColumnDef,
} from "~/components/ui/table-column-visibility";
import { useCurrentUser } from "~/hooks/use-current-user";
import {
  useAllReleasedPayslips,
  useMyPayslips,
} from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";
import { hasPayrollOps } from "~/lib/payroll-access";

type PayslipColumnId = "employee" | "half" | "gross" | "deductions" | "net";

const OWN_COLUMN_DEFS: TableColumnDef<PayslipColumnId>[] = [
  { id: "half", label: "Half" },
  { id: "gross", label: "Gross" },
  { id: "deductions", label: "Deductions" },
  { id: "net", label: "Net" },
];

const OPS_COLUMN_DEFS: TableColumnDef<PayslipColumnId>[] = [
  { id: "employee", label: "Employee" },
  ...OWN_COLUMN_DEFS,
];

const OWN_COLUMNS_STORAGE_KEY = "payroll.my-payslips.tableColumns.v1";
const OPS_COLUMNS_STORAGE_KEY = "payroll.all-payslips.tableColumns.v1";

const employeeLabel = (row: Payslip): string => {
  const name = row.employeeName?.trim();
  if (name) return name;
  const code = row.employeeCode?.trim();
  if (code) return code;
  return "—";
};

const renderPayslipColumnCell = (
  id: PayslipColumnId,
  row: Payslip,
): ReactNode => {
  switch (id) {
    case "employee":
      return (
        <TableCell key={id}>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{employeeLabel(row)}</p>
            {row.employeeCode ? (
              <p className="text-xs text-muted-foreground">{row.employeeCode}</p>
            ) : null}
          </div>
        </TableCell>
      );
    case "half":
      return (
        <TableCell key={id}>
          {cutoffHalfLabel(row.cutoffHalf ?? "")}
        </TableCell>
      );
    case "gross":
      return (
        <TableCell key={id} className="tabular-nums">
          {formatPayslipMoney(row.grossPay)}
        </TableCell>
      );
    case "deductions":
      return (
        <TableCell key={id} className="tabular-nums">
          {formatPayslipMoney(row.totalDeductions)}
        </TableCell>
      );
    case "net":
      return (
        <TableCell
          key={id}
          className="tabular-nums font-medium text-tito-green-text dark:text-primary"
        >
          {formatPayslipMoney(row.netPay)}
        </TableCell>
      );
  }
};

export const MyPayslipsPage = () => {
  const { data: user } = useCurrentUser();
  const isOps = hasPayrollOps(user);

  const mineQuery = useMyPayslips(!isOps);
  const allQuery = useAllReleasedPayslips(isOps);
  const active = isOps ? allQuery : mineQuery;

  const { columns, setColumns, visibleIds, labelById } = useTableColumns(
    isOps ? OPS_COLUMNS_STORAGE_KEY : OWN_COLUMNS_STORAGE_KEY,
    isOps ? OPS_COLUMN_DEFS : OWN_COLUMN_DEFS,
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<EmployeePageSize>(
    DEFAULT_EMPLOYEE_PAGE_SIZE,
  );

  const payslips = active.data?.data ?? [];

  const filtered = useMemo(() => {
    if (!isOps) return payslips;
    const term = search.trim().toLowerCase();
    if (!term) return payslips;
    return payslips.filter((row) => {
      const haystack = [
        row.employeeName,
        row.employeeCode,
        row.periodStart,
        row.periodEnd,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [payslips, search, isOps]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, pageSize, isOps]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    if (!isOps) return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize, isOps]);

  const colSpan = 2 + visibleIds.length;
  const { isPending, isError, error } = active;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PageHeader
        title={isOps ? "Payslips" : "My payslips"}
        description={
          isOps
            ? "All released employee payslips. Open a row to view details."
            : "Released cutoffs only. Open a row to view payslip details."
        }
      />

      {isPending ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof HrisApiError
            ? error.message
            : "Failed to load payslips"}
        </p>
      ) : null}

      {!isPending && !isError ? (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-border/40 pb-4">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base">
                {isOps ? "All released payslips" : "Payslip history"}
              </CardTitle>
              <CardDescription>
                {isOps
                  ? `${total.toLocaleString()} slip${total === 1 ? "" : "s"} across released cutoffs.`
                  : "Amounts as published for this account."}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isOps ? (
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search employee or period"
                  className="sm:w-56"
                  aria-label="Search payslips"
                />
              ) : null}
              <TableColumnVisibility
                columns={columns}
                labelById={labelById}
                onChange={setColumns}
                lockedHint="Period and View stay fixed."
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className={isOps ? "min-w-[52rem]" : "min-w-[40rem]"}>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  {visibleIds.map((id) => (
                    <TableHead key={id}>{labelById[id]}</TableHead>
                  ))}
                  <TableHead className="w-[1%] text-right">
                    <span className="sr-only">View</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={colSpan}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {isOps && search.trim()
                        ? "No payslips match this search."
                        : "No released payslips yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link
                          to="/dashboard/my-payslips/$payslipId"
                          params={{ payslipId: row.id }}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {formatPayRunPeriod(
                            row.periodStart ?? "",
                            row.periodEnd ?? "",
                          )}
                        </Link>
                      </TableCell>
                      {visibleIds.map((id) =>
                        renderPayslipColumnCell(id, row),
                      )}
                      <TableCell className="text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                        >
                          <Link
                            to="/dashboard/my-payslips/$payslipId"
                            params={{ payslipId: row.id }}
                          >
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {isOps ? (
              <EmployeeListPagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
                onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
                onPageSizeChange={setPageSize}
                itemLabel="payslips"
                pageSizeSelectId="payslips-page-size"
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
