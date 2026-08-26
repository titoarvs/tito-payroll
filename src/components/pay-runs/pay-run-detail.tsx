import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
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
  const [confirmRelease, setConfirmRelease] = useState(false);

  const payRun = data?.data;
  const payslips = payslipsQuery.data?.data ?? [];
  const actionError =
    (compute.error instanceof HrisApiError && compute.error.message) ||
    (release.error instanceof HrisApiError && release.error.message) ||
    null;

  if (isPending) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Loading pay run…
      </p>
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
          <p className="text-sm text-muted-foreground">
            Half: {payRun.cutoffHalf} · Status: {payRun.status}
          </p>
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
            confirmRelease ? (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => release.mutate(payRunId)}
                  disabled={release.isPending}
                >
                  {release.isPending ? "Releasing…" : "Confirm release"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmRelease(false)}
                  disabled={release.isPending}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmRelease(true)}
              >
                Release
              </Button>
            )
          ) : null}
        </div>
      </div>

      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium">Hours</th>
              <th className="px-3 py-2 font-medium">Rate</th>
              <th className="px-3 py-2 font-medium">Basic</th>
              <th className="px-3 py-2 font-medium">Allowance</th>
              <th className="px-3 py-2 font-medium">Gross</th>
              <th className="px-3 py-2 font-medium">SSS</th>
              <th className="px-3 py-2 font-medium">HDMF</th>
              <th className="px-3 py-2 font-medium">PhilHealth</th>
              <th className="px-3 py-2 font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {payslipsQuery.isPending ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-muted-foreground">
                  Loading payslips…
                </td>
              </tr>
            ) : payslips.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-muted-foreground">
                  No payslips yet. Run Compute.
                </td>
              </tr>
            ) : (
              payslips.map((row) => (
                <tr key={row.id} className="border-b border-border/60">
                  <td className="px-3 py-2 font-mono text-xs">{row.employeeId}</td>
                  <td className="px-3 py-2 tabular-nums">{row.hoursWorked}</td>
                  <td className="px-3 py-2 tabular-nums">{row.hourlyRate}</td>
                  <td className="px-3 py-2 tabular-nums">{row.basicPay}</td>
                  <td className="px-3 py-2 tabular-nums">{row.allowance}</td>
                  <td className="px-3 py-2 tabular-nums">{row.grossPay}</td>
                  <td className="px-3 py-2 tabular-nums">{row.sss}</td>
                  <td className="px-3 py-2 tabular-nums">{row.hdmf}</td>
                  <td className="px-3 py-2 tabular-nums">{row.philhealth}</td>
                  <td className="px-3 py-2 tabular-nums font-medium">
                    {row.netPay}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
