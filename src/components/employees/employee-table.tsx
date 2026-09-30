import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type {
  EmployeeListItem,
  EmployeeSortBy,
  EmployeeSortDir,
} from "~/api-services/employees.types";
import {
  departmentLabel,
  displayName,
  employeeCodeLabel,
  formatEmployeeDate,
  initialsFrom,
  isHttpImage,
  positionLabel,
  titleCaseStatus,
} from "~/components/employees/employee-display";
import {
  columnDefById,
  type EmployeeTableColumnId,
} from "~/components/employees/employee-table-columns";
import { SortableEmployeeTableHead } from "~/components/employees/employee-table-sort";
import {
  EMPLOYEE_ROSTER_TABLE_BODY_CLASS,
  EMPLOYEE_ROSTER_TABLE_CLASS,
} from "~/components/employees/employee-roster-skeleton";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { TableColumnPreference } from "~/components/ui/table-column-visibility";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";

interface EmployeeTableProps {
  employees: EmployeeListItem[];
  sortBy: EmployeeSortBy;
  sortDir: EmployeeSortDir;
  onSort: (sortKey: EmployeeSortBy) => void;
  columns: TableColumnPreference<EmployeeTableColumnId>[];
  footer?: ReactNode;
  className?: string;
  isRefreshing?: boolean;
}

const renderColumnCell = (
  id: EmployeeTableColumnId,
  employee: EmployeeListItem,
) => {
  switch (id) {
    case "employeeCode":
      return (
        <TableCell className="max-w-[10rem] truncate font-mono text-xs text-muted-foreground">
          {employeeCodeLabel(employee)}
        </TableCell>
      );
    case "department":
      return (
        <TableCell className="max-w-[12rem] truncate text-muted-foreground">
          {departmentLabel(employee)}
        </TableCell>
      );
    case "position":
      return (
        <TableCell className="max-w-[12rem] truncate text-muted-foreground">
          {positionLabel(employee)}
        </TableCell>
      );
    case "status":
      return (
        <TableCell className="max-w-[8rem] truncate text-muted-foreground">
          {titleCaseStatus(employee.employmentStatus)}
        </TableCell>
      );
    case "startDate":
      return (
        <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
          {formatEmployeeDate(employee.startDate)}
        </TableCell>
      );
    case "createdAt":
      return (
        <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
          {formatEmployeeDate(employee.createdAt)}
        </TableCell>
      );
  }
};

const renderColumnHead = (
  id: EmployeeTableColumnId,
  sortBy: EmployeeSortBy,
  sortDir: EmployeeSortDir,
  onSort: (sortKey: EmployeeSortBy) => void,
) => {
  const def = columnDefById(id);
  if (def.sortKey) {
    return (
      <SortableEmployeeTableHead
        key={id}
        label={def.label}
        sortKey={def.sortKey}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={onSort}
        className={
          id === "startDate"
            ? "min-w-[6rem] whitespace-nowrap"
            : id === "status"
              ? "min-w-[6rem]"
              : id === "employeeCode"
                ? "min-w-[8rem]"
                : "min-w-[8rem]"
        }
      />
    );
  }
  return (
    <TableHead
      key={id}
      className={
        id === "createdAt"
          ? "min-w-[6rem] whitespace-nowrap"
          : "min-w-[8rem]"
      }
    >
      {def.label}
    </TableHead>
  );
};

export const EmployeeTable = ({
  employees,
  sortBy,
  sortDir,
  onSort,
  columns,
  footer,
  className,
  isRefreshing = false,
}: EmployeeTableProps) => {
  const visibleColumns = columns.filter((col) => col.visible);

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border-border/40 shadow-sm",
        className,
      )}
      aria-label="Employee roster table"
    >
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div
          className={cn(
            EMPLOYEE_ROSTER_TABLE_BODY_CLASS,
            isRefreshing && "opacity-60",
          )}
          aria-busy={isRefreshing}
        >
          <Table className={EMPLOYEE_ROSTER_TABLE_CLASS}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableEmployeeTableHead
                  label="Employee"
                  sortKey="name"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={onSort}
                  className="min-w-[12rem]"
                />
                {visibleColumns.map((col) =>
                  renderColumnHead(col.id, sortBy, sortDir, onSort),
                )}
                <TableHead className="w-28 min-w-28 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const name = displayName(employee);
                const photoUrl = isHttpImage(employee.userImage)
                  ? employee.userImage
                  : null;

                return (
                  <TableRow key={employee.id} className="hover:bg-muted/25">
                    <TableCell className="max-w-[16rem]">
                      <Link
                        to="/dashboard/employees/$id"
                        params={{ id: employee.id }}
                        className={cn(
                          "flex min-w-0 items-center gap-3 rounded-md outline-none",
                          "transition-colors hover:text-foreground",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        )}
                        aria-label={`View ${name}`}
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-muted text-xs font-semibold text-foreground"
                          aria-hidden={photoUrl ? undefined : true}
                        >
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{initialsFrom(name)}</span>
                          )}
                        </div>
                        <span className="truncate font-medium text-foreground underline-offset-4 hover:underline">
                          {name}
                        </span>
                      </Link>
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <FragmentCell key={col.id}>
                        {renderColumnCell(col.id, employee)}
                      </FragmentCell>
                    ))}
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          to="/dashboard/employees/$id"
                          params={{ id: employee.id }}
                          aria-label={`View ${name}`}
                        >
                          Open
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {footer ? <div className="shrink-0">{footer}</div> : null}
      </CardContent>
    </Card>
  );
};

/** Avoid nested TableCell when renderColumnCell already returns TableCell. */
const FragmentCell = ({ children }: { children: ReactNode }) => <>{children}</>;
