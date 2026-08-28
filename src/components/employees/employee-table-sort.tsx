import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type {
  EmployeeSortBy,
  EmployeeSortDir,
} from "~/api-services/employees.types";
import { TableHead } from "~/components/ui/table";
import { cn } from "~/lib/utils";

interface SortableEmployeeTableHeadProps {
  label: string;
  sortKey: EmployeeSortBy;
  sortBy: EmployeeSortBy;
  sortDir: EmployeeSortDir;
  onSort: (sortKey: EmployeeSortBy) => void;
  className?: string;
}

export const SortableEmployeeTableHead = ({
  label,
  sortKey,
  sortBy,
  sortDir,
  onSort,
  className,
}: SortableEmployeeTableHeadProps) => {
  const isActive = sortBy === sortKey;
  const SortIcon = isActive
    ? sortDir === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm text-left font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
        aria-label={`Sort by ${label}`}
        aria-sort={
          isActive
            ? sortDir === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        <span>{label}</span>
        <SortIcon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            isActive ? "text-primary" : "text-muted-foreground/50",
          )}
          aria-hidden="true"
        />
      </button>
    </TableHead>
  );
};

export const toggleEmployeeSort = (
  sortBy: EmployeeSortBy,
  sortDir: EmployeeSortDir,
  nextKey: EmployeeSortBy,
): { sortBy: EmployeeSortBy; sortDir: EmployeeSortDir } => {
  if (sortBy === nextKey) {
    return { sortBy, sortDir: sortDir === "asc" ? "desc" : "asc" };
  }
  return { sortBy: nextKey, sortDir: "asc" };
};
