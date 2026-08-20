import { Link } from "@tanstack/react-router";
import type { EmployeeListItem } from "~/api-services/employees.types";
import { cn } from "~/lib/utils";

interface EmployeeCardProps {
  employee: EmployeeListItem;
  className?: string;
}

const isHttpImage = (image: string | null | undefined): image is string =>
  typeof image === "string" && /^https?:\/\//i.test(image);

const displayName = (employee: EmployeeListItem): string =>
  [employee.firstName, employee.lastName].filter(Boolean).join(" ").trim();

const initialsFrom = (name: string): string => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
};

export const EmployeeCard = ({ employee, className }: EmployeeCardProps) => {
  const name = displayName(employee);
  const position = employee.position?.trim() || "—";
  const photoUrl = isHttpImage(employee.userImage)
    ? employee.userImage
    : null;

  return (
    <Link
      to="/dashboard/employees/$id"
      params={{ id: employee.id }}
      className={cn(
        "relative block overflow-hidden rounded-3xl border border-white/60 bg-card/70 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md transition-shadow hover:shadow-[0_12px_36px_rgba(15,23,42,0.1)] dark:border-white/10 dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.45)]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-20 before:bg-linear-to-t before:from-sky-100/40 before:to-transparent dark:before:from-sky-950/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      aria-label={`View ${name}, ${position}`}
    >
      <div className="relative z-10 flex flex-col gap-4">
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
      </div>
    </Link>
  );
};

interface EmployeeCardGridProps {
  employees: EmployeeListItem[];
}

export const EmployeeCardGrid = ({ employees }: EmployeeCardGridProps) => (
  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {employees.map((employee) => (
      <li key={employee.id}>
        <EmployeeCard employee={employee} />
      </li>
    ))}
  </ul>
);
