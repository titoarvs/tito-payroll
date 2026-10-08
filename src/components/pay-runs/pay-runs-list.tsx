import { Link } from "@tanstack/react-router";
import { parseISO } from "date-fns";
import { useState, type ReactNode } from "react";
import type { CutoffHalf, PayRun } from "~/api-services/pay-runs.types";
import { PageHeader } from "~/components/layout/page-header";
import {
  approvalDueLabel,
  cutoffHalfLabel,
  defaultPayPeriod,
  formatPayRunPeriod,
  payPeriodForHalf,
} from "~/components/pay-runs/pay-run-display";
import { PeriodDateRangeField } from "~/components/pay-runs/period-date-range-field";
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
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
import { useCreatePayRun, usePayRuns } from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";
import { canProcessPayRuns } from "~/lib/payroll-access";

type PayRunColumnId = "half" | "status";

const PAY_RUN_COLUMN_DEFS: TableColumnDef<PayRunColumnId>[] = [
  { id: "half", label: "Half" },
  { id: "status", label: "Status" },
];

const PAY_RUN_COLUMNS_STORAGE_KEY = "payroll.pay-runs.tableColumns.v1";

const INITIAL_PERIOD = defaultPayPeriod();

const monthAnchorFromPeriod = (start: string, end: string): Date => {
  const preferred = start || end;
  if (preferred) {
    const parsed = parseISO(preferred);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

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
  const create = useCreatePayRun();
  const [periodStart, setPeriodStart] = useState(INITIAL_PERIOD.start);
  const [periodEnd, setPeriodEnd] = useState(INITIAL_PERIOD.end);
  const [cutoffHalf, setCutoffHalf] = useState<CutoffHalf>(
    INITIAL_PERIOD.cutoffHalf,
  );
  const [includeThirteenthMonth, setIncludeThirteenthMonth] = useState(false);
  const [splitWithholding, setSplitWithholding] = useState(false);
  const [duplicateTriggered, setDuplicateTriggered] = useState(false);
  const { columns, setColumns, visibleIds, labelById } = useTableColumns(
    PAY_RUN_COLUMNS_STORAGE_KEY,
    PAY_RUN_COLUMN_DEFS,
  );

  const runs = data?.data ?? [];
  const createError =
    create.error instanceof HrisApiError
      ? create.error.message
      : create.isError
        ? "Failed to create pay run"
        : null;

  const duplicateRun = runs.find(
    (run) =>
      (run.kind ?? "regular") === "regular" &&
      run.periodStart === periodStart &&
      run.periodEnd === periodEnd &&
      run.cutoffHalf === cutoffHalf,
  );
  const canCreate = Boolean(
    periodStart && periodEnd && periodStart <= periodEnd,
  );
  const colSpan = 2 + visibleIds.length;

  const applyDefaultPeriod = () => {
    const next = defaultPayPeriod();
    setPeriodStart(next.start);
    setPeriodEnd(next.end);
    setCutoffHalf(next.cutoffHalf);
    setIncludeThirteenthMonth(false);
    setSplitWithholding(false);
  };

  const handleCutoffHalfChange = (value: CutoffHalf) => {
    setCutoffHalf(value);
    setDuplicateTriggered(false);
    create.reset();
    const anchor = monthAnchorFromPeriod(periodStart, periodEnd);
    const next = payPeriodForHalf(
      anchor.getFullYear(),
      anchor.getMonth(),
      value,
    );
    setPeriodStart(next.start);
    setPeriodEnd(next.end);
  };

  const handleCreate = () => {
    if (!canCreate) return;
    if (duplicateRun) {
      setDuplicateTriggered(true);
      return;
    }
    setDuplicateTriggered(false);
    create.mutate(
      {
        periodStart,
        periodEnd,
        cutoffHalf,
        includeThirteenthMonth,
        splitWithholding,
      },
      {
        onSuccess: () => {
          applyDefaultPeriod();
        },
      },
    );
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PageHeader
        title="Pay runs"
        description={
          mayProcess
            ? "Create a cutoff, compute from Tito Clock hours, then release."
            : "View cutoffs and payslips. Processing is limited to HR and finance."
        }
      />

      {mayProcess ? (
      <Card aria-label="Create pay run">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Create pay run</CardTitle>
          <CardDescription>
            Pick a period range and cutoff half, then create a draft.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="pay-run-period">Period</Label>
              <PeriodDateRangeField
                id="pay-run-period"
                value={{ start: periodStart, end: periodEnd }}
                onChange={(next) => {
                  setPeriodStart(next.start);
                  setPeriodEnd(next.end);
                  setDuplicateTriggered(false);
                  create.reset();
                }}
                disabled={create.isPending}
              />
            </div>
            <div className="w-full space-y-1.5 sm:w-52 sm:shrink-0">
              <Label htmlFor="cutoff-half">Cutoff half</Label>
              <Select
                value={cutoffHalf}
                onValueChange={(value) =>
                  handleCutoffHalfChange(value as CutoffHalf)
                }
                disabled={create.isPending}
              >
                <SelectTrigger id="cutoff-half" className="w-full">
                  <SelectValue placeholder="Select half" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">1st (HDMF + PhilHealth)</SelectItem>
                  <SelectItem value="second">2nd (SSS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              className="w-full shrink-0 sm:w-auto"
              onClick={handleCreate}
              disabled={create.isPending || !canCreate}
            >
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </div>
          <label
            htmlFor="include-thirteenth-month"
            className="mt-3 flex cursor-pointer items-start gap-2 text-sm"
          >
            <input
              id="include-thirteenth-month"
              type="checkbox"
              className="mt-1 size-4 shrink-0 rounded border border-input"
              checked={includeThirteenthMonth}
              onChange={(event) =>
                setIncludeThirteenthMonth(event.target.checked)
              }
              disabled={create.isPending}
            />
            <span>
              <span className="font-medium">Include 13th month pay</span>
              <span className="block text-xs text-muted-foreground">
                Compute fills each slip with 1/12 of year-to-date Basic Pay
                (consultants stay 0). Flag once per year to avoid double payout.
              </span>
            </span>
          </label>
          <label
            htmlFor="split-withholding"
            className="mt-3 flex cursor-pointer items-start gap-2 text-sm"
          >
            <input
              id="split-withholding"
              type="checkbox"
              className="mt-1 size-4 shrink-0 rounded border border-input"
              checked={splitWithholding}
              onChange={(event) => setSplitWithholding(event.target.checked)}
              disabled={create.isPending}
            />
            <span>
              <span className="font-medium">Split monthly withholding</span>
              <span className="block text-xs text-muted-foreground">
                Off (default): deduct full monthly tax on this cutoff. On: split
                across 1st/2nd with remainder on the 2nd cutoff.
              </span>
            </span>
          </label>
          {duplicateTriggered && duplicateRun ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              A pay run already exists for{" "}
              {formatPayRunPeriod(periodStart, periodEnd)} (
              {cutoffHalfLabel(cutoffHalf)}).
            </p>
          ) : null}
          {createError ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {createError}
            </p>
          ) : null}
        </CardContent>
      </Card>
      ) : null}

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
