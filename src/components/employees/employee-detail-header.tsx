import type {
  EmployeeDetail,
  EmployeeLinkedUser,
} from "~/api-services/employees.types";
import { cn } from "~/lib/utils";

interface EmployeeDetailHeaderProps {
  employee: EmployeeDetail;
  linkedUser?: EmployeeLinkedUser | null;
  className?: string;
}

const isHttpImage = (image: string | null | undefined): image is string =>
  typeof image === "string" && /^https?:\/\//i.test(image);

const displayName = (employee: EmployeeDetail): string =>
  [employee.firstName, employee.lastName].filter(Boolean).join(" ").trim();

const initialsFrom = (name: string): string => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
};

const titleCaseStatus = (status: string): string =>
  status
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const MailIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    aria-hidden="true"
  >
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" />
  </svg>
);

const emptyValue = "—";

export const EmployeeDetailHeader = ({
  employee,
  linkedUser = null,
  className,
}: EmployeeDetailHeaderProps) => {
  const name = displayName(employee);
  const photoUrl = isHttpImage(linkedUser?.image) ? linkedUser.image : null;
  const position = employee.position?.trim() || emptyValue;
  const department = employee.department?.trim() || emptyValue;
  const employmentType = employee.employmentStatus
    ? titleCaseStatus(employee.employmentStatus)
    : emptyValue;
  const email = employee.email?.trim() || emptyValue;
  const phone = employee.phoneNumber?.trim() || emptyValue;
  const isActive = employee.isActive;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        className,
      )}
      aria-label={`${name} profile summary`}
    >
      <div
        className="relative h-28 overflow-hidden bg-sky-50 dark:bg-sky-950/40"
        aria-hidden="true"
      >
        <div className="absolute -right-8 -top-16 h-56 w-56 rounded-full border-[3px] border-sky-200/80 dark:border-sky-700/50" />
        <div className="absolute -right-2 -top-4 h-44 w-44 rounded-full border-[3px] border-sky-300/70 dark:border-sky-600/40" />
      </div>

      <div className="relative px-6 pb-6 pt-0 sm:px-8">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-end gap-4">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-muted text-lg font-semibold text-foreground shadow-sm"
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
            <div className="min-w-0 pb-1">
              <h2 className="truncate text-2xl font-semibold tracking-tight text-foreground">
                {name}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                #{employee.employeeCode}
                <span aria-hidden="true"> • </span>
                {position}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start sm:self-end sm:pb-1">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Department</p>
            <div className="mt-1.5">
              {department === emptyValue ? (
                <span className="text-sm text-foreground">{emptyValue}</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-0.5 text-sm text-foreground">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-sky-500"
                    aria-hidden="true"
                  />
                  {department}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Employment Type</p>
            <p className="mt-1.5 text-sm font-medium text-teal-600 dark:text-teal-400">
              {employmentType}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="mt-1.5 flex items-start gap-2 text-sm text-foreground">
              <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 break-all">{email}</span>
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Phone Number</p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-foreground">
              <PhoneIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate">{phone}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
