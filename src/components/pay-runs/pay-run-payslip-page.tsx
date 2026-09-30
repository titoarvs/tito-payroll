import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PayslipDocument } from "~/components/pay-runs/payslip-document";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { useCurrentUser } from "~/hooks/use-current-user";
import { usePayRun, usePayslip, useUpdatePayslip } from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";
import { canProcessPayRuns } from "~/lib/payroll-access";

interface PayRunPayslipPageProps {
  payRunId: string;
  payslipId: string;
}

export const PayRunPayslipPage = ({
  payRunId,
  payslipId,
}: PayRunPayslipPageProps) => {
  const { data: user } = useCurrentUser();
  const mayProcess = canProcessPayRuns(user);
  const payRunQuery = usePayRun(payRunId);
  const payslipQuery = usePayslip(payslipId);
  const updatePayslip = useUpdatePayslip(payRunId);
  const [otherAdjustment, setOtherAdjustment] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const payRun = payRunQuery.data?.data;
  const payslip = payslipQuery.data?.data;
  const payslipOnRun = payslip?.payRunId === payRunId ? payslip : null;

  useEffect(() => {
    if (!payslip || payslip.payRunId !== payRunId) return;
    setOtherAdjustment(payslip.otherAdjustment ?? "0.00");
    setAdjustmentReason(payslip.otherAdjustmentReason ?? "");
  }, [payRunId, payslip]);

  if (payRunQuery.isPending || payslipQuery.isPending) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[32rem] w-full" />
      </div>
    );
  }

  const loadError =
    (payRunQuery.error instanceof HrisApiError && payRunQuery.error.message) ||
    (payslipQuery.error instanceof HrisApiError &&
      payslipQuery.error.message) ||
    (!payRun ? "Pay run not found" : null) ||
    (!payslipOnRun ? "Payslip not found" : null);

  if (loadError || !payRun || !payslipOnRun) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 w-fit px-2 text-muted-foreground"
        >
          <Link to="/dashboard/pay-runs/$id" params={{ id: payRunId }}>
            ← Pay run
          </Link>
        </Button>
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  const canEdit =
    mayProcess &&
    payRun.status === "computed" &&
    payslipOnRun.employmentStatus !== "consultant";
  const employeeName = payslipOnRun.employeeName?.trim() || "Payslip";
  const employeeCode = payslipOnRun.employeeCode?.trim();
  const documentPayslip = {
    ...payslipOnRun,
    periodStart: payslipOnRun.periodStart ?? payRun.periodStart,
    periodEnd: payslipOnRun.periodEnd ?? payRun.periodEnd,
    cutoffHalf: payslipOnRun.cutoffHalf ?? payRun.cutoffHalf,
    status: payslipOnRun.status ?? payRun.status,
  };
  const saveError =
    updatePayslip.error instanceof HrisApiError
      ? updatePayslip.error.message
      : null;

  const handleSaveAdjustment = () => {
    updatePayslip.mutate({
      id: payslipOnRun.id,
      input: { otherAdjustment, reason: adjustmentReason.trim() },
    });
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2 text-muted-foreground print:hidden"
          >
            <Link to="/dashboard/pay-runs/$id" params={{ id: payRunId }}>
              ← Pay run
            </Link>
          </Button>
          <h2 className="page-title text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {employeeName}
          </h2>
          {employeeCode ? (
            <p className="text-sm text-muted-foreground">#{employeeCode}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 print:hidden"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </Button>
      </header>

      {canEdit ? (
        <div className="space-y-3 rounded-md border border-border/60 bg-card px-4 py-3 print:hidden">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="other-adjustment">Other adjustment</Label>
              <Input
                id="other-adjustment"
                className="h-8 w-40 tabular-nums"
                value={otherAdjustment}
                onChange={(event) => setOtherAdjustment(event.target.value)}
              />
            </div>
            <div className="min-w-[12rem] flex-1 space-y-2">
              <Label htmlFor="adjustment-reason">Reason</Label>
              <Input
                id="adjustment-reason"
                className="h-8"
                value={adjustmentReason}
                onChange={(event) => setAdjustmentReason(event.target.value)}
                placeholder="Required — why this adjustment"
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8"
              onClick={handleSaveAdjustment}
              disabled={updatePayslip.isPending || !adjustmentReason.trim()}
            >
              {updatePayslip.isPending ? "Saving…" : "Save adjustment"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Reason is required and audit-logged. Edits recalculate net on the
            server while the run is computed (not yet released).
            {(payRun.kind ?? "regular") === "correction"
              ? " Correction batches only support other adjustment."
              : null}
          </p>
          {saveError ? (
            <p className="text-sm text-destructive" role="alert">
              {saveError}
            </p>
          ) : null}
        </div>
      ) : null}

      <PayslipDocument payslip={documentPayslip} />
    </div>
  );
};
