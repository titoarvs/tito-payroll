import type { ChangeEvent } from "react";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface EmployeeListControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const EmployeeListControls = ({
  searchQuery,
  onSearchChange,
  isLoading = false,
  className,
}: EmployeeListControlsProps) => {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <div className={cn("w-full", className)}>
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
        disabled={isLoading && !searchQuery}
      />
    </div>
  );
};
