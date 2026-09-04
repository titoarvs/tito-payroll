import { CalendarDays, Mail, Phone, UserRound } from "lucide-react";
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
}

const emptyValue = "—";

type Coverage = "yes" | "no" | "unknown";

const toCoverage = (covered: boolean | undefined): Coverage =>
  covered === true ? "yes" : covered === false ? "no" : "unknown";

export const EmployeeDetailHeader = ({
  employee,
  linkedUser = null,
  className,
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

  const benefits: { label: string; coverage: Coverage; detail?: string }[] = [
    { label: "SSS", coverage: toCoverage(employee.sssCovered) },
    { label: "PhilHealth", coverage: toCoverage(employee.philhealthCovered) },
    { label: "Pag-IBIG", coverage: toCoverage(employee.pagibigCovered) },
    {
      label: "HMO",
      coverage:
        employee.withHmo === true
          ? "yes"
          : employee.withHmo === false
            ? "no"
            : "unknown",
      detail:
        employee.withHmo && employee.hmoProvider?.trim()
          ? employee.hmoProvider.trim()
          : undefined,
    },
  ];

  return (
    <section
      className={cn(
        "tito-widget animate-employee-card overflow-hidden",
        className,
      )}
      aria-label={`${name} profile`}
    >
      <div className="flex flex-col gap-5 p-5 sm:gap-6 sm:p-6 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
          <div
            className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-muted text-base font-semibold text-foreground sm:size-16"
            aria-hidden={photoUrl ? undefined : true}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span>{initialsFrom(name)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {name}
              </h1>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {position}
                {department !== emptyValue ? ` · ${department}` : null}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {employee.employeeCode}
              </span>
              <Badge variant={isActive ? "success" : "muted"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
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
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-col gap-4 border-t border-border/40 pt-4",
            "lg:max-w-xl lg:flex-1 lg:flex-row lg:items-center lg:gap-6 lg:border-t-0 lg:pt-0",
          )}
        >
          <ul className="min-w-0 flex-1 space-y-2" aria-label="Contact">
            <ContactRow icon={Mail} label="Email" value={email} />
            <ContactRow icon={Phone} label="Phone" value={phone} />
            <ContactRow icon={CalendarDays} label="Joined" value={joinDate} />
            <ContactRow icon={UserRound} label="Civil status" value={civilStatus} />
          </ul>

          <div
            className={cn(
              "shrink-0 border-t border-border/40 pt-4",
              "lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6",
            )}
          >
            <p className="sr-only">Benefits</p>
            <ul className="flex flex-wrap gap-1.5 lg:w-44 lg:flex-col">
              {benefits.map((item) => (
                <BenefitChip
                  key={item.label}
                  label={item.label}
                  coverage={item.coverage}
                  detail={item.detail}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) => (
  <li className="flex min-w-0 items-center gap-2.5 text-sm">
    <Icon
      className="size-3.5 shrink-0 text-muted-foreground"
      aria-hidden
    />
    <span className="sr-only">{label}</span>
    <span
      className="min-w-0 truncate font-medium text-foreground"
      title={value}
    >
      {value}
    </span>
  </li>
);

const BenefitChip = ({
  label,
  coverage,
  detail,
}: {
  label: string;
  coverage: Coverage;
  detail?: string;
}) => {
  const title =
    coverage === "yes"
      ? detail
        ? `${label}: ${detail}`
        : `${label}: Covered`
      : coverage === "no"
        ? `${label}: Not covered`
        : `${label}: Unknown`;

  return (
    <li
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
        coverage === "yes" &&
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
        coverage === "no" &&
          "border-border/50 bg-muted/40 text-muted-foreground",
        coverage === "unknown" &&
          "border-border/40 bg-transparent text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          coverage === "yes" && "bg-emerald-500",
          coverage === "no" && "bg-muted-foreground/40",
          coverage === "unknown" && "bg-muted-foreground/25",
        )}
        aria-hidden
      />
      <span className="font-medium">{label}</span>
      {detail ? (
        <span className="max-w-[6rem] truncate text-muted-foreground">
          {detail}
        </span>
      ) : null}
      <span className="sr-only">
        {coverage === "yes"
          ? "covered"
          : coverage === "no"
            ? "not covered"
            : "unknown"}
      </span>
    </li>
  );
};
