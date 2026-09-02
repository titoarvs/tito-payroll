import {
  Building2,
  CalendarDays,
  HeartPulse,
  Mail,
  Phone,
  Shield,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  EmployeeDetail,
  EmployeeLinkedUser,
} from "~/api-services/employees.types";
import {
  employmentStatusBadge,
  formatEmployeeDate,
  initialsFrom,
  isHttpImage,
  titleCaseStatus,
} from "~/components/employees/employee-display";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface EmployeeDetailHeaderProps {
  employee: EmployeeDetail;
  linkedUser?: EmployeeLinkedUser | null;
  className?: string;
  /** Optional third column (e.g. pay snapshot) for ops detail page. */
  aside?: ReactNode;
}

const emptyValue = "—";

const coverageLabel = (covered: boolean | undefined): string =>
  covered === true ? "Covered" : covered === false ? "Not covered" : emptyValue;

export const EmployeeDetailHeader = ({
  employee,
  linkedUser = null,
  className,
  aside,
}: EmployeeDetailHeaderProps) => {
  const name = [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const photoUrl = isHttpImage(linkedUser?.image) ? linkedUser.image : null;
  const position = employee.position?.trim() || emptyValue;
  const department = employee.department?.trim() || emptyValue;
  const employmentType = employee.employmentStatus
    ? titleCaseStatus(employee.employmentStatus)
    : emptyValue;
  const statusPill = employmentStatusBadge(employee.employmentStatus);
  const email = employee.email?.trim() || emptyValue;
  const phone = employee.phoneNumber?.trim() || emptyValue;
  const civilStatus = employee.civilStatus?.trim()
    ? titleCaseStatus(employee.civilStatus)
    : emptyValue;
  const joinDate = formatEmployeeDate(employee.startDate);
  const isActive = employee.isActive;
  const hasAside = Boolean(aside);

  return (
    <div
      className={cn(
        "grid w-full min-w-0 gap-4 lg:gap-5",
        hasAside ? "lg:grid-cols-12" : "lg:grid-cols-2",
        className,
      )}
    >
      <section
        className={cn(
          "tito-widget animate-employee-card overflow-hidden",
          hasAside && "lg:col-span-4",
        )}
        aria-label={`${name} profile`}
      >
        <div
          className="relative flex flex-col items-center px-6 pt-8 pb-6 text-center"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--tito-green) 14%, var(--card)) 0%, var(--card) 72%)",
          }}
        >
          <div
            className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-muted text-2xl font-semibold text-foreground shadow-sm"
            aria-hidden={photoUrl ? undefined : true}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span>{initialsFrom(name)}</span>
            )}
          </div>

          <h2 className="mt-4 max-w-full truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {name}
          </h2>
          <p className="mt-1 truncate text-sm font-medium text-foreground/80">
            {position}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {department}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border/60 bg-card px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              #{employee.employeeCode}
            </span>
            <Badge variant={isActive ? "success" : "muted"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        <div className="space-y-0 border-t border-border/40 px-5 py-4">
          <DetailRow
            icon={UserRound}
            label="Employment type"
            value={
              <Badge
                variant={statusPill.variant}
                className={cn("gap-1.5 font-medium", statusPill.className)}
              >
                <span
                  className="size-1.5 shrink-0 rounded-full bg-current opacity-80"
                  aria-hidden
                />
                {employmentType}
              </Badge>
            }
          />
          <DetailRow
            icon={CalendarDays}
            label="Join date"
            value={joinDate}
            last
          />
        </div>
      </section>

      <section
        className={cn(
          "tito-widget animate-employee-card space-y-5 p-5 sm:p-6",
          hasAside && "lg:col-span-4",
        )}
        aria-label="Personal information"
        style={{ animationDelay: "40ms" }}
      >
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Personal info
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Contact and civil details on file.
          </p>
        </div>

        <div className="space-y-0">
          <DetailRow icon={Mail} label="Email" value={email} />
          <DetailRow icon={Phone} label="Phone" value={phone} />
          <DetailRow
            icon={Building2}
            label="Civil status"
            value={civilStatus}
            last
          />
        </div>

        <div className="border-t border-border/40 pt-4">
          <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <Shield className="size-3.5" aria-hidden />
            Benefits
          </h4>
          <ul className="grid gap-2 sm:grid-cols-2">
            <BenefitPill
              label="SSS"
              value={coverageLabel(employee.sssCovered)}
            />
            <BenefitPill
              label="PhilHealth"
              value={coverageLabel(employee.philhealthCovered)}
            />
            <BenefitPill
              label="Pag-IBIG"
              value={coverageLabel(employee.pagibigCovered)}
            />
            <BenefitPill
              label="HMO"
              value={
                employee.withHmo
                  ? employee.hmoProvider?.trim() || "Covered"
                  : employee.withHmo === false
                    ? "Not covered"
                    : emptyValue
              }
              icon
            />
          </ul>
        </div>
      </section>

      {hasAside ? (
        <div className="min-h-0 lg:col-span-4">{aside}</div>
      ) : null}
    </div>
  );
};

const DetailRow = ({
  icon: Icon,
  label,
  value,
  last = false,
}: {
  icon: typeof Mail;
  label: string;
  value: ReactNode;
  last?: boolean;
}) => (
  <div
    className={cn(
      "flex items-start gap-3 py-2.5",
      !last && "border-b border-border/30",
    )}
  >
    <Icon
      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      aria-hidden
    />
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-0.5 text-sm font-medium break-words text-foreground">
        {value}
      </div>
    </div>
  </div>
);

const BenefitPill = ({
  label,
  value,
  icon = false,
}: {
  label: string;
  value: string;
  icon?: boolean;
}) => (
  <li className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/30 px-3 py-2">
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {icon ? <HeartPulse className="size-3.5" aria-hidden /> : null}
      {label}
    </span>
    <span className="truncate text-xs font-medium text-foreground">{value}</span>
  </li>
);
