import { useMyPayslips } from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";

export const MyPayslipsPage = () => {
  const { data, isPending, isError, error } = useMyPayslips();
  const payslips = data?.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">My payslips</h2>
        <p className="text-sm text-muted-foreground">
          Released cutoffs only.
        </p>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading…
        </p>
      ) : null}
      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof HrisApiError
            ? error.message
            : "Failed to load payslips"}
        </p>
      ) : null}

      {!isPending && !isError ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 font-medium">Half</th>
                <th className="px-3 py-2 font-medium">Gross</th>
                <th className="px-3 py-2 font-medium">Deductions</th>
                <th className="px-3 py-2 font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {payslips.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    No released payslips yet.
                  </td>
                </tr>
              ) : (
                payslips.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="px-3 py-2 tabular-nums">
                      {row.periodStart} → {row.periodEnd}
                    </td>
                    <td className="px-3 py-2">{row.cutoffHalf}</td>
                    <td className="px-3 py-2 tabular-nums">{row.grossPay}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.totalDeductions}
                    </td>
                    <td className="px-3 py-2 tabular-nums font-medium">
                      {row.netPay}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};
