import type { ChangeEvent } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface EmployeeListControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  isLoading: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export const EmployeeListControls = ({
  searchQuery,
  onSearchChange,
  page,
  totalPages,
  total,
  pageSize,
  isLoading,
  onPreviousPage,
  onNextPage,
}: EmployeeListControlsProps) => {
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full max-w-sm">
        <label htmlFor="employee-search" className="sr-only">
          Search employees
        </label>
        <Input
          id="employee-search"
          type="search"
          placeholder="Search by name, email, or code"
          value={searchQuery}
          onChange={handleSearchChange}
          aria-label="Search employees by name, email, or code"
          disabled={isLoading && total === 0 && !searchQuery}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {total === 0
            ? "No results"
            : `${rangeStart}–${rangeEnd} of ${total}`}
        </p>
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
