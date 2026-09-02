import { Banknote } from "lucide-react";
import {
  formatPayRunDate,
  formatPayslipMoney,
  monthlyAllowanceFromCutoff,
} from "~/components/pay-runs/pay-run-display";
import { Skeleton } from "~/components/ui/skeleton";
import { useEmployeeSalaryRates } from "~/hooks/use-salary-rates";
import { HrisApiError } from "~/lib/hris-api-client";
import { cn } from "~/lib/utils";

type EmployeePaySnapshotProps = {
  employeeId: string;
  className?: string;
};

export const EmployeePaySnapshot = ({
  employeeId,
  className,
}: EmployeePaySnapshotProps) => {
  const { data, isPending, isError, error } = useEmployeeSalaryRates(
    employeeId,
    { enabled: Boolean(employeeId) },
  );

  const forbidden =
    error instanceof HrisApiError &&
    (error.status === 401 || error.status === 403);
  const noLinkedUser =
    error instanceof HrisApiError &&
    error.status === 400 &&
    /linked account/i.test(error.message);

  if (isError && forbidden) {
    return null;
  }

  const employeePay = data?.data.employee;
  const rates = data?.data.rates ?? [];
  const active = rates.find((r) => r.isActive) ?? rates[0] ?? null;
  const monthly = employeePay?.salary ?? active?.monthlySalary ?? null;
  const hourly = employeePay?.hourlyRate ?? active?.hourlyRate ?? null;
  const allowance = employeePay?.allowance ?? null;
  const allowanceMonthly = allowance
    ? monthlyAllowanceFromCutoff(allowance)
    : "";
  const hasAmounts =
    (monthly != null && monthly.trim() !== "") ||
    (hourly != null && hourly.trim() !== "") ||
    (allowance != null && allowance.trim() !== "");

  return (
    <section
      className={cn(
        "tito-widget animate-employee-card flex h-full flex-col p-5 sm:p-6",
        className,
      )}
      aria-label="Pay snapshot"
      style={{ animationDelay: "80ms" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
            <Banknote className="size-4 text-muted-foreground" aria-hidden />
            Pay snapshot
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Active rate synced for pay-run compute.
          </p>
        </div>
      </div>

      {isPending ? (
        <div className="mt-5 space-y-3" role="status" aria-label="Loading pay">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      ) : null}

      {!isPending && isError ? (
        <p className="mt-5 text-sm text-muted-foreground" role="status">
          {noLinkedUser
            ? "Link an account before setting salary rates."
            : error instanceof HrisApiError
              ? error.message
              : "Pay snapshot unavailable."}
        </p>
      ) : null}

      {!isPending && !isError && !hasAmounts ? (
        <p className="mt-5 text-sm text-muted-foreground" role="status">
          No rate on file.
        </p>
      ) : null}

      {!isPending && !isError && hasAmounts ? (
        <dl className="mt-5 flex-1 space-y-0">
          <PayRow label="Monthly salary" value={formatPayslipMoney(monthly)} />
          <PayRow label="Hourly rate" value={formatPayslipMoney(hourly)} />
          <PayRow
            label="Allowance / cutoff"
            value={formatPayslipMoney(allowance)}
          />
          {allowanceMonthly ? (
            <PayRow
              label="Allowance / month"
              value={formatPayslipMoney(allowanceMonthly)}
            />
          ) : null}
          {active?.effectiveFrom ? (
            <div className="border-t border-border/40 pt-3">
              <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Active from
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {formatPayRunDate(active.effectiveFrom)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
};

const PayRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-border/30 py-2.5 last:border-b-0">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="text-sm font-semibold tabular-nums text-foreground">
      {value}
    </dd>
  </div>
);
