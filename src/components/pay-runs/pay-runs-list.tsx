import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  useCreatePayRun,
  usePayRuns,
} from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";
import type { CutoffHalf } from "~/api-services/pay-runs.types";

export const PayRunsList = () => {
  const { data, isPending, isError, error } = usePayRuns();
  const create = useCreatePayRun();
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [cutoffHalf, setCutoffHalf] = useState<CutoffHalf>("first");

  const runs = data?.data ?? [];
  const createError =
    create.error instanceof HrisApiError
      ? create.error.message
      : create.isError
        ? "Failed to create pay run"
        : null;

  const handleCreate = () => {
    if (!periodStart || !periodEnd) return;
    create.mutate(
      { periodStart, periodEnd, cutoffHalf },
      {
        onSuccess: () => {
          setPeriodStart("");
          setPeriodEnd("");
        },
      },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Pay runs</h2>
        <p className="text-sm text-muted-foreground">
          Create a cutoff, compute from Tito Clock hours, then release.
        </p>
      </div>

      <section
        className="rounded-xl border border-border bg-card p-4"
        aria-label="Create pay run"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="period-start">Period start</Label>
            <Input
              id="period-start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period-end">Period end</Label>
            <Input
              id="period-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cutoff-half">Cutoff half</Label>
            <select
              id="cutoff-half"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={cutoffHalf}
              onChange={(e) => setCutoffHalf(e.target.value as CutoffHalf)}
              aria-label="Cutoff half"
            >
              <option value="first">1st (HDMF + PhilHealth)</option>
              <option value="second">2nd (SSS)</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleCreate}
              disabled={create.isPending || !periodStart || !periodEnd}
            >
              {create.isPending ? "Creating…" : "Create pay run"}
            </Button>
          </div>
        </div>
        {createError ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {createError}
          </p>
        ) : null}
      </section>

      {isPending ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading pay runs…
        </p>
      ) : null}
      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof HrisApiError
            ? error.message
            : "Failed to load pay runs"}
        </p>
      ) : null}

      {!isPending && !isError ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 font-medium">Half</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    No pay runs yet.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="border-b border-border/60">
                    <td className="px-3 py-2 tabular-nums">
                      {run.periodStart} → {run.periodEnd}
                    </td>
                    <td className="px-3 py-2">{run.cutoffHalf}</td>
                    <td className="px-3 py-2">{run.status}</td>
                    <td className="px-3 py-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to="/dashboard/pay-runs/$id" params={{ id: run.id }}>
                          Open
                        </Link>
                      </Button>
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
