import { Plus, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import type { ContributionKind } from "~/api-services/pay-runs.types";
import { PageHeader } from "~/components/layout/page-header";
import { EmployeeContributionsTable } from "~/components/pay-runs/employee-contributions-table";
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
  useContributionSchedules,
  useReplaceBrackets,
} from "~/hooks/use-pay-runs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { HrisApiError } from "~/lib/hris-api-client";
import { canManageStatutoryTables } from "~/lib/payroll-access";
import { cn } from "~/lib/utils";

interface BracketDraft {
  minCompensation: string;
  maxCompensation: string;
  employeeShare: string;
  employerShare: string;
}

type PageTab = "employees" | "brackets";

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

const EMPTY_BRACKET: BracketDraft = {
  minCompensation: "0.00",
  maxCompensation: "",
  employeeShare: "0.00",
  employerShare: "0.00",
};

export const ContributionTablesPage = () => {
  const { data: user } = useCurrentUser();
  const mayManage = canManageStatutoryTables(user);
  const { data, isPending, isError, error } = useContributionSchedules();
  const replace = useReplaceBrackets();
  const schedules = data?.data ?? [];
  const [pageTab, setPageTab] = useState<PageTab>("employees");
  const [selectedId, setSelectedId] = useState<string>("");
  const [drafts, setDrafts] = useState<BracketDraft[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newBracket, setNewBracket] = useState<BracketDraft>(EMPTY_BRACKET);
  const [addError, setAddError] = useState<string | null>(null);

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

  const openAddModal = () => {
    setNewBracket(EMPTY_BRACKET);
    setAddError(null);
    setAddOpen(true);
  };

  const handleAddBracket = () => {
    const min = newBracket.minCompensation.trim();
    const employeeShare = newBracket.employeeShare.trim();
    if (!min || !employeeShare) {
      setAddError("Min compensation and employee share are required.");
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
        title="Contribution tables"
        description="SSS / HDMF / PhilHealth brackets (employee share). Lookup key is monthly salary."
      />

      <div
        className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-lg border border-border/50 bg-muted/30 p-1"
        role="tablist"
        aria-label="Contribution tables sections"
      >
        {(
          [
            { id: "employees", label: "Employees" },
            { id: "brackets", label: "Brackets" },
          ] as const
        ).map((tab) => {
          const active = pageTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPageTab(tab.id)}
              className={cn(
                "rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-tito-green text-tito-dark-green shadow-sm"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {pageTab === "employees" ? <EmployeeContributionsTable /> : null}

      {pageTab === "brackets" ? (
        <>
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
                  Contribution brackets are empty in HRIS. Seed starter SSS /
                  HDMF / PhilHealth tables, then refresh this page.
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
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {mayManage ? "Edit brackets" : "Brackets"}
                    </CardTitle>
                    <CardDescription>
                      {mayManage
                        ? "Switch fund tab, edit rows, then save. Add new brackets from the dialog."
                        : "View SSS / HDMF / PhilHealth brackets. Only Super Admin and finance can edit."}
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
                          {KIND_HINT[kind]} · {schedule.brackets.length}{" "}
                          brackets
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selected ? (
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
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
                      {drafts.length} bracket
                      {drafts.length === 1 ? "" : "s"}
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
                          <TableHead>Employee share</TableHead>
                          <TableHead>Employer share</TableHead>
                          {mayManage ? (
                            <TableHead className="w-20 text-right">
                              Remove
                            </TableHead>
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
                                value={draft.employeeShare}
                                readOnly={!mayManage}
                                onChange={(e) => {
                                  if (!mayManage) return;
                                  const next = [...drafts];
                                  next[index] = {
                                    ...draft,
                                    employeeShare: e.target.value,
                                  };
                                  setDrafts(next);
                                }}
                                aria-label={`Employee share ${index + 1}`}
                                className="h-9 min-w-[6.5rem]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={draft.employerShare}
                                readOnly={!mayManage}
                                onChange={(e) => {
                                  if (!mayManage) return;
                                  const next = [...drafts];
                                  next[index] = {
                                    ...draft,
                                    employerShare: e.target.value,
                                  };
                                  setDrafts(next);
                                }}
                                aria-label={`Employer share ${index + 1}`}
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
                <DialogTitle>
                  Add {selected ? KIND_LABEL[selected.kind] : ""} bracket
                </DialogTitle>
                <DialogDescription>
                  Compensation range and shares. Blank max means open-ended.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 px-4 pb-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bracket-min">Min compensation</Label>
                  <Input
                    id="bracket-min"
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
                  <Label htmlFor="bracket-max">Max (blank = open)</Label>
                  <Input
                    id="bracket-max"
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
                    <Label htmlFor="bracket-employee">Employee share</Label>
                    <Input
                      id="bracket-employee"
                      value={newBracket.employeeShare}
                      onChange={(e) =>
                        setNewBracket((current) => ({
                          ...current,
                          employeeShare: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bracket-employer">Employer share</Label>
                    <Input
                      id="bracket-employer"
                      value={newBracket.employerShare}
                      onChange={(e) =>
                        setNewBracket((current) => ({
                          ...current,
                          employerShare: e.target.value,
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
        </>
      ) : null}
    </div>
  );
};
