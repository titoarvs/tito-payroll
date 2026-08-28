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
  className,
}: EmployeeListPaginationProps) => {
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

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
          : `${rangeStart}–${rangeEnd} of ${total} employees`}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <label
            htmlFor="employee-page-size"
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
              id="employee-page-size"
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
