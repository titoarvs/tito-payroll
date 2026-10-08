import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Payslip } from "~/api-services/pay-runs.types";
import {
  DEFAULT_EMPLOYEE_PAGE_SIZE,
  EmployeeListPagination,
  type EmployeePageSize,
} from "~/components/employees/employee-list-pagination";
import {
  cutoffHalfLabel,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
  TableColumnVisibility,
  useTableColumns,
  type TableColumnDef,
} from "~/components/ui/table-column-visibility";
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

type PayslipColumnId =
  | "hours"
  | "rate"
  | "basic"
  | "allowance"
  | "ot"
  | "nd"
  | "holiday"
  | "leave"
  | "gross"
  | "sss"
  | "hdmf"
  | "philhealth"
  | "tax"
  | "adjustments"
  | "net";

const PAYSLIP_COLUMN_DEFS: TableColumnDef<PayslipColumnId>[] = [
  { id: "hours", label: "Hours" },
  { id: "rate", label: "Rate" },
  { id: "basic", label: "Basic" },
  { id: "allowance", label: "Allowance" },
  { id: "ot", label: "OT" },
  { id: "nd", label: "ND" },
  { id: "holiday", label: "Holiday" },
  { id: "leave", label: "Leave days" },
  { id: "gross", label: "Gross" },
  { id: "sss", label: "SSS" },
  { id: "hdmf", label: "HDMF" },
  { id: "philhealth", label: "PhilHealth" },
  { id: "tax", label: "WHT" },
  { id: "adjustments", label: "Adjustments" },
  { id: "net", label: "Net" },
];

const PAYSLIP_COLUMNS_STORAGE_KEY = "payroll.pay-run-payslips.tableColumns.v2";

