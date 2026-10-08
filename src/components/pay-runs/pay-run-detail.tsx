import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Payslip } from "~/api-services/pay-runs.types";
import {
  DEFAULT_EMPLOYEE_PAGE_SIZE,
  EmployeeListPagination,
  type EmployeePageSize,
} from "~/components/employees/employee-list-pagination";
import {
  cutoffHalfLabel,
  formatPayRunDate,
  formatPayRunPeriod,
  formatPayslipMoney,
  hasBasicOrSalary,
  missingPayrollReasonLabel,
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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
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
  useComputePayRun,
  useCreateCorrectionPayRun,
  usePayRun,
  usePayRunPayslips,
  usePayRunReadiness,
  useReleasePayRun,
  useSyncEmployeeEmployment,
  useUpdatePayRun,
} from "~/hooks/use-pay-runs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { HrisApiError } from "~/lib/hris-api-client";
import { canProcessPayRuns, canSyncEmployment } from "~/lib/payroll-access";
import { cn } from "~/lib/utils";
import {
  previewWithholdingOnSplitToggle,
  recalcNetFromTax,
} from "~/lib/withholding-split";
import type { MissingPayrollDataIssue } from "~/api-services/pay-runs.types";

interface PayRunDetailProps {
  payRunId: string;
}

const formatEmployeeName = (value: string | null | undefined): string =>
  (value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const extractReadinessIssues = (
  payload: unknown,
): MissingPayrollDataIssue[] | null => {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const issues = record.issues;
  if (!Array.isArray(issues)) return null;
  return issues as MissingPayrollDataIssue[];
};

const compactPeriodLabel = (start: string, end: string): string => {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    startDate.getFullYear() !== endDate.getFullYear() ||
    startDate.getMonth() !== endDate.getMonth()
  ) {
    return formatPayRunPeriod(start, end);
  }
  const month = startDate.toLocaleDateString(undefined, { month: "short" });
  return `${month} ${startDate.getDate()}–${endDate.getDate()}, ${startDate.getFullYear()}`;
};

const formatReleasedAt = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const noHourlyRate = (slip: Payslip): boolean => {
  const rate = Number(slip.hourlyRate);
  return !Number.isFinite(rate) || rate <= 0;
};

const MoneyCell = ({
  value,
  missing = false,
  strong = false,
}: {
  value: string | null | undefined;
  missing?: boolean;
  strong?: boolean;
}) => {
  const blank = value == null || value.trim() === "";
  const showMissing = missing || blank;
  return (
    <TableCell
      className={cn(
        "text-right text-sm tabular-nums",
        strong && "font-medium",
        showMissing &&
          "bg-[#fde8ea] text-red-700 dark:bg-red-950/40 dark:text-red-200",
      )}
    >
      {showMissing ? "—" : formatPayslipMoney(value)}
    </TableCell>
  );
};

