import { MoreVertical, Pencil, Plus, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "~/components/layout/page-header";
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
  useReplaceTaxBrackets,
  useTaxSchedules,
} from "~/hooks/use-pay-runs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { HrisApiError } from "~/lib/hris-api-client";
import { canManageTaxTables } from "~/lib/payroll-access";

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
  const mayManage = canManageTaxTables(user);
  const { data, isPending, isError, error } = useTaxSchedules();
  const replace = useReplaceTaxBrackets();
  const schedules = data?.data ?? [];
  const [selectedId, setSelectedId] = useState("");
  const [drafts, setDrafts] = useState<BracketDraft[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<BracketDraft>(EMPTY_BRACKET);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

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
            baseTax: row.baseTax.trim(),
            rateOnExcess: row.rateOnExcess.trim(),
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
    const baseTax = form.baseTax.trim();
    const rateOnExcess = form.rateOnExcess.trim();
    if (!min || !baseTax || !rateOnExcess) {
      setFormError(
        "Min compensation, base tax, and rate on excess are required.",
      );
      return;
    }
    const nextRow: BracketDraft = {
      minCompensation: min,
      maxCompensation: form.maxCompensation.trim(),
      baseTax,
      rateOnExcess,
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
                <CardTitle className="text-base">Brackets</CardTitle>
                <CardDescription>
                  {mayManage
                    ? "Add, edit, or delete a bracket. Changes save immediately. Blank max means open-ended."
                    : "View BIR / TRAIN brackets. Only Super Admin, admin, and finance can edit."}
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
            {drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground" role="status">
                {mayManage
                  ? "This schedule has no brackets. Use Add bracket to create one."
                  : "This schedule has no brackets."}
              </p>
            ) : (
              <div className="-mx-6 overflow-x-auto sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Min</TableHead>
                      <TableHead>Max</TableHead>
                      <TableHead>Base tax</TableHead>
                      <TableHead>Rate on excess %</TableHead>
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
                          {draft.baseTax}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {draft.rateOnExcess}
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
              {editIndex == null ? "Add tax bracket" : "Edit tax bracket"}
            </DialogTitle>
            <DialogDescription>
              Monthly compensation range, base tax, and percent on excess.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 px-4 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="tax-bracket-min">Min compensation</Label>
              <Input
                id="tax-bracket-min"
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
              <Label htmlFor="tax-bracket-max">Max (blank = open)</Label>
              <Input
                id="tax-bracket-max"
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
                <Label htmlFor="tax-bracket-base">Base tax</Label>
                <Input
                  id="tax-bracket-base"
                  value={form.baseTax}
                  onChange={(e) =>
                    setForm((current) => ({
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
                  value={form.rateOnExcess}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      rateOnExcess: e.target.value,
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
            <AlertDialogTitle>Delete this tax bracket?</AlertDialogTitle>
            <AlertDialogDescription>
              Bracket {deleteIndex == null ? "" : deleteIndex + 1} is removed
              from this schedule and the change is saved immediately.
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
    </div>
  );
};
