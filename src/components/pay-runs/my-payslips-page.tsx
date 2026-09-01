import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Payslip } from "~/api-services/pay-runs.types";
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
import { useMyPayslips } from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";

type MyPayslipColumnId = "half" | "gross" | "deductions" | "net";

const MY_PAYSLIP_COLUMN_DEFS: TableColumnDef<MyPayslipColumnId>[] = [
  { id: "half", label: "Half" },
  { id: "gross", label: "Gross" },
  { id: "deductions", label: "Deductions" },
  { id: "net", label: "Net" },
];

const MY_PAYSLIP_COLUMNS_STORAGE_KEY = "payroll.my-payslips.tableColumns.v1";

const renderMyPayslipColumnCell = (
  id: MyPayslipColumnId,
  row: Payslip,
): ReactNode => {
  switch (id) {
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
  const { data, isPending, isError, error } = useMyPayslips();
  const { columns, setColumns, visibleIds, labelById } = useTableColumns(
    MY_PAYSLIP_COLUMNS_STORAGE_KEY,
    MY_PAYSLIP_COLUMN_DEFS,
  );
  const payslips = data?.data ?? [];
  const colSpan = 2 + visibleIds.length;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PageHeader
        title="My payslips"
        description="Released cutoffs only. Open a row to view payslip details."
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
              <CardTitle className="text-base">Payslip history</CardTitle>
              <CardDescription>
                Amounts as published for this account.
              </CardDescription>
            </div>
            <TableColumnVisibility
              columns={columns}
              labelById={labelById}
              onChange={setColumns}
              lockedHint="Period and View stay fixed."
            />
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="min-w-[40rem]">
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
                {payslips.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={colSpan}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No released payslips yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  payslips.map((row) => (
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
                        renderMyPayslipColumnCell(id, row),
                      )}
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
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
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
