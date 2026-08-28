import { Link } from "@tanstack/react-router";
import type { EmployeeListItem } from "~/api-services/employees.types";
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
import { cn } from "~/lib/utils";

interface EmployeeCardProps {
  employee: EmployeeListItem;
  className?: string;
}

export const EmployeeCard = ({ employee, className }: EmployeeCardProps) => {
  const name = displayName(employee);
  const position = positionLabel(employee);
  const photoUrl = isHttpImage(employee.userImage)
    ? employee.userImage
    : null;

  return (
    <Link
      to="/dashboard/employees/$id"
      params={{ id: employee.id }}
      className={cn(
        "tito-widget card-hover-lift block p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      aria-label={`View ${name}, ${position}`}
    >
      <div className="flex flex-col gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-muted text-sm font-semibold text-foreground"
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
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {name}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{position}</p>
        </div>
        <dl className="grid grid-cols-1 gap-2 border-t border-border/60 pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Employee ID</dt>
            <dd className="truncate font-mono text-xs text-foreground">
              {employeeCodeLabel(employee)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Department</dt>
            <dd className="truncate text-foreground">
              {departmentLabel(employee)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="truncate text-foreground">
              {titleCaseStatus(employee.employmentStatus)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Hire date</dt>
            <dd className="tabular-nums text-foreground">
              {formatEmployeeDate(employee.startDate)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="tabular-nums text-foreground">
              {formatEmployeeDate(employee.createdAt)}
            </dd>
          </div>
        </dl>
      </div>
    </Link>
  );
};

interface EmployeeCardGridProps {
  employees: EmployeeListItem[];
  className?: string;
}

export const EmployeeCardGrid = ({
  employees,
  className,
}: EmployeeCardGridProps) => (
  <ul
    className={cn(
      "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className,
    )}
    aria-label="Employee roster cards"
  >
    {employees.map((employee) => (
      <li key={employee.id}>
        <EmployeeCard employee={employee} />
      </li>
    ))}
  </ul>
);
