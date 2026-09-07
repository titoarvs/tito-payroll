import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Payslip } from "~/api-services/pay-runs.types";
import {
  DEFAULT_EMPLOYEE_PAGE_SIZE,
  EmployeeListPagination,
  type EmployeePageSize,
} from "~/components/employees/employee-list-pagination";
import {
  cutoffHalfLabel,
  formatPayRunPeriod,
} from "~/components/pay-runs/pay-run-display";
import { PayRunStatusBadge } from "~/components/pay-runs/pay-run-status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
import {
  useComputePayRun,
  usePayRun,
  usePayRunPayslips,
  useReleasePayRun,
} from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";

interface PayRunDetailProps {
  payRunId: string;
}

type PayslipColumnId =
  | "hours"
  | "rate"
  | "basic"
  | "allowance"
  | "gross"
  | "sss"
  | "hdmf"
  | "philhealth"
  | "net";

const PAYSLIP_COLUMN_DEFS: TableColumnDef<PayslipColumnId>[] = [
  { id: "hours", label: "Hours" },
  { id: "rate", label: "Rate" },
  { id: "basic", label: "Basic" },
  { id: "allowance", label: "Allowance" },
  { id: "gross", label: "Gross" },
  { id: "sss", label: "SSS" },
  { id: "hdmf", label: "HDMF" },
  { id: "philhealth", label: "PhilHealth" },
  { id: "net", label: "Net" },
];

const PAYSLIP_COLUMNS_STORAGE_KEY = "payroll.pay-run-payslips.tableColumns.v1";

const renderPayslipColumnCell = (
  id: PayslipColumnId,
  row: Payslip,
): ReactNode => {
  switch (id) {
    case "hours":
      return (
        <TableCell key={id} className="tabular-nums">
          {row.hoursWorked}
        </TableCell>
      );
    case "rate":
      return (
        <TableCell key={id} className="tabular-nums">
          {row.hourlyRate}
        </TableCell>
      );
    case "basic":
      return (
        <TableCell key={id} className="tabular-nums">
          {row.basicPay}
        </TableCell>
      );
    case "allowance":
      return (
        <TableCell key={id} className="tabular-nums">
          {row.allowance}
        </TableCell>
      );
    case "gross":
      return (
        <TableCell key={id} className="tabular-nums">
          {row.grossPay}
        </TableCell>
      );
    case "sss":
      return (
        <TableCell key={id} className="tabular-nums">
          {row.sss}
        </TableCell>
      );
    case "hdmf":
      return (
        <TableCell key={id} className="tabular-nums">
          {row.hdmf}
        </TableCell>
      );
    case "philhealth":
      return (
        <TableCell key={id} className="tabular-nums">
          {row.philhealth}
        </TableCell>
      );
    case "net":
      return (
        <TableCell key={id} className="tabular-nums font-medium">
          {row.netPay}
        </TableCell>
      );
  }
};

export const PayRunDetail = ({ payRunId }: PayRunDetailProps) => {
  const { data, isPending, isError, error } = usePayRun(payRunId);
  const payslipsQuery = usePayRunPayslips(payRunId);
  const compute = useComputePayRun();
  const release = useReleasePayRun();
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<EmployeePageSize>(
    DEFAULT_EMPLOYEE_PAGE_SIZE,
  );
  const { columns, setColumns, visibleIds, labelById } = useTableColumns(
    PAYSLIP_COLUMNS_STORAGE_KEY,
    PAYSLIP_COLUMN_DEFS,
  );

  const payRun = data?.data;
  const payslips = payslipsQuery.data?.data ?? [];
  const total = payslips.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const colSpan = 1 + visibleIds.length;

  useEffect(() => {
    setPage(1);
  }, [payRunId, pageSize, total]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return payslips.slice(start, start + pageSize);
  }, [payslips, page, pageSize]);

  const actionError =
    (compute.error instanceof HrisApiError && compute.error.message) ||
    (release.error instanceof HrisApiError && release.error.message) ||
    null;

  if (isPending) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !payRun) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error instanceof HrisApiError ? error.message : "Pay run not found"}
      </p>
    );
  }

  const canCompute = payRun.status === "draft" || payRun.status === "computed";
  const canRelease = payRun.status === "computed";
  const isPayslipsLoading = payslipsQuery.isPending || payslipsQuery.isFetching;
  const periodLabel = formatPayRunPeriod(payRun.periodStart, payRun.periodEnd);
  const halfLabelShort = cutoffHalfLabel(payRun.cutoffHalf);
  const halfLabelFull = cutoffHalfLabel(payRun.cutoffHalf, { withFunds: true });

  const handleRelease = () => {
    release.mutate(payRunId, {
      onSuccess: () => setReleaseOpen(false),
    });
  };

  const actionButtons = (
    <>
      {canCompute ? (
        <Button
          type="button"
          size="sm"
          className="h-8"
          onClick={() => compute.mutate(payRunId)}
          disabled={compute.isPending}
        >
          {compute.isPending ? "Computing…" : "Compute"}
        </Button>
      ) : null}
      {canRelease ? (
        <AlertDialog open={releaseOpen} onOpenChange={setReleaseOpen}>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8">
              Release
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Release pay run?</AlertDialogTitle>
              <AlertDialogDescription>
                This will finalize payslips for {periodLabel} ({halfLabelFull}).
                Employees will see them under My payslips.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={release.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  handleRelease();
                }}
                disabled={release.isPending}
              >
                {release.isPending ? "Releasing…" : "Confirm release"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );

  const pagination = (
    <EmployeeListPagination
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      isLoading={isPayslipsLoading}
      itemLabel="payslips"
      pageSizeSelectId="payslip-page-size"
      onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
      onNextPage={() =>
        setPage((current) => Math.min(totalPages, current + 1))
      }
      onPageSizeChange={setPageSize}
    />
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 shrink-0 px-2 text-muted-foreground"
          >
            <Link to="/dashboard/pay-runs">← Pay runs</Link>
          </Button>
          <div className="flex shrink-0 items-center gap-1.5">{actionButtons}</div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="page-title min-w-0 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {periodLabel}
          </h2>
          <PayRunStatusBadge status={payRun.status} />
        </div>

        <p className="text-xs text-muted-foreground sm:text-sm">
          <span className="sm:hidden">{halfLabelShort}</span>
          <span className="hidden sm:inline">{halfLabelFull}</span>
        </p>
      </header>

      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-border/40 pb-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">Payslips</CardTitle>
            <CardDescription>
              Amounts from the latest compute for this cutoff.
            </CardDescription>
          </div>
          <TableColumnVisibility
            columns={columns}
            labelById={labelById}
            onChange={setColumns}
            lockedHint="Employee stays fixed."
          />
        </CardHeader>
        <CardContent className="flex flex-col p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[56rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  {visibleIds.map((id) => (
                    <TableHead key={id}>{labelById[id]}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslipsQuery.isPending ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={colSpan}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : total === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={colSpan}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No payslips yet. Run Compute.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="max-w-[16rem]">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate font-medium text-foreground">
                            {row.employeeName?.trim() || "Unknown employee"}
                          </span>
                          <span className="truncate font-mono text-xs text-muted-foreground">
                            {row.employeeCode?.trim()
                              ? `#${row.employeeCode}`
                              : row.employeeId}
                          </span>
                        </div>
                      </TableCell>
                      {visibleIds.map((id) =>
                        renderPayslipColumnCell(id, row),
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {pagination}
        </CardContent>
      </Card>
    </div>
  );
};
