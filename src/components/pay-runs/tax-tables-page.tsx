import { Plus, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "~/components/layout/page-header";
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
  useReplaceTaxBrackets,
  useTaxSchedules,
} from "~/hooks/use-pay-runs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { HrisApiError } from "~/lib/hris-api-client";
import { canManageStatutoryTables } from "~/lib/payroll-access";
import { cn } from "~/lib/utils";

interface BracketDraft {
  minCompensation: string;
  maxCompensation: string;
  baseTax: string;
  rateOnExcess: string;
}

const EMPTY_BRACKET: BracketDraft = {
  minCompensation: "0.00",
  maxCompensation: "",
  baseTax: "0.00",
  rateOnExcess: "0.00",
};

export const TaxTablesPage = () => {
  const { data: user } = useCurrentUser();
  const mayManage = canManageStatutoryTables(user);
  const { data, isPending, isError, error } = useTaxSchedules();
  const replace = useReplaceTaxBrackets();
  const schedules = data?.data ?? [];
  const [selectedId, setSelectedId] = useState("");
  const [drafts, setDrafts] = useState<BracketDraft[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newBracket, setNewBracket] = useState<BracketDraft>(EMPTY_BRACKET);
  const [addError, setAddError] = useState<string | null>(null);

  const selected =
    schedules.find((s) => s.id === selectedId) ?? schedules[0] ?? null;

  useEffect(() => {
    if (!selectedId && schedules[0]) {
      const preferred =
        schedules.find((s) => s.isActive) ?? schedules[0];
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
        baseTax: b.baseTax,
        rateOnExcess: b.rateOnExcess,
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
          baseTax: d.baseTax,
          rateOnExcess: d.rateOnExcess,
        })),
      },
    });
  };

  const openAddModal = () => {
    setNewBracket(EMPTY_BRACKET);
    setAddError(null);
    setAddOpen(true);
  };

  const handleAddBracket = () => {
    const min = newBracket.minCompensation.trim();
    const baseTax = newBracket.baseTax.trim();
    const rateOnExcess = newBracket.rateOnExcess.trim();
    if (!min || !baseTax || !rateOnExcess) {
      setAddError("Min compensation, base tax, and rate on excess are required.");
      return;
    }
    setDrafts((current) => [...current, { ...newBracket }]);
    setAddOpen(false);
    setNewBracket(EMPTY_BRACKET);
    setAddError(null);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PageHeader
        title="Tax tables"
        description="Versioned BIR / TRAIN monthly withholding brackets. Compute applies half of the monthly tax each cutoff."
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
            : "Failed to load tax schedules"}
        </p>
      ) : null}

      {!isPending && !isError && schedules.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No tax schedules yet</CardTitle>
            <CardDescription>
              Seed a starter TRAIN monthly table in HRIS, then refresh this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground">
              cd tito-hris-api-v2 && npm run seed:tax-schedules
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isPending && !isError && schedules.length > 0 ? (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">
                  {mayManage ? "Edit brackets" : "Brackets"}
                </CardTitle>
                <CardDescription>
                  {mayManage
                    ? "Select a schedule, edit rows, then save. Blank max means open-ended."
                    : "View BIR / TRAIN brackets. Only Super Admin and finance can edit."}
                </CardDescription>
              </div>
              {mayManage ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openAddModal}
                  disabled={!selected}
                >
                  <Plus className="size-4" />
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
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div
              className="flex flex-wrap gap-1 rounded-lg border border-border/50 bg-muted/30 p-1"
              role="tablist"
              aria-label="Tax schedule"
            >
              {schedules.map((schedule) => {
                const active = selected?.id === schedule.id;
                return (
                  <button
                    key={schedule.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedId(schedule.id)}
                    className={cn(
                      "min-w-[8rem] flex-1 rounded-md px-3 py-2 text-left transition-colors",
                      active
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                    )}
                  >
                    <span className="block text-sm font-semibold tracking-tight">
                      {schedule.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">
                      {schedule.isActive ? "Active" : "Inactive"} ·{" "}
                      {schedule.brackets.length} brackets
                    </span>
                  </button>
                );
              })}
            </div>

            {selected ? (
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {selected.name}
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
                {mayManage
                  ? "This schedule has no brackets. Use Add bracket to create one."
                  : "This schedule has no brackets."}
              </p>
            ) : (
              <div className="-mx-6 overflow-x-auto border-y border-border/40 sm:mx-0 sm:rounded-lg sm:border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Min</TableHead>
                      <TableHead>Max</TableHead>
                      <TableHead>Base tax</TableHead>
                      <TableHead>Rate on excess %</TableHead>
                      {mayManage ? (
                        <TableHead className="w-20 text-right">Remove</TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drafts.map((draft, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={draft.minCompensation}
                            readOnly={!mayManage}
                            onChange={(e) => {
                              if (!mayManage) return;
                              const next = [...drafts];
                              next[index] = {
                                ...draft,
                                minCompensation: e.target.value,
                              };
                              setDrafts(next);
                            }}
                            aria-label={`Min compensation ${index + 1}`}
                            className="h-9 min-w-[6.5rem]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={draft.maxCompensation}
                            readOnly={!mayManage}
                            onChange={(e) => {
                              if (!mayManage) return;
                              const next = [...drafts];
                              next[index] = {
                                ...draft,
                                maxCompensation: e.target.value,
                              };
                              setDrafts(next);
                            }}
                            placeholder="Open"
                            aria-label={`Max compensation ${index + 1}`}
                            className="h-9 min-w-[6.5rem]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={draft.baseTax}
                            readOnly={!mayManage}
                            onChange={(e) => {
                              if (!mayManage) return;
                              const next = [...drafts];
                              next[index] = {
                                ...draft,
                                baseTax: e.target.value,
                              };
                              setDrafts(next);
                            }}
                            aria-label={`Base tax ${index + 1}`}
                            className="h-9 min-w-[6.5rem]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={draft.rateOnExcess}
                            readOnly={!mayManage}
                            onChange={(e) => {
                              if (!mayManage) return;
                              const next = [...drafts];
                              next[index] = {
                                ...draft,
                                rateOnExcess: e.target.value,
                              };
                              setDrafts(next);
                            }}
                            aria-label={`Rate on excess ${index + 1}`}
                            className="h-9 min-w-[6.5rem]"
                          />
                        </TableCell>
                        {mayManage ? (
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setDrafts((current) =>
                                current.filter((_, i) => i !== index),
                              )
                            }
                            aria-label={`Remove bracket ${index + 1}`}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

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

      <Dialog
        open={mayManage && addOpen}
        onOpenChange={(open) => {
          if (!mayManage) return;
          setAddOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add tax bracket</DialogTitle>
            <DialogDescription>
              Monthly compensation range, base tax, and percent on excess.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 px-4 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="tax-bracket-min">Min compensation</Label>
              <Input
                id="tax-bracket-min"
                value={newBracket.minCompensation}
                onChange={(e) =>
                  setNewBracket((current) => ({
                    ...current,
                    minCompensation: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tax-bracket-max">Max (blank = open)</Label>
              <Input
                id="tax-bracket-max"
                value={newBracket.maxCompensation}
                onChange={(e) =>
                  setNewBracket((current) => ({
                    ...current,
                    maxCompensation: e.target.value,
                  }))
                }
                placeholder="Open"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tax-bracket-base">Base tax</Label>
                <Input
                  id="tax-bracket-base"
                  value={newBracket.baseTax}
                  onChange={(e) =>
                    setNewBracket((current) => ({
                      ...current,
                      baseTax: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax-bracket-rate">Rate on excess %</Label>
                <Input
                  id="tax-bracket-rate"
                  value={newBracket.rateOnExcess}
                  onChange={(e) =>
                    setNewBracket((current) => ({
                      ...current,
                      rateOnExcess: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            {addError ? (
              <p className="text-sm text-destructive" role="alert">
                {addError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleAddBracket}>
                Add bracket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
