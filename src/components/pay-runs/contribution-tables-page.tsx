import { MoreVertical, Pencil, Plus, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import type { ContributionKind } from "~/api-services/pay-runs.types";
import { PageHeader } from "~/components/layout/page-header";
import { EmployeeContributionsTable } from "~/components/pay-runs/employee-contributions-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
  const [formOpen, setFormOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<BracketDraft>(EMPTY_BRACKET);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

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

  const persist = (rows: BracketDraft[]) => {
    if (!selected || !mayManage) return;
    setDrafts(rows);
    replace.mutate(
      {
        id: selected.id,
        input: {
          brackets: rows.map((row) => ({
            minCompensation: row.minCompensation.trim(),
            maxCompensation: row.maxCompensation.trim() || null,
            employeeShare: row.employeeShare.trim(),
            employerShare: row.employerShare.trim() || "0",
          })),
        },
      },
      {
        onSuccess: (result) => {
          const nextId = result.data.id;
          if (nextId && nextId !== selected.id) setSelectedId(nextId);
        },
      },
    );
  };

  const openAddModal = () => {
    setEditIndex(null);
    setForm(EMPTY_BRACKET);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditModal = (index: number) => {
    const row = drafts[index];
    if (!row) return;
    setEditIndex(index);
    setForm({ ...row });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSaveForm = () => {
    const min = form.minCompensation.trim();
    const employeeShare = form.employeeShare.trim();
    if (!min || !employeeShare) {
      setFormError("Min compensation and employee share are required.");
      return;
    }
    const nextRow: BracketDraft = {
      minCompensation: min,
      maxCompensation: form.maxCompensation.trim(),
      employeeShare,
      employerShare: form.employerShare.trim() || "0.00",
    };
    const next =
      editIndex == null
        ? [...drafts, nextRow]
        : drafts.map((row, index) => (index === editIndex ? nextRow : row));
    persist(next);
    setFormOpen(false);
    setEditIndex(null);
    setForm(EMPTY_BRACKET);
    setFormError(null);
  };

  const handleDelete = () => {
    if (deleteIndex == null) return;
    persist(drafts.filter((_, index) => index !== deleteIndex));
    setDeleteIndex(null);
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
                    <CardTitle className="text-base">Brackets</CardTitle>
                    <CardDescription>
                      {mayManage
                        ? "Add, edit, or delete a bracket. Changes save immediately. Blank max means open-ended."
                        : "View SSS / HDMF / PhilHealth brackets. Only Super Admin, admin, and finance can edit."}
                    </CardDescription>
                  </div>
                  {mayManage ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openAddModal}
                      disabled={!selected || replace.isPending}
                    >
                      <Plus className="size-4" />
                      Add bracket
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
                  <div className="-mx-6 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Min</TableHead>
                          <TableHead>Max</TableHead>
                          <TableHead>Employee share</TableHead>
                          <TableHead>Employer share</TableHead>
                          {mayManage ? (
                            <TableHead className="w-14 text-right">
                              <span className="sr-only">Actions</span>
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
                            <TableCell className="tabular-nums">
                              {draft.minCompensation}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {draft.maxCompensation.trim() || "Open"}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {draft.employeeShare}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {draft.employerShare}
                            </TableCell>
                            {mayManage ? (
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    disabled={replace.isPending}
                                    aria-label={`Bracket ${index + 1} actions`}
                                  >
                                    <MoreVertical className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem
                                    onSelect={() => openEditModal(index)}
                                  >
                                    <Pencil />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() => setDeleteIndex(index)}
                                  >
                                    <Trash2Icon />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
            open={mayManage && formOpen}
            onOpenChange={(open) => {
              if (!mayManage) return;
              setFormOpen(open);
              if (!open) setFormError(null);
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editIndex == null ? "Add" : "Edit"}{" "}
                  {selected ? KIND_LABEL[selected.kind] : ""} bracket
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
                    value={form.minCompensation}
                    onChange={(e) =>
                      setForm((current) => ({
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
                    value={form.maxCompensation}
                    onChange={(e) =>
                      setForm((current) => ({
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
                      value={form.employeeShare}
                      onChange={(e) =>
                        setForm((current) => ({
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
                      value={form.employerShare}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          employerShare: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                {formError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {formError}
                  </p>
                ) : null}
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveForm}
                    disabled={replace.isPending}
                  >
                    {replace.isPending
                      ? "Saving…"
                      : editIndex == null
                        ? "Add bracket"
                        : "Save bracket"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={deleteIndex != null}
            onOpenChange={(open) => {
              if (!open) setDeleteIndex(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this bracket?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bracket {deleteIndex == null ? "" : deleteIndex + 1} is
                  removed from this schedule and the change is saved
                  immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  onClick={handleDelete}
                  disabled={replace.isPending}
                >
                  Delete bracket
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  );
};
