import { format } from "date-fns";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { PayrollSalaryRate } from "~/api-services/salary-rates.types";
import {
  formatPayRunDate,
  formatPayslipMoney,
  monthlyAllowanceFromCutoff,
} from "~/components/pay-runs/pay-run-display";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  TableColumnVisibility,
  useTableColumns,
  type TableColumnDef,
} from "~/components/ui/table-column-visibility";
import {
  useCreateEmployeeSalaryRate,
  useEmployeeSalaryRates,
} from "~/hooks/use-salary-rates";
import { useCurrentUser } from "~/hooks/use-current-user";
import { HrisApiError } from "~/lib/hris-api-client";
import {
  canManageEmployeeSalaryRates,
  canViewEmployeeSalaryRates,
} from "~/lib/payroll-access";
import { cn } from "~/lib/utils";

/** Standard payroll conversion: monthly ÷ 22 days ÷ 8 hours. */
const HOURS_PER_MONTH = 22 * 8;

type SalaryRateHistoryColumnId = "to" | "monthly" | "hourly" | "status";

const SALARY_RATE_HISTORY_COLUMN_DEFS: TableColumnDef<SalaryRateHistoryColumnId>[] =
  [
    { id: "to", label: "To" },
    { id: "monthly", label: "Monthly" },
    { id: "hourly", label: "Hourly" },
    { id: "status", label: "Status" },
  ];

const SALARY_RATE_HISTORY_COLUMNS_STORAGE_KEY =
  "payroll.salary-rates-history.tableColumns.v1";

const MONEY_RE = /^\d+(\.\d{1,2})?$/;

const cleanMoney = (value: string) => value.replace(/,/g, "").trim();

const hourlyFromMonthly = (monthly: string): string => {
  const cleaned = cleanMoney(monthly);
  if (!MONEY_RE.test(cleaned)) return "";
  const cents = Math.round(Number(cleaned) * 100);
  if (!Number.isFinite(cents) || cents <= 0) return "";
  return (cents / 100 / HOURS_PER_MONTH).toFixed(2);
};

const todayIsoDate = () => format(new Date(), "yyyy-MM-dd");

const renderSalaryRateHistoryCell = (
  id: SalaryRateHistoryColumnId,
  rate: PayrollSalaryRate,
): ReactNode => {
  switch (id) {
    case "to":
      return (
        <TableCell key={id} className="whitespace-nowrap text-xs">
          {formatPayRunDate(rate.effectiveTo)}
        </TableCell>
      );
    case "monthly":
      return (
        <TableCell key={id} className="tabular-nums text-sm font-medium">
          {formatPayslipMoney(rate.monthlySalary)}
        </TableCell>
      );
    case "hourly":
      return (
        <TableCell key={id} className="tabular-nums text-sm">
          {formatPayslipMoney(rate.hourlyRate)}
        </TableCell>
      );
    case "status":
      return (
        <TableCell key={id}>
          {rate.isActive ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Inactive</span>
          )}
        </TableCell>
      );
  }
};

type EmployeeSalaryRatesTableProps = {
  employeeId: string;
  className?: string;
};

