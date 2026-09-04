import { CalendarDays, Mail, Phone, UserRound } from "lucide-react";
import type {
  EmployeeDetail,
  EmployeeLinkedUser,
} from "~/api-services/employees.types";
import { EmployeeBannerParticles } from "~/components/employees/employee-banner-particles";
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
        "tito-widget tito-brand-surface employee-detail-banner animate-employee-card overflow-hidden border-border/40",
        className,
      )}
      aria-label={`${name} profile`}
    >
      <div
        className="tito-brand-surface__orb tito-brand-surface__orb--lime"
        aria-hidden
      />
      <div
        className="tito-brand-surface__orb tito-brand-surface__orb--sky"
        aria-hidden
      />
      <div className="tito-brand-surface__sheen" aria-hidden />
      <EmployeeBannerParticles />

      <div
        className={cn(
          "employee-detail-banner__content grid gap-5 p-5 sm:gap-6 sm:p-6 xl:p-7",
          "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-8",
          "xl:grid-cols-[minmax(280px,1.15fr)_minmax(360px,1.35fr)_minmax(220px,0.85fr)] xl:gap-10",
          "2xl:grid-cols-[minmax(320px,1.2fr)_minmax(420px,1.4fr)_minmax(260px,0.9fr)] 2xl:gap-12",
        )}
      >
        {/* Identity */}
        <div className="flex min-w-0 items-start gap-4 sm:items-center xl:gap-5">
          <div
            className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-muted text-base font-semibold text-foreground sm:size-16 xl:size-20 xl:text-lg 2xl:size-24 2xl:text-xl"
            aria-hidden={photoUrl ? undefined : true}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span>{initialsFrom(name)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2.5 xl:space-y-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl xl:text-[1.75rem] xl:leading-tight 2xl:text-3xl">
                {name}
              </h1>
              {position !== emptyValue || department !== emptyValue ? (
                <p className="mt-1 truncate text-sm text-muted-foreground xl:text-base">
                  {position !== emptyValue ? position : null}
                  {position !== emptyValue && department !== emptyValue
                    ? " · "
                    : null}
                  {department !== emptyValue ? department : null}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground xl:px-2.5 xl:py-1 xl:text-xs">
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

        {/* Contact facts */}
        <div
          className={cn(
            "min-w-0 border-t border-border/40 pt-4",
            "lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8",
            "xl:pl-10",
          )}
        >
          <p className="mb-3 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase xl:mb-4">
            Contact & tenure
          </p>
          <ul
            className={cn(
              "grid gap-3",
              "sm:grid-cols-2",
              "xl:grid-cols-2 xl:gap-x-6 xl:gap-y-4",
              "2xl:grid-cols-4 2xl:gap-5",
            )}
            aria-label="Contact"
          >
            <FactCell icon={Mail} label="Email" value={email} />
            <FactCell icon={Phone} label="Phone" value={phone} />
            <FactCell icon={CalendarDays} label="Joined" value={joinDate} />
            <FactCell
              icon={UserRound}
              label="Civil status"
              value={civilStatus}
            />
          </ul>
        </div>

        {/* Benefits */}
        <div
          className={cn(
            "min-w-0 border-t border-border/40 pt-4",
            "lg:col-span-2 lg:border-t lg:pt-4",
            "xl:col-span-1 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-10",
          )}
        >
          <p className="mb-3 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase xl:mb-4">
            Benefits
          </p>
          <ul
            className={cn(
              "grid gap-2",
              "grid-cols-2 sm:grid-cols-4",
              "lg:grid-cols-4",
              "xl:grid-cols-1 xl:gap-2.5",
              "2xl:grid-cols-2",
            )}
          >
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
    </section>
  );
};

const FactCell = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) => (
  <li className="fact-cell min-w-0 rounded-lg border border-border/40 px-3 py-2.5 xl:px-3.5 xl:py-3">
    <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
      <Icon className="size-3 shrink-0" aria-hidden />
      {label}
    </div>
    <p
      className="mt-1 truncate text-sm font-medium text-foreground xl:text-[0.95rem]"
      title={value}
    >
      {value}
    </p>
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
        "inline-flex min-w-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs xl:px-3 xl:py-2 xl:text-sm",
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
      <span className="truncate text-[11px] text-current/70 xl:text-xs">
        {coverage === "yes"
          ? detail || "Covered"
          : coverage === "no"
            ? "Not covered"
            : "Unknown"}
      </span>
    </li>
  );
};
