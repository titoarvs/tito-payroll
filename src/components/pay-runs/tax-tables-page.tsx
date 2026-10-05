import { MoreVertical, Pencil, Plus, Trash2Icon, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  TaxBracketFrequency,
  TaxSchedule,
} from "~/api-services/pay-runs.types";
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
  useAddDraftTaxBracket,
  useDeleteDraftTaxBracket,
  useImportDraftTaxBrackets,
  usePublishTaxDraft,
  useTaxSchedules,
  useUpdateDraftTaxBracket,
} from "~/hooks/use-pay-runs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { HrisApiError } from "~/lib/hris-api-client";
import { canManageTaxTables, canPublishTaxTables } from "~/lib/payroll-access";

const FREQUENCIES: TaxBracketFrequency[] = [
  "daily",
  "weekly",
  "semi-monthly",
  "monthly",
  "annual",
];

interface BracketDraft {
  frequency: TaxBracketFrequency;
  sequence: string;
  minCompensation: string;
  maxCompensation: string;
  baseTax: string;
  rateOnExcess: string;
  excessOver: string;
}

const EMPTY_BRACKET: BracketDraft = {
  frequency: "semi-monthly",
  sequence: "1",
  minCompensation: "0.00",
  maxCompensation: "",
  baseTax: "0.00",
  rateOnExcess: "0.00",
  excessOver: "0.00",
};

const frequencyLabel = (value: string): string => {
  switch (value) {
    case "semi-monthly":
      return "Semi-monthly";
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "annual":
      return "Annual";
    default:
      return value;
  }
};

