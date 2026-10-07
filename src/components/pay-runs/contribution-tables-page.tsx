import { MoreVertical, Pencil, Plus, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import type { ContributionKind } from "~/api-services/pay-runs.types";
import { TaxTablesPage } from "~/components/pay-runs/tax-tables-page";
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

const KIND_LABEL: Record<ContributionKind, string> = {
  sss: "SSS",
  hdmf: "Pag-IBIG",
  philhealth: "PhilHealth",
};

type Category = ContributionKind | "withholding";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "sss", label: "SSS" },
  { id: "philhealth", label: "PhilHealth" },
  { id: "hdmf", label: "Pag-IBIG" },
  { id: "withholding", label: "Withholding" },
];

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
  const [category, setCategory] = useState<Category>("sss");
  const [selectedId, setSelectedId] = useState<string>("");
  const [drafts, setDrafts] = useState<BracketDraft[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<BracketDraft>(EMPTY_BRACKET);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [withholdingAdd, setWithholdingAdd] = useState(0);

  const selected =
    schedules.find((s) => s.id === selectedId) ?? schedules[0] ?? null;

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

  const chooseCategory = (next: Category) => {
    setCategory(next);
    if (next === "withholding") return;
    const schedule = schedules.find((item) => item.kind === next);
    if (schedule) setSelectedId(schedule.id);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="page-title text-2xl font-semibold text-foreground">
          Contributions
        </h1>
        {mayManage ? (
          <Button
            type="button"
            onClick={() => {
              if (category === "withholding") {
                setWithholdingAdd((current) => current + 1);
                return;
              }
              openAddModal();
            }}
            disabled={
              category === "withholding"
                ? false
                : !selected || replace.isPending
            }
          >
            <Plus className="size-4" />
            Add bracket
          </Button>
        ) : null}
      </div>

      <div
        className="flex gap-6 border-b border-border"
        role="tablist"
        aria-label="Contribution categories"
      >
        {CATEGORIES.map((item) => {
          const active = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                "-mb-px border-b-2 px-1 pb-2 text-sm",
                active
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              onClick={() => chooseCategory(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {category === "withholding" ? (
        <TaxTablesPage embedded addRequest={withholdingAdd} />
      ) : null}

      {category !== "withholding" ? (
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
            <div className="space-y-3">
                {selected ? (
                  <p className="text-sm text-muted-foreground">
                    {KIND_HINT[selected.kind]} · effective {selected.effectiveFrom}
                    {selected.effectiveTo ? ` to ${selected.effectiveTo}` : ""}
                    {selected.isActive ? "" : " · inactive"}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No {KIND_LABEL[category]} schedule yet.
                  </p>
                )}

                {drafts.length === 0 ? (
                  <p className="text-sm text-muted-foreground" role="status">
                    {mayManage
                      ? "This schedule has no brackets. Use Add bracket to create one."
                      : "This schedule has no brackets."}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
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
            </div>
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