const ApprovedClaimCell = ({
  hours,
  pay,
}: {
  hours: string | null | undefined;
  pay: string | null | undefined;
}) => (
  <span className="block leading-tight">
    <span className="block">{hours && hours !== "" ? `${hours}h` : "0.00h"}</span>
    <span className="block text-xs text-muted-foreground">
      {formatPayslipMoney(pay ?? "0.00")}
    </span>
  </span>
);

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
    case "ot":
      return (
        <TableCell key={id} className="whitespace-nowrap tabular-nums">
          <ApprovedClaimCell
            hours={row.approvedOvertimeHours ?? row.overtimeHours}
            pay={row.overtimePay}
          />
        </TableCell>
      );
    case "nd":
      return (
        <TableCell key={id} className="whitespace-nowrap tabular-nums">
          <ApprovedClaimCell
            hours={row.approvedNightDiffHours ?? row.nightDiffHours}
            pay={row.nightDiffPay}
          />
        </TableCell>
      );
    case "holiday":
      return (
        <TableCell key={id} className="tabular-nums">
          {row.holidayPay ?? "0.00"}
        </TableCell>
      );
    case "leave":
      return (
        <TableCell key={id} className="tabular-nums">
          {row.paidLeaveDays ?? "0.00"}d
          {row.unpaidLeaveDays &&
          row.unpaidLeaveDays !== "0.00" &&
          row.unpaidLeaveDays !== "0"
            ? ` / ${row.unpaidLeaveDays}d`
            : ""}
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
    case "tax":
      return (
        <TableCell key={id} className="tabular-nums">
          {row.withholdingTax ?? "0.00"}
        </TableCell>
      );
    case "adjustments":
      return (
        <TableCell key={id} className="tabular-nums">
          {row.totalAdjustments ?? "0.00"}
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
  const { columns, setColumns, visibleIds, labelById } = useTableColumns(
    PAYSLIP_COLUMNS_STORAGE_KEY,
    PAYSLIP_COLUMN_DEFS,
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
  const colSpan = 1 + visibleIds.length;
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
  const halfLabelShort = cutoffHalfLabel(payRun.cutoffHalf);
  const halfLabelFull = cutoffHalfLabel(payRun.cutoffHalf, { withFunds: true });

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
          {isCorrection ? (
            <Badge variant="secondary">Correction</Badge>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground sm:text-sm">
          <span className="sm:hidden">{halfLabelShort}</span>
          <span className="hidden sm:inline">{halfLabelFull}</span>
          {payRun.includeThirteenthMonth ? (
            <span> · 13th month included</span>
          ) : null}
          {payRun.splitWithholding ? (
            <span> · Withholding split on</span>
          ) : null}
          {canCompute && !isCorrection ? (
            <span className="hidden sm:inline">
              {" "}
              · Time logs and hourly rate only.
            </span>
          ) : null}
          {releaseBlocked ? (
            <span className="text-destructive">
              {" "}
              · Every employee needs a basic pay or salary.
            </span>
          ) : null}
          {canCompute && isCorrection ? (
            <span className="hidden sm:inline">
              {" "}
              · Correction batch: compute zeros money; enter other adjustment
              with a reason, then release.
            </span>
          ) : null}
        </p>
      </header>

      {mayProcess && !isCorrection && payRun.status !== "released" ? (
        <label
          htmlFor="pay-run-split-withholding"
          className="flex cursor-pointer items-start gap-2 rounded-md border border-border/60 bg-card px-4 py-3 text-sm"
        >
          <input
            id="pay-run-split-withholding"
            type="checkbox"
            className="mt-1 size-4 shrink-0 rounded border border-input"
            checked={payRun.splitWithholding === true}
            onChange={(event) => handleSplitToggle(event.target.checked)}
            disabled={updatePayRun.isPending || payRun.status === "computing"}
          />
          <span>
            <span className="font-medium">Split monthly withholding</span>
            <span className="block text-xs text-muted-foreground">
              Off: full monthly tax on this cutoff. On: floor half on the 1st,
              remainder on the 2nd. Toggle updates WHT and Net immediately;
              tax stays editable on each slip.
            </span>
          </span>
        </label>
      ) : null}

      {isCorrection && payRun.correctsPayRunId ? (
        <Card className="border-border/60 bg-muted/20">
          <CardContent className="flex flex-wrap items-center gap-2 py-4 text-sm">
            <span className="text-muted-foreground">
              Correction of released batch
            </span>
            <Button asChild variant="link" className="h-auto p-0 text-sm">
              <Link
                to="/dashboard/pay-runs/$id"
                params={{ id: payRun.correctsPayRunId }}
              >
                Open source pay run
              </Link>
            </Button>
          </CardContent>
        </Card>
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

      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-border/40 pb-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">Payslips</CardTitle>
            <CardDescription>
              Amounts from the latest compute for this cutoff. Select a row to
              open the payslip.
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
            <Table
              empty={!payslipsQuery.isPending && total === 0}
              className="min-w-[56rem]"
            >
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  {visibleIds.map((id) => (
                    <TableHead
                      key={id}
                      title={
                        id === "ot"
                          ? "Approved overtime whose worked date is in this cutoff"
                          : id === "nd"
                            ? "Approved night differential whose worked date is in this cutoff"
                            : undefined
                      }
                      className={
                        id === "ot" || id === "nd"
                          ? "whitespace-nowrap"
                          : undefined
                      }
                    >
                      {labelById[id]}
                    </TableHead>
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
                      No payslips yet. Compute includes employees with Clock time
                      logs and an hourly rate.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((row) =>
                    row.kind === "missing" ? (
                      <TableRow
                        key={`missing-${row.issue.employeeId}`}
                        className="cursor-pointer bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60"
                        onClick={() =>
                          navigate({
                            to: "/dashboard/employees/$id",
                            params: { id: row.issue.employeeId },
                          })
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigate({
                              to: "/dashboard/employees/$id",
                              params: { id: row.issue.employeeId },
                            });
                          }
                        }}
                        tabIndex={0}
                      >
                        <TableCell className="max-w-[16rem]">
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate font-medium text-red-950 dark:text-red-50">
                              {row.issue.employeeName?.trim() ||
                                "Unknown employee"}
                            </span>
                            <span className="truncate font-mono text-xs text-red-800/80 dark:text-red-100/80">
                              {row.issue.employeeCode?.trim()
                                ? `#${row.issue.employeeCode}`
                                : row.issue.employeeId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          colSpan={visibleIds.length}
                          className="text-sm text-red-900 dark:text-red-50"
                        >
                          {row.issue.reasons
                            .map((reason) => missingPayrollReasonLabel(reason))
                            .join(", ")}
                          {maySync ? (
                            <>
                              {" · "}
                              <button
                                type="button"
                                className="font-medium underline underline-offset-2"
                                disabled={syncEmployment.isPending}
                                onClick={(event) => {
                                  event.stopPropagation();
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
                                      onError: (error) => {
                                        toast.error(
                                          error instanceof HrisApiError
                                            ? error.message
                                            : "Could not sync employment",
                                        );
                                      },
                                    },
                                  );
                                }}
                              >
                                {syncEmployment.isPending &&
                                syncEmployment.variables?.employeeId ===
                                  row.issue.employeeId
                                  ? "Syncing…"
                                  : "Sync"}
                              </button>
                            </>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow
                        key={row.slip.id}
                        className="cursor-pointer hover:bg-muted/40"
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
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate font-medium text-foreground">
                              {row.slip.employeeName?.trim() ||
                                "Unknown employee"}
                            </span>
                            <span className="truncate font-mono text-xs text-muted-foreground">
                              {row.slip.employeeCode?.trim()
                                ? `#${row.slip.employeeCode}`
                                : row.slip.employeeId}
                            </span>
                          </div>
                        </TableCell>
                        {visibleIds.map((id) =>
                          renderPayslipColumnCell(id, row.slip),
                        )}
                      </TableRow>
                    ),
                  )
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