export const EmployeeSalaryRatesTable = ({
  employeeId,
  className,
}: EmployeeSalaryRatesTableProps) => {
  const { data: user, isPending: isUserPending } = useCurrentUser();
  const canView = canViewEmployeeSalaryRates(user);
  const canManage = canManageEmployeeSalaryRates(user);

  const { data, isPending, isError, error } = useEmployeeSalaryRates(
    employeeId,
    { enabled: Boolean(employeeId) && canView },
  );
  const createMutation = useCreateEmployeeSalaryRate(employeeId);
  const { columns, setColumns, visibleIds, labelById } = useTableColumns(
    SALARY_RATE_HISTORY_COLUMNS_STORAGE_KEY,
    SALARY_RATE_HISTORY_COLUMN_DEFS,
  );

  const forbidden =
    error instanceof HrisApiError &&
    (error.status === 401 || error.status === 403);
  const noLinkedUser =
    error instanceof HrisApiError &&
    error.status === 400 &&
    /linked account/i.test(error.message);

  const employeePay = data?.data.employee;
  const rates = data?.data.rates ?? [];
  const active = rates.find((r) => r.isActive) ?? rates[0] ?? null;

  const [monthlySalary, setMonthlySalary] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [allowance, setAllowance] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayIsoDate);
  const [hourlyTouched, setHourlyTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeePay && !active) return;
    setMonthlySalary(
      employeePay?.salary?.trim() || active?.monthlySalary?.trim() || "",
    );
    setHourlyRate(
      employeePay?.hourlyRate?.trim() || active?.hourlyRate?.trim() || "",
    );
    setAllowance(employeePay?.allowance?.trim() || "");
    setEffectiveFrom(active?.effectiveFrom?.slice(0, 10) || todayIsoDate());
    setHourlyTouched(false);
    setFormError(null);
  }, [employeePay, active]);

  const allowanceMonthly = useMemo(() => {
    const cleaned = cleanMoney(allowance);
    if (!cleaned || !MONEY_RE.test(cleaned)) return "";
    return monthlyAllowanceFromCutoff(cleaned);
  }, [allowance]);

  if (isUserPending) {
    return null;
  }

  if (!canView || (isError && forbidden)) {
    return null;
  }

  const onMonthlyChange = (value: string) => {
    setMonthlySalary(value);
    if (!hourlyTouched) {
      setHourlyRate(hourlyFromMonthly(value));
    }
  };

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    if (!canManage) return;
    setFormError(null);

    const monthly = cleanMoney(monthlySalary);
    const hourly = cleanMoney(hourlyRate);
    const allowanceValue = cleanMoney(allowance);

    if (!MONEY_RE.test(monthly) || Number(monthly) <= 0) {
      setFormError("Enter a valid monthly salary.");
      return;
    }
    if (!MONEY_RE.test(hourly) || Number(hourly) <= 0) {
      setFormError("Enter a valid hourly rate.");
      return;
    }
    if (allowanceValue && !MONEY_RE.test(allowanceValue)) {
      setFormError("Allowance must be a valid amount.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
      setFormError("Pick an effective-from date.");
      return;
    }

    createMutation.mutate({
      monthlySalary: monthly,
      hourlyRate: hourly,
      allowance: allowanceValue || null,
      effectiveFrom,
      effectiveTo: null,
    });
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="gap-1 pb-4">
        <CardTitle className="text-base">Salary and rates</CardTitle>
        <CardDescription>
          {canManage
            ? "Set the active monthly salary, hourly rate, and allowance. Saving creates a new Clock rate and syncs employee pay fields."
            : "Active monthly salary, hourly rate, and allowance. Contact payroll ops to change rates."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPending ? (
          <div
            className="space-y-3"
            role="status"
            aria-label="Loading salary rates"
          >
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </div>
        ) : null}

        {!isPending && isError ? (
          <p className="text-sm text-muted-foreground" role="status">
            {noLinkedUser
              ? canManage
                ? "Link an account before viewing or editing salary rates."
                : "Link an account before viewing salary rates."
              : error instanceof HrisApiError
                ? error.message
                : "Salary rates unavailable."}
          </p>
        ) : null}

        {!isPending && !isError && canManage ? (
          <form
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={handleSave}
          >
            <div className="space-y-1.5">
              <Label htmlFor="salary-monthly">Monthly salary</Label>
              <Input
                id="salary-monthly"
                inputMode="decimal"
                placeholder="50000.00"
                value={monthlySalary}
                onChange={(event) => onMonthlyChange(event.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salary-hourly">Hourly rate</Label>
              <Input
                id="salary-hourly"
                inputMode="decimal"
                placeholder="284.09"
                value={hourlyRate}
                onChange={(event) => {
                  setHourlyTouched(true);
                  setHourlyRate(event.target.value);
                }}
                disabled={createMutation.isPending}
              />
              <p className="text-[11px] text-muted-foreground">
                Auto from monthly ÷ 176 (22×8). Edit to override.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salary-allowance">Allowance / cutoff</Label>
              <Input
                id="salary-allowance"
                inputMode="decimal"
                placeholder="1000.00"
                value={allowance}
                onChange={(event) => setAllowance(event.target.value)}
                disabled={createMutation.isPending}
              />
              {allowanceMonthly ? (
                <p className="text-[11px] text-muted-foreground">
                  ≈ {formatPayslipMoney(allowanceMonthly)} / month
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salary-from">Effective from</Label>
              <Input
                id="salary-from"
                type="date"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
                disabled={createMutation.isPending}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
              {formError ? (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Current active values are loaded above. Save to publish a new
                  rate.
                </p>
              )}
              <Button
                type="submit"
                className="ml-auto"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Saving…" : "Save rate"}
              </Button>
            </div>
          </form>
        ) : null}

        {!isPending && !isError && !canManage ? (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Monthly salary</dt>
              <dd className="mt-1 text-sm font-medium tabular-nums">
                {formatPayslipMoney(monthlySalary || null)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Hourly rate</dt>
              <dd className="mt-1 text-sm font-medium tabular-nums">
                {formatPayslipMoney(hourlyRate || null)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Allowance / cutoff
              </dt>
              <dd className="mt-1 text-sm font-medium tabular-nums">
                {formatPayslipMoney(allowance || null)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Effective from</dt>
              <dd className="mt-1 text-sm font-medium">
                {formatPayRunDate(effectiveFrom)}
              </dd>
            </div>
          </dl>
        ) : null}

        {!isPending && !isError ? (
          <div className="space-y-3 border-t border-border/50 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Rate history
                </h3>
                <p className="text-xs text-muted-foreground">
                  {canManage
                    ? "Newest first. Saving deactivates the previous active rate."
                    : "Newest first."}
                </p>
              </div>
              <TableColumnVisibility
                columns={columns}
                labelById={labelById}
                onChange={setColumns}
                lockedHint="From stays fixed."
              />
            </div>

            {rates.length === 0 ? (
              <p className="text-sm text-muted-foreground" role="status">
                {canManage
                  ? "No salary rates yet. Save a rate to start history."
                  : "No salary rates yet."}
              </p>
            ) : (
              <div className="-mx-6 overflow-x-auto sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      {visibleIds.map((id) => (
                        <TableHead key={id}>{labelById[id]}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatPayRunDate(rate.effectiveFrom)}
                        </TableCell>
                        {visibleIds.map((id) =>
                          renderSalaryRateHistoryCell(id, rate),
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
