import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { Payslip } from "~/api-services/pay-runs.types";
import { PayslipDocument } from "~/components/pay-runs/payslip-document";
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
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
  usePayRun,
  usePayRunPayslips,
  useReleasePayRun,
  useUpdatePayslip,
} from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";
import { cn } from "~/lib/utils";

interface PayRunDetailProps {
  payRunId: string;
}

export const PayRunDetail = ({ payRunId }: PayRunDetailProps) => {
  const { data, isPending, isError, error } = usePayRun(payRunId);
  const payslipsQuery = usePayRunPayslips(payRunId);
  const compute = useComputePayRun();
  const release = useReleasePayRun();
  const updatePayslip = useUpdatePayslip(payRunId);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [otherAdjustment, setOtherAdjustment] = useState("");

  const payRun = data?.data;
  const payslips = payslipsQuery.data?.data ?? [];
  const selected = useMemo(
    () => payslips.find((row) => row.id === selectedId) ?? null,
    [payslips, selectedId],
  );

  const actionError =
    (compute.error instanceof HrisApiError && compute.error.message) ||
    (release.error instanceof HrisApiError && release.error.message) ||
    (updatePayslip.error instanceof HrisApiError &&
      updatePayslip.error.message) ||
    null;

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
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
  const canEdit = payRun.status === "computed";

  const handleSelect = (row: Payslip) => {
    setSelectedId(row.id);
    setOtherAdjustment(row.otherAdjustment ?? "0.00");
  };

  const handleRelease = () => {
    release.mutate(payRunId, {
      onSuccess: () => setReleaseOpen(false),
    });
  };

  const handleSaveAdjustment = () => {
    if (!selected) return;
    updatePayslip.mutate({
      id: selected.id,
      input: { otherAdjustment },
    });
  };

  const previewPayslip: Payslip | null = selected
    ? {
        ...selected,
        periodStart: selected.periodStart ?? payRun.periodStart,
        periodEnd: selected.periodEnd ?? payRun.periodEnd,
        cutoffHalf: selected.cutoffHalf ?? payRun.cutoffHalf,
        status: selected.status ?? payRun.status,
      }
    : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to="/dashboard/pay-runs">← Pay runs</Link>
          </Button>
          <h2 className="text-xl font-semibold text-foreground">
            {payRun.periodStart} → {payRun.periodEnd}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="capitalize">Half: {payRun.cutoffHalf}</span>
            <PayRunStatusBadge status={payRun.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCompute ? (
            <div className="flex flex-col items-end gap-1">
              <Button
                type="button"
                onClick={() => compute.mutate(payRunId)}
                disabled={compute.isPending}
              >
                {compute.isPending ? "Computing…" : "Compute"}
              </Button>
              <p className="max-w-[16rem] text-right text-xs text-muted-foreground">
                Pulls Clock hours and approved OT / ND / holiday work.
              </p>
            </div>
          ) : null}
          {canRelease ? (
            <AlertDialog open={releaseOpen} onOpenChange={setReleaseOpen}>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline">
                  Approve & release
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve & release pay run?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Payslips for {payRun.periodStart} → {payRun.periodEnd} will
                    appear under each employee&apos;s login immediately. No
                    manual send is required.
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
                    {release.isPending ? "Releasing…" : "Approve & release"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>

      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table className="min-w-[56rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>OT</TableHead>
                <TableHead>ND</TableHead>
                <TableHead>Holiday</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Adjustments</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslipsQuery.isPending ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : payslips.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No payslips yet. Compute pulls Clock hours and approved
                    OT/ND/holiday work.
                  </TableCell>
                </TableRow>
              ) : (
                payslips.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/40",
                      selectedId === row.id && "bg-muted/60",
                    )}
                    onClick={() => handleSelect(row)}
                  >
                    <TableCell>
                      <div className="font-medium">
                        {row.employeeName ||
                          row.employeeCode ||
                          row.employeeId}
                      </div>
                      {row.employeeCode ? (
                        <div className="font-mono text-xs text-muted-foreground">
                          {row.employeeCode}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.hoursWorked}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.overtimePay ?? "0.00"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.nightDiffPay ?? "0.00"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.holidayPay ?? "0.00"}
                    </TableCell>
                    <TableCell className="tabular-nums">{row.grossPay}</TableCell>
                    <TableCell className="tabular-nums">
                      {row.totalDeductions}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.totalAdjustments ?? "0.00"}
                    </TableCell>
                    <TableCell className="tabular-nums font-medium">
                      {row.netPay}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {previewPayslip ? (
        <div className="flex flex-col gap-4">
          {canEdit ? (
            <Card>
              <CardContent className="flex flex-wrap items-end gap-3 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="other-adjustment">Other adjustment</Label>
                  <Input
                    id="other-adjustment"
                    className="w-40 tabular-nums"
                    value={otherAdjustment}
                    onChange={(event) => setOtherAdjustment(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSaveAdjustment}
                  disabled={updatePayslip.isPending}
                >
                  {updatePayslip.isPending ? "Saving…" : "Save adjustment"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Edits recalculate net on the server. Available while the run is
                  computed (not yet released).
                </p>
              </CardContent>
            </Card>
          ) : null}
          <div className="flex justify-end print:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
            >
              Print / Save as PDF
            </Button>
          </div>
          <PayslipDocument payslip={previewPayslip} />
        </div>
      ) : null}
    </div>
  );
};
