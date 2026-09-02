import { useEffect, useState } from "react";
import { Trash2Icon } from "lucide-react";
import type { ContributionKind } from "~/api-services/pay-runs.types";
import { PageHeader } from "~/components/layout/page-header";
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
import { Skeleton } from "~/components/ui/skeleton";
import {
  useContributionSchedules,
  useReplaceBrackets,
} from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";
import { cn } from "~/lib/utils";

interface BracketDraft {
  minCompensation: string;
  maxCompensation: string;
  employeeShare: string;
  employerShare: string;
}

const KIND_ORDER: ContributionKind[] = ["sss", "hdmf", "philhealth"];

const KIND_LABEL: Record<ContributionKind, string> = {
  sss: "SSS",
  hdmf: "HDMF",
  philhealth: "PhilHealth",
};

const KIND_HINT: Record<ContributionKind, string> = {
  sss: "2nd cutoff",
  hdmf: "1st cutoff · Pag-IBIG",
  philhealth: "1st cutoff",
};

export const ContributionTablesPage = () => {
  const { data, isPending, isError, error } = useContributionSchedules();
  const replace = useReplaceBrackets();
  const schedules = data?.data ?? [];
  const [selectedId, setSelectedId] = useState<string>("");
  const [drafts, setDrafts] = useState<BracketDraft[]>([]);

  const selected =
    schedules.find((s) => s.id === selectedId) ?? schedules[0] ?? null;

  const schedulesByKind = KIND_ORDER.map((kind) => ({
    kind,
    schedule: schedules.find((s) => s.kind === kind) ?? null,
  })).filter((row) => row.schedule != null);

  useEffect(() => {
    if (!selectedId && schedules[0]) {
      const preferred =
        schedules.find((s) => s.kind === "sss") ?? schedules[0];
      setSelectedId(preferred.id);
      return;
    }
    const current = schedules.find((s) => s.id === selectedId);
    if (!current) {
      setDrafts([]);
      return;
    }
    setDrafts(
      current.brackets.map((b) => ({
        minCompensation: b.minCompensation,
        maxCompensation: b.maxCompensation ?? "",
        employeeShare: b.employeeShare,
        employerShare: b.employerShare,
      })),
    );
  }, [schedules, selectedId]);

  const handleSave = () => {
    if (!selected) return;
    replace.mutate({
      id: selected.id,
      input: {
        brackets: drafts.map((d) => ({
          minCompensation: d.minCompensation,
          maxCompensation: d.maxCompensation.trim() || null,
          employeeShare: d.employeeShare,
          employerShare: d.employerShare || "0",
        })),
      },
    });
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PageHeader
        title="Contribution tables"
        description="SSS / HDMF / PhilHealth brackets (employee share). Lookup key is monthly salary."
      />

      {isPending ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof HrisApiError
            ? error.message
            : "Failed to load schedules"}
        </p>
      ) : null}

      {!isPending && !isError && schedules.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No schedules yet</CardTitle>
            <CardDescription>
              Contribution brackets are empty in HRIS. Seed starter SSS / HDMF /
              PhilHealth tables, then refresh this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground">
              cd tito-hris-api && npm run seed:contribution-schedules
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isPending && !isError && schedules.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Edit brackets</CardTitle>
            <CardDescription>
              Lookup uses monthly salary. Switch fund, then edit rows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div
              className="flex flex-wrap gap-1 rounded-lg border border-border/50 bg-muted/30 p-1"
              role="tablist"
              aria-label="Contribution fund"
            >
              {schedulesByKind.map(({ kind, schedule }) => {
                if (!schedule) return null;
                const active = selected?.id === schedule.id;
                return (
                  <button
                    key={schedule.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    id={`schedule-tab-${kind}`}
                    onClick={() => setSelectedId(schedule.id)}
                    className={cn(
                      "min-w-[5.5rem] flex-1 rounded-md px-3 py-2 text-left transition-colors",
                      "active:scale-[0.98] motion-reduce:active:scale-100",
                      active
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                    )}
                  >
                    <span className="block text-sm font-semibold tracking-tight">
                      {KIND_LABEL[kind]}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">
                      {KIND_HINT[kind]} · {schedule.brackets.length} brackets
                    </span>
                  </button>
                );
              })}
            </div>

            {selected ? (
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/40 pb-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {KIND_LABEL[selected.kind]}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Effective {selected.effectiveFrom}
                    {selected.effectiveTo
                      ? ` → ${selected.effectiveTo}`
                      : " → open"}
                    {selected.isActive ? "" : " · inactive"}
                  </p>
                </div>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {drafts.length} bracket{drafts.length === 1 ? "" : "s"}
                </p>
              </div>
            ) : null}

            {drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground" role="status">
                This schedule has no brackets. Add one below.
              </p>
            ) : null}

            <div className="space-y-3">
              {drafts.map((draft, index) => (
                <div
                  key={index}
                  className="rounded-md border border-border/60 bg-muted/20 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Bracket {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setDrafts((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      aria-label={`Remove bracket ${index + 1}`}
                    >
                      <Trash2Icon className="size-3.5" />
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div className="space-y-1">
                      <Label>Min compensation</Label>
                      <Input
                        value={draft.minCompensation}
                        onChange={(e) => {
                          const next = [...drafts];
                          next[index] = {
                            ...draft,
                            minCompensation: e.target.value,
                          };
                          setDrafts(next);
                        }}
                        aria-label={`Min compensation ${index + 1}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Max (blank = open)</Label>
                      <Input
                        value={draft.maxCompensation}
                        onChange={(e) => {
                          const next = [...drafts];
                          next[index] = {
                            ...draft,
                            maxCompensation: e.target.value,
                          };
                          setDrafts(next);
                        }}
                        aria-label={`Max compensation ${index + 1}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Employee share</Label>
                      <Input
                        value={draft.employeeShare}
                        onChange={(e) => {
                          const next = [...drafts];
                          next[index] = {
                            ...draft,
                            employeeShare: e.target.value,
                          };
                          setDrafts(next);
                        }}
                        aria-label={`Employee share ${index + 1}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Employer share</Label>
                      <Input
                        value={draft.employerShare}
                        onChange={(e) => {
                          const next = [...drafts];
                          next[index] = {
                            ...draft,
                            employerShare: e.target.value,
                          };
                          setDrafts(next);
                        }}
                        aria-label={`Employer share ${index + 1}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setDrafts([
                    ...drafts,
                    {
                      minCompensation: "0.00",
                      maxCompensation: "",
                      employeeShare: "0.00",
                      employerShare: "0.00",
                    },
                  ])
                }
              >
                Add bracket
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={replace.isPending || !selected}
              >
                {replace.isPending ? "Saving…" : "Save brackets"}
              </Button>
            </div>
            {replace.isError ? (
              <p className="text-sm text-destructive" role="alert">
                {replace.error instanceof HrisApiError
                  ? replace.error.message
                  : "Save failed"}
              </p>
            ) : null}
            {replace.isSuccess ? (
              <p className="text-sm text-muted-foreground" role="status">
                Brackets saved.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
