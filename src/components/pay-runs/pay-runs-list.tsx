import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PayRunStatusBadge } from "~/components/pay-runs/pay-run-status-badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
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

      <Card aria-label="Create pay run">
        <CardHeader>
          <CardTitle>Create pay run</CardTitle>
          <CardDescription>
            Set the period and cutoff half, then create a draft run.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <Select
                value={cutoffHalf}
                onValueChange={(value) => setCutoffHalf(value as CutoffHalf)}
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
            <p className="mt-3 text-sm text-destructive" role="alert">
              {createError}
            </p>
          ) : null}
        </CardContent>
      </Card>

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
        <Card>
          <CardContent className="overflow-x-auto p-0 pt-0">
            <Table className="min-w-[40rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Half</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No pay runs yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="tabular-nums">
                        {run.periodStart} → {run.periodEnd}
                      </TableCell>
                      <TableCell className="capitalize">{run.cutoffHalf}</TableCell>
                      <TableCell>
                        <PayRunStatusBadge status={run.status} />
                      </TableCell>
                      <TableCell>
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
