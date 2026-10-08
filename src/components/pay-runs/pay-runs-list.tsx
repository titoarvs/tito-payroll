import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { PayRun } from "~/api-services/pay-runs.types";
import { PageHeader } from "~/components/layout/page-header";
import {
  approvalDueLabel,
  cutoffHalfLabel,
  formatPayRunPeriod,
} from "~/components/pay-runs/pay-run-display";
import { PayRunStatusBadge } from "~/components/pay-runs/pay-run-status-badge";
import { Badge } from "~/components/ui/badge";
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
import { useCurrentUser } from "~/hooks/use-current-user";
import { usePayRuns } from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";
import { canProcessPayRuns } from "~/lib/payroll-access";

type PayRunColumnId = "half" | "status";

const PAY_RUN_COLUMN_DEFS: TableColumnDef<PayRunColumnId>[] = [
  { id: "half", label: "Half" },
  { id: "status", label: "Status" },
];

const PAY_RUN_COLUMNS_STORAGE_KEY = "payroll.pay-runs.tableColumns.v1";

const renderPayRunColumnCell = (
  id: PayRunColumnId,
  run: PayRun,
): ReactNode => {
  switch (id) {
    case "half":
      return (
        <TableCell key={id}>{cutoffHalfLabel(run.cutoffHalf)}</TableCell>
      );
    case "status":
      return (
        <TableCell key={id}>
          <div className="flex flex-wrap items-center gap-1.5">
            <PayRunStatusBadge status={run.status} />
            {(() => {
              const due = approvalDueLabel(run.status, run.periodEnd);
              if (!due) return null;
              return (
                <Badge
                  variant={
                    due === "Approval overdue" ? "destructive" : "secondary"
                  }
                >
                  {due}
                </Badge>
              );
            })()}
          </div>
        </TableCell>
      );
  }
};

export const PayRunsList = () => {
  const { data: user } = useCurrentUser();
  const mayProcess = canProcessPayRuns(user);
  const { data, isPending, isError, error } = usePayRuns();
  const { columns, setColumns, visibleIds, labelById } = useTableColumns(
    PAY_RUN_COLUMNS_STORAGE_KEY,
    PAY_RUN_COLUMN_DEFS,
  );

  const runs = data?.data ?? [];
  const colSpan = 2 + visibleIds.length;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PageHeader
        title="Pay runs"
        description={
          mayProcess
            ? "Open a cutoff to compute from Tito Clock hours, then release."
            : "View cutoffs and payslips. Processing is limited to HR and finance."
        }
        actions={
          mayProcess ? (
            <Button asChild>
              <Link to="/dashboard/pay-runs/new">Create pay run</Link>
            </Button>
          ) : null
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
            : "Failed to load pay runs"}
        </p>
      ) : null}

      {!isPending && !isError ? (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-border/40 pb-4">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base">Pay run list</CardTitle>
              <CardDescription>
                Open a cutoff to compute or release.
              </CardDescription>
            </div>
            <TableColumnVisibility
              columns={columns}
              labelById={labelById}
              onChange={setColumns}
              lockedHint="Period and Actions stay fixed."
            />
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table empty={runs.length === 0} className="min-w-[40rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  {visibleIds.map((id) => (
                    <TableHead key={id}>{labelById[id]}</TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={colSpan}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No pay runs yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span>
                            {formatPayRunPeriod(run.periodStart, run.periodEnd)}
                          </span>
                          {(run.kind ?? "regular") === "correction" ? (
                            <Badge variant="secondary">Correction</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      {visibleIds.map((id) => renderPayRunColumnCell(id, run))}
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            to="/dashboard/pay-runs/$id"
                            params={{ id: run.id }}
                          >
                            Open
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