export const PayRunDetail = ({ payRunId }: PayRunDetailProps) => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const mayProcess = canProcessPayRuns(user);
  const maySync = canSyncEmployment(user);
  const { data, isPending, isError, error } = usePayRun(payRunId);
  const payslipsQuery = usePayRunPayslips(payRunId);
  const compute = useComputePayRun();
  const syncEmployment = useSyncEmployeeEmployment();
  const release = useReleasePayRun();
  const updatePayRun = useUpdatePayRun();
  const createCorrection = useCreateCorrectionPayRun();
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionEmployeeIds, setCorrectionEmployeeIds] = useState<
    Set<string>
  >(() => new Set());
  const [previewPayslips, setPreviewPayslips] = useState<Payslip[] | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<EmployeePageSize>(
    DEFAULT_EMPLOYEE_PAGE_SIZE,
  );

  const payRun = data?.data;
  const isCorrectionKind = (payRun?.kind ?? "regular") === "correction";
  const readinessEnabled =
    Boolean(payRunId) &&
    !isCorrectionKind &&
    (payRun?.status === "draft" ||
      payRun?.status === "computing" ||
      payRun?.status === "computed");
  const readinessQuery = usePayRunReadiness(payRunId, readinessEnabled);
  const readinessIssuesFromApi = readinessQuery.data?.data.issues ?? [];
  const blockedIssues =
    compute.error instanceof HrisApiError && compute.error.status === 409
      ? extractReadinessIssues(compute.error.payload)
      : null;
  const readinessIssues = blockedIssues ?? readinessIssuesFromApi;
  const payslips = previewPayslips ?? payslipsQuery.data?.data ?? [];
  const tableRows = useMemo(() => {
    const onSlip = new Set(payslips.map((row) => row.employeeId));
    const rows: Array<
      | { kind: "slip"; slip: Payslip; name: string }
      | { kind: "missing"; issue: MissingPayrollDataIssue; name: string }
    > = [
      ...payslips.map((slip) => ({
        kind: "slip" as const,
        slip,
        name: slip.employeeName?.trim() || slip.employeeCode?.trim() || "",
      })),
      ...readinessIssues
        .filter((issue) => !onSlip.has(issue.employeeId))
        .map((issue) => ({
          kind: "missing" as const,
          issue,
          name:
            issue.employeeName?.trim() || issue.employeeCode?.trim() || "",
        })),
    ];
    rows.sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
    );
    return rows;
  }, [payslips, readinessIssues]);
  const total = tableRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const colSpan = 11;
  const isPayslipsLoading = payslipsQuery.isPending || payslipsQuery.isFetching;

  const correctionCandidates = useMemo(
    () =>
      payslips
        .filter((row) => row.employmentStatus !== "consultant")
        .sort((left, right) =>
          (left.employeeName ?? left.employeeCode ?? "").localeCompare(
            right.employeeName ?? right.employeeCode ?? "",
            undefined,
            { sensitivity: "base" },
          ),
        ),
    [payslips],
  );

  useEffect(() => {
    setPage(1);
    setPreviewPayslips(null);
  }, [payRunId, pageSize, total]);

  useEffect(() => {
    setPreviewPayslips(null);
  }, [payslipsQuery.dataUpdatedAt]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tableRows.slice(start, start + pageSize);
  }, [tableRows, page, pageSize]);

  const handleSplitToggle = (next: boolean) => {
    if (!payRun || !mayProcess) return;
    const source = payslipsQuery.data?.data ?? [];
    if (payRun.status === "computed" && source.length > 0) {
      setPreviewPayslips(
        source.map((row) => {
          if (row.employmentStatus === "consultant") return row;
          const withholdingTax = previewWithholdingOnSplitToggle({
            splitOn: next,
            cutoffHalf: payRun.cutoffHalf,
            currentWithholding: row.withholdingTax ?? "0.00",
            firstCutoffWithholdingTax: row.firstCutoffWithholdingTax,
          });
          const totals = recalcNetFromTax({
            grossPay: row.grossPay,
            sss: row.sss,
            hdmf: row.hdmf,
            philhealth: row.philhealth,
            withholdingTax,
            totalAdjustments: row.totalAdjustments ?? "0.00",
          });
          return {
            ...row,
            withholdingTax,
            totalDeductions: totals.totalDeductions,
            netPay: totals.netPay,
          };
        }),
      );
    }
    updatePayRun.mutate({
      id: payRunId,
      input: { splitWithholding: next },
    });
  };

  const actionError =
    (compute.error instanceof HrisApiError && compute.error.message) ||
    (release.error instanceof HrisApiError && release.error.message) ||
    (updatePayRun.error instanceof HrisApiError &&
      updatePayRun.error.message) ||
    (createCorrection.error instanceof HrisApiError &&
      createCorrection.error.message) ||
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

  const isCorrection = (payRun.kind ?? "regular") === "correction";
  const canCompute =
    mayProcess &&
    (payRun.status === "draft" ||
      payRun.status === "computing" ||
      payRun.status === "computed");
  const releasePayPending =
    payslipsQuery.isPending ||
    (readinessEnabled && readinessQuery.isPending);
  const releaseBlocked =
    !isCorrection &&
    !releasePayPending &&
    (readinessIssues.length > 0 ||
      payslips.length === 0 ||
      payslips.some(
        (row) => !hasBasicOrSalary(row.basicPay, row.monthlyRate),
      ));
  const canRelease = mayProcess && payRun.status === "computed";
  const computeButtonLabel = compute.isPending
    ? payRun.status === "computing"
      ? "Resuming…"
      : "Computing…"
    : payRun.status === "computing"
      ? "Resume"
      : "Compute";
  const canCreateCorrection =
    mayProcess &&
    !isCorrection &&
    payRun.status === "released" &&
    correctionCandidates.length > 0;
  const periodLabel = formatPayRunPeriod(payRun.periodStart, payRun.periodEnd);
  const sheetTitle = compactPeriodLabel(payRun.periodStart, payRun.periodEnd);
  const releasedWhen = formatReleasedAt(payRun.releasedAt);
  const halfLabelFull = cutoffHalfLabel(payRun.cutoffHalf, { withFunds: true });
  const withholdingLocked =
    !mayProcess ||
    isCorrection ||
    payRun.status === "released" ||
    payRun.status === "computing" ||
    updatePayRun.isPending;
  const splitOn = payRun.splitWithholding === true;

  const handleRelease = () => {
    release.mutate(payRunId, {
      onSuccess: () => setReleaseOpen(false),
    });
  };

  const openCorrectionDialog = () => {
    setCorrectionEmployeeIds(new Set());
    setCorrectionOpen(true);
  };

  const toggleCorrectionEmployee = (employeeId: string) => {
    setCorrectionEmployeeIds((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  const handleCreateCorrection = () => {
    const employeeIds = [...correctionEmployeeIds];
    if (employeeIds.length === 0) return;
    createCorrection.mutate(
      { sourceId: payRunId, input: { employeeIds } },
      {
        onSuccess: (response) => {
          setCorrectionOpen(false);
          const id = response.data.id;
          void navigate({
            to: "/dashboard/pay-runs/$id",
            params: { id },
          });
        },
      },
    );
  };

  const openPayslip = (payslipId: string) => {
    void navigate({
      to: "/dashboard/pay-runs/$id/payslips/$payslipId",
      params: { id: payRunId, payslipId },
    });
  };

  const actionButtons = (
    <>
      {canCreateCorrection ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={openCorrectionDialog}
        >
          Create correction
        </Button>
      ) : null}
      {canCompute ? (
        <Button
          type="button"
          size="sm"
          className="h-8"
          onClick={() => compute.mutate(payRunId)}
          disabled={compute.isPending}
        >
          {computeButtonLabel}
        </Button>
      ) : null}
      {canRelease ? (
        <AlertDialog open={releaseOpen} onOpenChange={setReleaseOpen}>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={releaseBlocked || releasePayPending}
              title={
                releaseBlocked
                  ? "Every employee needs a basic pay or salary."
                  : undefined
              }
            >
              Approve & release
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve & release pay run?</AlertDialogTitle>
              <AlertDialogDescription>
                Payslips for {periodLabel} ({halfLabelFull}) will appear under
                each employee&apos;s login immediately. No manual send is required.
                {isCorrection
                  ? " The original released batch stays unchanged."
                  : null}
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
                disabled={release.isPending || releaseBlocked}
              >
                {release.isPending ? "Releasing…" : "Approve & release"}
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
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              <Link
                to="/dashboard/pay-runs"
                className="hover:text-foreground"
              >
                Payroll runs
              </Link>
              <span className="px-1.5">/</span>
              <span>{sheetTitle}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {sheetTitle}
              </h2>
              <PayRunStatusBadge status={payRun.status} />
              {isCorrection ? (
                <Badge variant="secondary">Correction</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isCorrection ? "Correction" : "Regular"}
              <span className="px-1.5">·</span>
              {total} employee{total === 1 ? "" : "s"}
              <span className="px-1.5">·</span>
              Pay date {formatPayRunDate(payRun.periodEnd)}
              {payRun.includeThirteenthMonth ? (
                <span> · 13th month included</span>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actionButtons}
          </div>
        </div>
      </header>

      {!isCorrection ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-card px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="text-sm font-medium">Withholding tax</p>
              <p className="text-xs text-muted-foreground">
                Applies to every employee in this run
              </p>
            </div>
            <div
              className="inline-flex rounded-full bg-muted p-0.5"
              role="group"
              aria-label="Withholding tax"
            >
              <button
                type="button"
                className={cn(
                  "rounded-full px-3 py-1 text-sm",
                  splitOn
                    ? "bg-tito-green font-medium text-tito-dark-green"
                    : "text-muted-foreground",
                )}
                aria-pressed={splitOn}
                disabled={withholdingLocked || splitOn}
                onClick={() => handleSplitToggle(true)}
              >
                Split across cutoffs
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-full px-3 py-1 text-sm",
                  !splitOn
                    ? "bg-tito-green font-medium text-tito-dark-green"
                    : "text-muted-foreground",
                )}
                aria-pressed={!splitOn}
                disabled={withholdingLocked || !splitOn}
                onClick={() => handleSplitToggle(false)}
              >
                Full on one cutoff
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-sm border border-border bg-card" />
              Editable
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-[#f8e3c4]" />
              Edited
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-[#fde8ea]" />
              Missing data
            </span>
          </div>
        </div>
      ) : null}

      {payRun.status === "released" ? (
        <p className="rounded-lg bg-[color-mix(in_srgb,var(--tito-green)_28%,white)] px-4 py-3 text-sm text-tito-dark-green">
          Approved and released
          {releasedWhen ? ` on ${releasedWhen}` : ""}. Rows are locked.
        </p>
      ) : null}

      {releaseBlocked ? (
        <p className="text-sm text-destructive">
          Every employee needs a basic pay or salary before this run can be
          released.
        </p>
      ) : null}

      {isCorrection && payRun.correctsPayRunId ? (
        <p className="text-sm text-muted-foreground">
          Correction of a released batch.{" "}
          <Link
            to="/dashboard/pay-runs/$id"
            params={{ id: payRun.correctsPayRunId }}
            className="font-medium text-foreground underline underline-offset-2"
          >
            Open source pay run
          </Link>
        </p>
      ) : null}

      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent className="flex max-h-[min(32rem,calc(100vh-2rem))] max-w-md flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-5 py-4 pr-12">
            <DialogTitle>Create correction</DialogTitle>
            <DialogDescription>
              Choose who to correct. The released batch stays unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {correctionCandidates.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">
                No employees in this batch.
              </p>
            ) : (
              correctionCandidates.map((row) => {
                const checked = correctionEmployeeIds.has(row.employeeId);
                const label =
                  formatEmployeeName(row.employeeName) ||
                  row.employeeCode ||
                  row.employeeId;
                return (
                  <label
                    key={row.employeeId}
                    className="flex cursor-pointer items-center gap-3 border-b border-border/60 px-5 py-3 text-sm last:border-b-0 hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      className="size-4 shrink-0 rounded border border-input"
                      checked={checked}
                      onChange={() => toggleCorrectionEmployee(row.employeeId)}
                      disabled={createCorrection.isPending}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {label}
                    </span>
                    {row.employeeCode ? (
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {row.employeeCode}
                      </span>
                    ) : null}
                  </label>
                );
              })
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCorrectionOpen(false)}
              disabled={createCorrection.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCorrection}
              disabled={
                createCorrection.isPending || correctionEmployeeIds.size === 0
              }
            >
              {createCorrection.isPending
                ? "Creating…"
                : `Create (${correctionEmployeeIds.size})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-lg border border-border/50 bg-card">
        <Table
          empty={!payslipsQuery.isPending && total === 0}
          className="min-w-[72rem]"
        >
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead rowSpan={2} className="align-bottom">
                Employee
              </TableHead>
              <TableHead
                colSpan={3}
                className="border-l border-border/40 text-center text-xs font-medium tracking-normal text-muted-foreground normal-case"
              >
                Earnings
              </TableHead>
              <TableHead
                colSpan={4}
                className="border-l border-border/40 text-center text-xs font-medium tracking-normal text-muted-foreground normal-case"
              >
                Deductions
              </TableHead>
              <TableHead
                colSpan={3}
                className="border-l border-border/40 text-center text-xs font-medium tracking-normal text-muted-foreground normal-case"
              >
                Additive
              </TableHead>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              {(
                [
                  "Basic",
                  "Allowance",
                  "Gross",
                  "SSS",
                  "HDMF",
                  "PhilHealth",
                  "Tax",
                  "OT",
                  "ND",
                  "Holiday",
                ] as const
              ).map((label) => (
                <TableHead
                  key={label}
                  className="text-right text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {payslipsQuery.isPending ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
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
                  No payslips yet. Compute includes employees with Clock time
                  logs and an hourly rate.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) =>
                row.kind === "missing" ? (
                  <TableRow key={`missing-${row.issue.employeeId}`}>
                    <TableCell className="max-w-[16rem]">
                      <span className="block font-medium">
                        {formatEmployeeName(row.issue.employeeName) ||
                          "Unknown employee"}
                      </span>
                      <span className="mt-0.5 block text-xs text-red-700">
                        {row.issue.reasons
                          .map((reason) =>
                            reason === "missing_hourly_rate"
                              ? "No hourly rate on file"
                              : missingPayrollReasonLabel(reason),
                          )
                          .join(", ")}
                      </span>
                      {maySync ? (
                        <button
                          type="button"
                          className="mt-1 text-xs font-medium underline underline-offset-2"
                          disabled={syncEmployment.isPending}
                          onClick={() =>
                            syncEmployment.mutate(
                              {
                                employeeId: row.issue.employeeId,
                                payRunId,
                              },
                              {
                                onSuccess: () => {
                                  toast.success(
                                    "Employment synced. Compute again to include this employee.",
                                  );
                                },
                                onError: (syncError) => {
                                  toast.error(
                                    syncError instanceof HrisApiError
                                      ? syncError.message
                                      : "Could not sync employment",
                                  );
                                },
                              },
                            )
                          }
                        >
                          {syncEmployment.isPending &&
                          syncEmployment.variables?.employeeId ===
                            row.issue.employeeId
                            ? "Syncing…"
                            : "Sync"}
                        </button>
                      ) : null}
                    </TableCell>
                    {Array.from({ length: 10 }).map((_, index) => (
                      <MoneyCell key={index} value={null} missing />
                    ))}
                  </TableRow>
                ) : (
                  <TableRow
                    key={row.slip.id}
                    className="cursor-pointer"
                    onClick={() => openPayslip(row.slip.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openPayslip(row.slip.id);
                      }
                    }}
                    tabIndex={0}
                  >
                    <TableCell className="max-w-[16rem]">
                      <span className="block font-medium">
                        {formatEmployeeName(row.slip.employeeName) ||
                          "Unknown employee"}
                      </span>
                      {noHourlyRate(row.slip) ? (
                        <span className="mt-0.5 block text-xs text-red-700">
                          No hourly rate on file
                        </span>
                      ) : (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {row.slip.position?.trim() ||
                            row.slip.employeeCode?.trim() ||
                            ""}
                        </span>
                      )}
                    </TableCell>
                    <MoneyCell value={row.slip.basicPay} />
                    <MoneyCell value={row.slip.allowance} />
                    <MoneyCell value={row.slip.grossPay} strong />
                    <MoneyCell value={row.slip.sss} />
                    <MoneyCell value={row.slip.hdmf} />
                    <MoneyCell value={row.slip.philhealth} />
                    <MoneyCell value={row.slip.withholdingTax ?? "0.00"} />
                    <MoneyCell
                      value={noHourlyRate(row.slip) ? null : (row.slip.overtimePay ?? "0.00")}
                      missing={noHourlyRate(row.slip)}
                    />
                    <MoneyCell
                      value={noHourlyRate(row.slip) ? null : (row.slip.nightDiffPay ?? "0.00")}
                      missing={noHourlyRate(row.slip)}
                    />
                    <MoneyCell value={row.slip.holidayPay ?? "0.00"} />
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
        {pagination}
      </div>


    </div>
  );
};
