import {
  CheckIcon,
  Columns3Icon,
  GripVerticalIcon,
} from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

export type TableColumnPreference<Id extends string = string> = {
  id: Id;
  visible: boolean;
};

export type TableColumnDef<Id extends string = string> = {
  id: Id;
  label: string;
};

const normalizeColumns = <Id extends string>(
  defs: TableColumnDef<Id>[],
  input: unknown,
): TableColumnPreference<Id>[] => {
  const validIds = new Set(defs.map((d) => d.id));
  const seen = new Set<Id>();
  const next: TableColumnPreference<Id>[] = [];

  if (Array.isArray(input)) {
    for (const row of input) {
      if (!row || typeof row !== "object") continue;
      const id = (row as { id?: unknown }).id as Id;
      if (typeof id !== "string" || !validIds.has(id) || seen.has(id)) continue;
      seen.add(id);
      next.push({
        id,
        visible: (row as { visible?: unknown }).visible !== false,
      });
    }
  }

  for (const def of defs) {
    if (seen.has(def.id)) continue;
    next.push({ id: def.id, visible: true });
  }

  return next;
};

const readStored = <Id extends string>(
  storageKey: string,
  defs: TableColumnDef<Id>[],
): TableColumnPreference<Id>[] => {
  if (typeof window === "undefined") {
    return defs.map((d) => ({ id: d.id, visible: true }));
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defs.map((d) => ({ id: d.id, visible: true }));
    return normalizeColumns(defs, JSON.parse(raw) as unknown);
  } catch {
    return defs.map((d) => ({ id: d.id, visible: true }));
  }
};

const writeStored = <Id extends string>(
  storageKey: string,
  columns: TableColumnPreference<Id>[],
): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(columns));
  } catch {
    // Ignore quota / private mode.
  }
};

export const useTableColumns = <Id extends string>(
  storageKey: string,
  defs: TableColumnDef<Id>[],
) => {
  const [columns, setColumns] = useState<TableColumnPreference<Id>[]>(() =>
    readStored(storageKey, defs),
  );

  useEffect(() => {
    writeStored(storageKey, columns);
  }, [columns, storageKey]);

  const visibleIds = columns.filter((c) => c.visible).map((c) => c.id);
  const labelById = Object.fromEntries(
    defs.map((d) => [d.id, d.label]),
  ) as Record<Id, string>;

  return { columns, setColumns, visibleIds, labelById };
};

type TableColumnVisibilityProps<Id extends string> = {
  columns: TableColumnPreference<Id>[];
  labelById: Record<Id, string>;
  onChange: (columns: TableColumnPreference<Id>[]) => void;
  /** Fixed columns that stay shown (informational copy only). */
  lockedHint?: string;
  className?: string;
};

export const TableColumnVisibility = <Id extends string>({
  columns,
  labelById,
  onChange,
  lockedHint = "Primary columns stay fixed.",
  className,
}: TableColumnVisibilityProps<Id>) => {
  const [dragId, setDragId] = useState<Id | null>(null);
  const [overId, setOverId] = useState<Id | null>(null);
  const hiddenCount = columns.filter((c) => !c.visible).length;

  const toggleVisible = (id: Id) => {
    onChange(
      columns.map((col) =>
        col.id === id ? { ...col, visible: !col.visible } : col,
      ),
    );
  };

  const moveColumn = (fromId: Id, toId: Id) => {
    if (fromId === toId) return;
    const fromIndex = columns.findIndex((c) => c.id === fromId);
    const toIndex = columns.findIndex((c) => c.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...columns];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);
    onChange(next);
  };

  const showAll = () => {
    onChange(columns.map((col) => ({ ...col, visible: true })));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2 border-border/60 bg-card px-2.5 text-muted-foreground shadow-none",
            "hover:bg-muted/50 hover:text-foreground",
            className,
          )}
          aria-label="Show or hide table columns"
        >
          <Columns3Icon className="size-3.5" />
          <span className="text-sm font-medium text-foreground/80">
            Columns
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 gap-0 overflow-hidden rounded-lg border-border/60 p-0 shadow-md"
      >
        <div className="border-b border-border/50 px-3 py-2.5">
          <p className="text-sm font-medium tracking-tight text-foreground">
            Columns
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            Drag to reorder · click to toggle. {lockedHint}
          </p>
        </div>
        <ul className="max-h-72 space-y-0.5 overflow-y-auto p-1.5" role="list">
          {columns.map((col) => {
            const label = labelById[col.id] ?? col.id;
            const isDragging = dragId === col.id;
            const isOver = overId === col.id && dragId !== col.id;
            return (
              <li
                key={col.id}
                draggable
                onDragStart={(event: DragEvent<HTMLLIElement>) => {
                  setDragId(col.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", col.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                onDragOver={(event: DragEvent<HTMLLIElement>) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (overId !== col.id) setOverId(col.id);
                }}
                onDragLeave={() => {
                  if (overId === col.id) setOverId(null);
                }}
                onDrop={(event: DragEvent<HTMLLIElement>) => {
                  event.preventDefault();
                  const fromId = event.dataTransfer.getData("text/plain") as Id;
                  moveColumn(fromId, col.id);
                  setDragId(null);
                  setOverId(null);
                }}
                className={cn(
                  "flex items-center gap-0.5 rounded-md transition-colors",
                  isDragging && "opacity-40",
                  isOver && "bg-muted/70 ring-1 ring-border/60",
                )}
              >
                <span
                  className="flex size-7 shrink-0 cursor-grab items-center justify-center text-muted-foreground/70 active:cursor-grabbing"
                  aria-hidden
                >
                  <GripVerticalIcon className="size-3.5" />
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={col.visible}
                  onClick={() => toggleVisible(col.id)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors",
                    "hover:bg-muted/50 active:scale-[0.99] motion-reduce:active:scale-100",
                    col.visible
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                      col.visible
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/80 bg-card",
                    )}
                    aria-hidden
                  >
                    {col.visible ? (
                      <CheckIcon className="size-2.5 stroke-[3]" />
                    ) : null}
                  </span>
                  <span className="min-w-0 truncate">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {hiddenCount > 0 ? (
          <div className="border-t border-border/50 p-1.5">
            <button
              type="button"
              onClick={showAll}
              className="w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              Show all columns
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};
