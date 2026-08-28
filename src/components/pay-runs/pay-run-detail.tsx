import { Link } from "@tanstack/react-router";
import { useState } from "react";
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
  useComputePayRun,
  usePayRun,
  usePayRunPayslips,
  useReleasePayRun,
} from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";

interface PayRunDetailProps {
  payRunId: string;
}

export const PayRunDetail = ({ payRunId }: PayRunDetailProps) => {
  const { data, isPending, isError, error } = usePayRun(payRunId);
  const payslipsQuery = usePayRunPayslips(payRunId);
  const compute = useComputePayRun();
  const release = useReleasePayRun();
  const [releaseOpen, setReleaseOpen] = useState(false);

  const payRun = data?.data;
  const payslips = payslipsQuery.data?.data ?? [];
  const actionError =
    (compute.error instanceof HrisApiError && compute.error.message) ||
    (release.error instanceof HrisApiError && release.error.message) ||
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

  const handleRelease = () => {
    release.mutate(payRunId, {
      onSuccess: () => setReleaseOpen(false),
    });
  };

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
            <Button
              type="button"
              onClick={() => compute.mutate(payRunId)}
              disabled={compute.isPending}
            >
              {compute.isPending ? "Computing…" : "Compute"}
            </Button>
          ) : null}
          {canRelease ? (
            <AlertDialog open={releaseOpen} onOpenChange={setReleaseOpen}>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline">
                  Release
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Release pay run?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will finalize payslips for {payRun.periodStart} →{" "}
                    {payRun.periodEnd}. Employees will see them under My
                    payslips.
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
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {release.isPending ? "Releasing…" : "Confirm release"}
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
                <TableHead>Rate</TableHead>
                <TableHead>Basic</TableHead>
                <TableHead>Allowance</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>SSS</TableHead>
                <TableHead>HDMF</TableHead>
                <TableHead>PhilHealth</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslipsQuery.isPending ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={10}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : payslips.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No payslips yet. Run Compute.
                  </TableCell>
                </TableRow>
              ) : (
                payslips.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">
                      {row.employeeId}
                    </TableCell>
                    <TableCell className="tabular-nums">{row.hoursWorked}</TableCell>
                    <TableCell className="tabular-nums">{row.hourlyRate}</TableCell>
                    <TableCell className="tabular-nums">{row.basicPay}</TableCell>
                    <TableCell className="tabular-nums">{row.allowance}</TableCell>
                    <TableCell className="tabular-nums">{row.grossPay}</TableCell>
                    <TableCell className="tabular-nums">{row.sss}</TableCell>
                    <TableCell className="tabular-nums">{row.hdmf}</TableCell>
                    <TableCell className="tabular-nums">{row.philhealth}</TableCell>
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
    </div>
  );
};