export const TaxTablesPage = () => {
  const { data: user } = useCurrentUser();
  const mayManage = canManageTaxTables(user);
  const mayPublish = canPublishTaxTables(user);
  const { data, isPending, isError, error } = useTaxSchedules();
  const addDraft = useAddDraftTaxBracket();
  const updateDraft = useUpdateDraftTaxBracket();
  const deleteDraft = useDeleteDraftTaxBracket();
  const importDraft = useImportDraftTaxBrackets();
  const publishDraft = usePublishTaxDraft();
  const schedules = data?.data ?? [];
  const importInputRef = useRef<HTMLInputElement>(null);

  const draftSchedule =
    schedules.find((s) => s.status === "draft") ?? null;
  const activeSchedule =
    schedules.find((s) => s.isActive && s.status !== "draft") ??
    schedules.find((s) => s.isActive) ??
    schedules[0] ??
    null;

  const [selectedId, setSelectedId] = useState("");
  const [frequencyFilter, setFrequencyFilter] =
    useState<TaxBracketFrequency | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<BracketDraft>(EMPTY_BRACKET);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const selected: TaxSchedule | null =
    schedules.find((s) => s.id === selectedId) ??
    draftSchedule ??
    activeSchedule;

  useEffect(() => {
    if (!selectedId && (draftSchedule || activeSchedule)) {
      setSelectedId((draftSchedule ?? activeSchedule)!.id);
      return;
    }
    if (selectedId && !schedules.some((s) => s.id === selectedId)) {
      setSelectedId((draftSchedule ?? activeSchedule)?.id ?? "");
    }
  }, [schedules, selectedId, draftSchedule, activeSchedule]);

  const visibleBrackets = useMemo(() => {
    const rows = selected?.brackets ?? [];
    if (frequencyFilter === "all") return rows;
    return rows.filter((b) => b.frequency === frequencyFilter);
  }, [selected, frequencyFilter]);

  const isDraftSelected = selected?.status === "draft";
  const mayEditSelected = mayManage && isDraftSelected;

  const openAddModal = () => {
    if (!mayManage) return;
    setEditIndex(null);
    const nextSeq =
      (selected?.brackets.filter(
        (b) =>
          b.frequency ===
          (frequencyFilter === "all" ? "semi-monthly" : frequencyFilter),
      ).length ?? 0) + 1;
    setForm({
      ...EMPTY_BRACKET,
      frequency:
        frequencyFilter === "all" ? "semi-monthly" : frequencyFilter,
      sequence: String(nextSeq),
    });
    setFormError(null);
    setFormOpen(true);
  };

  const openEditModal = (index: number) => {
    const row = visibleBrackets[index];
    if (!row || !selected) return;
    setEditIndex(
      selected.brackets.findIndex((b) => b.id === row.id),
    );
    setForm({
      frequency: (row.frequency as TaxBracketFrequency) || "monthly",
      sequence: String(row.sequence ?? index + 1),
      minCompensation: row.minCompensation,
      maxCompensation: row.maxCompensation ?? "",
      baseTax: row.baseTax,
      rateOnExcess: row.rateOnExcess,
      excessOver: row.excessOver || row.minCompensation,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSaveForm = () => {
    const min = form.minCompensation.trim();
    const baseTax = form.baseTax.trim();
    const rateOnExcess = form.rateOnExcess.trim();
    const excessOver = form.excessOver.trim() || min;
    const sequence = Number(form.sequence);
    if (!min || !baseTax || !rateOnExcess || !excessOver) {
      setFormError(
        "Min, base tax, rate on excess, and excess-over are required.",
      );
      return;
    }
    if (!Number.isInteger(sequence) || sequence < 1) {
      setFormError("Sequence must be a positive integer.");
      return;
    }

    const payload = {
      frequency: form.frequency,
      sequence,
      minCompensation: min,
      maxCompensation: form.maxCompensation.trim() || null,
      baseTax,
      rateOnExcess,
      excessOver,
    };

    if (editIndex != null && selected) {
      const row = selected.brackets[editIndex];
      if (!row) return;

      if (!isDraftSelected) {
        setFormError(
          "Published schedules are immutable. Edit the draft, then ask Super Admin to publish.",
        );
        return;
      }

      updateDraft.mutate(
        { bracketId: row.id, input: payload },
        {
          onSuccess: (result) => {
            if (result.data.id) setSelectedId(result.data.id);
            setFormOpen(false);
            setEditIndex(null);
            setFormError(null);
          },
          onError: (err) => {
            setFormError(
              err instanceof HrisApiError
                ? err.message
                : "Failed to update draft bracket",
            );
          },
        },
      );
      return;
    }

    addDraft.mutate(payload, {
      onSuccess: (result) => {
        setSelectedId(result.data.id);
        setFrequencyFilter(form.frequency);
        setFormOpen(false);
        setEditIndex(null);
        setForm(EMPTY_BRACKET);
        setFormError(null);
      },
      onError: (err) => {
        setFormError(
          err instanceof HrisApiError
            ? err.message
            : "Failed to save draft bracket",
        );
      },
    });
  };

  const handleDelete = () => {
    if (deleteIndex == null || !selected) {
      setDeleteIndex(null);
      return;
    }
    const row = visibleBrackets[deleteIndex];
    if (!row) {
      setDeleteIndex(null);
      return;
    }

    if (isDraftSelected) {
      deleteDraft.mutate(row.id, {
        onSuccess: (result) => {
          if (result.data.id) setSelectedId(result.data.id);
          setDeleteIndex(null);
        },
        onError: () => {
          setDeleteIndex(null);
        },
      });
      return;
    }

    setDeleteIndex(null);
  };

  const handleImportFile = (file: File | undefined) => {
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const csv = typeof reader.result === "string" ? reader.result : "";
      importDraft.mutate(
        { csv },
        {
          onSuccess: (result) => {
            if (result.data.id) setSelectedId(result.data.id);
            setImportError(null);
          },
          onError: (err) => {
            setImportError(
              err instanceof HrisApiError
                ? err.message
                : "Failed to import tax brackets CSV",
            );
          },
        },
      );
    };
    reader.onerror = () => {
      setImportError("Could not read the selected file.");
    };
    reader.readAsText(file);
  };

  const savePending =
    addDraft.isPending ||
    updateDraft.isPending ||
    deleteDraft.isPending ||
    importDraft.isPending;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PageHeader
        title="Tax tables"
        description="Versioned BIR / TRAIN monthly brackets by frequency. HR/finance draft and import; Super Admin publishes. Compute uses the active monthly schedule."
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

      {!isPending && !isError && selected ? (
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  {selected.name}
                  {isDraftSelected ? (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                      Draft
                    </span>
                  ) : selected.isActive ? (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                      Active
                    </span>
                  ) : null}
                </CardTitle>
                <CardDescription>
                  Withholding = base + rate% × (taxable − excess-over). Blank max
                  is open-ended.
                </CardDescription>
              </div>
              {mayManage ? (
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handleImportFile(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => importInputRef.current?.click()}
                    disabled={importDraft.isPending}
                  >
                    <Upload className="size-4" />
                    {importDraft.isPending ? "Importing…" : "Import CSV"}
                  </Button>
                  {draftSchedule && mayPublish ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        publishDraft.mutate(undefined, {
                          onSuccess: (result) => {
                            if (result.data.id) setSelectedId(result.data.id);
                          },
                        })
                      }
                      disabled={publishDraft.isPending}
                    >
                      {publishDraft.isPending
                        ? "Publishing…"
                        : "Publish draft"}
                    </Button>
                  ) : null}
                  <Button type="button" onClick={openAddModal}>
                    <Plus className="size-4" />
                    Add bracket
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tax-schedule">Schedule</Label>
                <select
                  id="tax-schedule"
                  className="flex h-9 w-full min-w-[14rem] rounded-md border border-input bg-background px-3 text-sm"
                  value={selected.id}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.status === "draft"
                        ? " (draft)"
                        : s.isActive
                          ? " (active)"
                          : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax-frequency">Frequency</Label>
                <select
                  id="tax-frequency"
                  className="flex h-9 w-full min-w-[12rem] rounded-md border border-input bg-background px-3 text-sm"
                  value={frequencyFilter}
                  onChange={(e) =>
                    setFrequencyFilter(
                      e.target.value as TaxBracketFrequency | "all",
                    )
                  }
                >
                  <option value="all">All frequencies</option>
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {frequencyLabel(f)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {visibleBrackets.length === 0 ? (
              <p className="text-sm text-muted-foreground" role="status">
                {mayManage
                  ? "No brackets for this filter. Use Add bracket to save one on the draft."
                  : "No brackets for this filter."}
              </p>
            ) : (
              <div className="-mx-6 overflow-x-auto sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">Seq</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Min</TableHead>
                      <TableHead>Max</TableHead>
                      <TableHead>Base tax</TableHead>
                      <TableHead>Rate %</TableHead>
                      <TableHead>Excess-over</TableHead>
                      {mayEditSelected ? (
                        <TableHead className="w-14 text-right">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleBrackets.map((draft, index) => (
                      <TableRow key={draft.id ?? index}>
                        <TableCell className="text-xs text-muted-foreground">
                          {draft.sequence ?? index + 1}
                        </TableCell>
                        <TableCell>
                          {frequencyLabel(String(draft.frequency ?? "monthly"))}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {draft.minCompensation}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {draft.maxCompensation?.trim()
                            ? draft.maxCompensation
                            : "Open"}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {draft.baseTax}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {draft.rateOnExcess}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {draft.excessOver || draft.minCompensation}
                        </TableCell>
                        {mayEditSelected ? (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  disabled={savePending}
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

            {importError ||
            addDraft.isError ||
            updateDraft.isError ||
            deleteDraft.isError ||
            importDraft.isError ||
            publishDraft.isError ? (
              <p className="text-sm text-destructive" role="alert">
                {importError ??
                  ((
                    addDraft.error ||
                    updateDraft.error ||
                    deleteDraft.error ||
                    importDraft.error ||
                    publishDraft.error
                  ) instanceof HrisApiError
                    ? (
                        (addDraft.error ||
                          updateDraft.error ||
                          deleteDraft.error ||
                          importDraft.error ||
                          publishDraft.error) as HrisApiError
                      ).message
                    : "Save failed")}
              </p>
            ) : null}
            {addDraft.isSuccess ||
            updateDraft.isSuccess ||
            deleteDraft.isSuccess ||
            importDraft.isSuccess ||
            publishDraft.isSuccess ? (
              <p className="text-sm text-muted-foreground" role="status">
                {publishDraft.isSuccess
                  ? "Draft published."
                  : importDraft.isSuccess
                    ? "CSV imported into draft. Review, then Super Admin can publish."
                    : "Brackets saved."}
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
              {editIndex == null
                ? "Saved under the selected frequency on the draft version."
                : "Updates this bracket on the draft only. The published schedule is unchanged until Super Admin publishes."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tax-bracket-frequency">Frequency</Label>
                <select
                  id="tax-bracket-frequency"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.frequency}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      frequency: e.target.value as TaxBracketFrequency,
                    }))
                  }
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {frequencyLabel(f)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax-bracket-sequence">Sequence</Label>
                <Input
                  id="tax-bracket-sequence"
                  value={form.sequence}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      sequence: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tax-bracket-min">Min</Label>
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
                <Label htmlFor="tax-bracket-rate">Rate %</Label>
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
            <div className="space-y-1.5">
              <Label htmlFor="tax-bracket-excess">Excess-over</Label>
              <Input
                id="tax-bracket-excess"
                value={form.excessOver}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    excessOver: e.target.value,
                  }))
                }
              />
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
                disabled={savePending}
              >
                {savePending
                  ? "Saving…"
                  : editIndex == null
                    ? "Add to draft"
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
              from the draft only. The published schedule is unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={handleDelete}
              disabled={deleteDraft.isPending}
            >
              Delete bracket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
