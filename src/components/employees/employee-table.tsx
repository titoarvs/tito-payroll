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
import { SortableEmployeeTableHead } from "~/components/employees/employee-table-sort";
import { EMPLOYEE_ROSTER_TABLE_BODY_CLASS } from "~/components/employees/employee-roster-skeleton";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
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
  footer?: ReactNode;
  className?: string;
  isRefreshing?: boolean;
}

export const EmployeeTable = ({
  employees,
  sortBy,
  sortDir,
  onSort,
  footer,
  className,
  isRefreshing = false,
}: EmployeeTableProps) => (
  <Card
    className={cn("flex flex-col overflow-hidden", className)}
    aria-label="Employee roster table"
  >
    <CardContent className="flex flex-col p-0">
      <div
        className={cn(
          EMPLOYEE_ROSTER_TABLE_BODY_CLASS,
          isRefreshing && "opacity-60",
        )}
        aria-busy={isRefreshing}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 shadow-[0_1px_0_0_hsl(var(--border))] [&_th]:bg-card">
            <TableRow>
              <SortableEmployeeTableHead
                label="Employee"
                sortKey="name"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="min-w-[12rem]"
              />
              <TableHead className="min-w-[8rem]">Employee ID</TableHead>
              <SortableEmployeeTableHead
                label="Department"
                sortKey="department"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="min-w-[8rem]"
              />
              <SortableEmployeeTableHead
                label="Position"
                sortKey="position"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="min-w-[8rem]"
              />
              <SortableEmployeeTableHead
                label="Status"
                sortKey="status"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="min-w-[6rem]"
              />
              <SortableEmployeeTableHead
                label="Hire date"
                sortKey="start_date"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="min-w-[6rem] whitespace-nowrap"
              />
              <TableHead className="min-w-[6rem] whitespace-nowrap">
                Created
              </TableHead>
              <TableHead className="w-28 min-w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => {
              const name = displayName(employee);
              const photoUrl = isHttpImage(employee.userImage)
                ? employee.userImage
                : null;

              return (
                <TableRow key={employee.id}>
                  <TableCell className="max-w-[16rem]">
                    <div className="flex min-w-0 items-center gap-3">
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
                      <span className="truncate font-medium text-foreground">
                        {name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[10rem] truncate font-mono text-xs text-muted-foreground">
                    {employeeCodeLabel(employee)}
                  </TableCell>
                  <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                    {departmentLabel(employee)}
                  </TableCell>
                  <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                    {positionLabel(employee)}
                  </TableCell>
                  <TableCell className="max-w-[8rem] truncate text-muted-foreground">
                    {titleCaseStatus(employee.employmentStatus)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                    {formatEmployeeDate(employee.startDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                    {formatEmployeeDate(employee.createdAt)}
                  </TableCell>
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
