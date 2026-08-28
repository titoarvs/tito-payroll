import { useEffect, useState } from "react";
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
  useContributionSchedules,
  useReplaceBrackets,
} from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";

interface BracketDraft {
  minCompensation: string;
  maxCompensation: string;
  employeeShare: string;
  employerShare: string;
}

export const ContributionTablesPage = () => {
  const { data, isPending, isError, error } = useContributionSchedules();
  const replace = useReplaceBrackets();
  const schedules = data?.data ?? [];
  const [selectedId, setSelectedId] = useState<string>("");
  const [drafts, setDrafts] = useState<BracketDraft[]>([]);

  const selected =
    schedules.find((s) => s.id === selectedId) ?? schedules[0] ?? null;

  useEffect(() => {
    if (!selectedId && schedules[0]) {
      setSelectedId(schedules[0].id);
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Contribution tables
        </h2>
        <p className="text-sm text-muted-foreground">
          SSS / HDMF / PhilHealth brackets (employee share). Lookup key is
          monthly salary.
        </p>
      </div>

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

      {!isPending && !isError && schedules.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit brackets</CardTitle>
            <CardDescription>
              Select a schedule and update compensation brackets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Select value={selected?.id ?? ""} onValueChange={setSelectedId}>
                <SelectTrigger id="schedule" className="w-full max-w-md">
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.kind.toUpperCase()} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {drafts.map((draft, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-4"
                >
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
