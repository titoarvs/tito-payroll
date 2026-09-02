import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

export const EMPLOYEE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200] as const;

export const DEFAULT_EMPLOYEE_PAGE_SIZE = EMPLOYEE_PAGE_SIZE_OPTIONS[0];

export type EmployeePageSize = (typeof EMPLOYEE_PAGE_SIZE_OPTIONS)[number];

interface EmployeeListPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: EmployeePageSize;
  isLoading?: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageSizeChange: (pageSize: EmployeePageSize) => void;
  /** Noun for the result summary, e.g. "employees" or "payslips". */
  itemLabel?: string;
  pageSizeSelectId?: string;
  /** Single dense row for narrow sidebars. */
  compact?: boolean;
  className?: string;
}

export const EmployeeListPagination = ({
  page,
  totalPages,
  total,
  pageSize,
  isLoading = false,
  onPreviousPage,
  onNextPage,
  onPageSizeChange,
  itemLabel = "employees",
  pageSizeSelectId = "employee-page-size",
  compact = false,
  className,
}: EmployeeListPaginationProps) => {
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;
  const rangeLabel =
    total === 0 ? "No results" : `${rangeStart}–${rangeEnd} of ${total}`;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 border-t border-border/40 px-2.5 py-1.5",
          className,
        )}
      >
        <p
          className="min-w-0 flex-1 truncate text-[11px] leading-none tabular-nums tracking-tight text-muted-foreground"
          aria-live="polite"
          title={
            total === 0 ? "No results" : `${rangeLabel} ${itemLabel}`
          }
        >
          {total === 0 ? "None" : `${rangeStart}–${rangeEnd}`}
          {total > 0 ? (
            <span className="text-muted-foreground/70"> / {total}</span>
          ) : null}
        </p>
        <div className="flex shrink-0 items-center gap-0.5">
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onPageSizeChange(Number(value) as EmployeePageSize)
            }
            disabled={isLoading}
          >
            <SelectTrigger
              id={pageSizeSelectId}
              size="sm"
              className="h-6 w-auto gap-0.5 border-0 bg-transparent px-1.5 text-[11px] shadow-none hover:bg-muted/60 focus-visible:ring-1"
              aria-label="Rows per page"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {EMPLOYEE_PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div
            className="flex items-center rounded-md bg-muted/40"
            role="group"
            aria-label="Pagination"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-6 shrink-0 rounded-md p-0 text-muted-foreground hover:text-foreground active:scale-95 disabled:opacity-35"
              onClick={onPreviousPage}
              disabled={isFirstPage || isLoading}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="size-3.5" />
            </Button>
            <span
              className="min-w-[2.25rem] px-0.5 text-center text-[11px] leading-none tabular-nums tracking-tight text-foreground/80"
              aria-live="polite"
            >
              {page}
              <span className="text-muted-foreground/60">/{totalPages}</span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-6 shrink-0 rounded-md p-0 text-muted-foreground hover:text-foreground active:scale-95 disabled:opacity-35"
              onClick={onNextPage}
              disabled={isLastPage || isLoading}
              aria-label="Next page"
            >
              <ChevronRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 0
          ? "No results"
          : `${rangeStart}–${rangeEnd} of ${total} ${itemLabel}`}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <label
            htmlFor={pageSizeSelectId}
            className="text-sm text-muted-foreground whitespace-nowrap"
          >
            Rows per page
          </label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onPageSizeChange(Number(value) as EmployeePageSize)
            }
            disabled={isLoading}
          >
            <SelectTrigger
              id={pageSizeSelectId}
              size="sm"
              className="w-[4.5rem]"
              aria-label="Rows per page"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {EMPLOYEE_PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={isFirstPage || isLoading}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <span className="min-w-24 text-center text-sm text-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={isLastPage || isLoading}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
